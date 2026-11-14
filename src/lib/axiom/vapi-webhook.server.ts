import { getSql } from "@/lib/db";
import { env } from "@/lib/env.server";
import { newId } from "@/lib/utils";
import {
  parseVapiCompletion,
  readVapiSignature,
  vapiSignatureMatches,
} from "./vapi-webhook";

export async function handleVapiWebhook(request: Request): Promise<Response> {
  const secret = env("VAPI_WEBHOOK_SECRET");
  if (!secret) {
    return Response.json({ error: "Vapi webhook is not configured" }, { status: 503 });
  }
  const raw = await request.text();
  if (!vapiSignatureMatches(raw, readVapiSignature(request), secret)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  let payload: unknown;
  try {
    payload = raw ? JSON.parse(raw) : null;
  } catch {
    return Response.json({ error: "Invalid payload" }, { status: 400 });
  }

  const completion = parseVapiCompletion(payload);
  if (!completion) {
    return Response.json({ ok: true, ignored: true });
  }

  const sql = await getSql();
  const meta = JSON.stringify({
    source: "vapi",
    vapi_call_id: completion.callId,
    requested_service: completion.requestedService,
  });

  const existingLead = await sql<{ id: string }>`
    select id::text as id
    from consumer_leads
    where contact_meta->>'vapi_call_id' = ${completion.callId}
    limit 1
  `.catch(() => [] as { id: string }[]);

  let leadId = existingLead[0]?.id ?? "";
  if (!leadId) {
    const inserted = await sql<{ id: string }>`
      insert into consumer_leads (
        niche, contact_name, contact_phone, contact_meta, active
      ) values (
        ${completion.niche},
        ${completion.callerName},
        ${completion.callerPhone},
        ${meta}::jsonb,
        true
      )
      returning id::text as id
    `;
    leadId = inserted[0]?.id ?? "";
  } else {
    await sql`
      update consumer_leads
      set
        contact_name = case when ${completion.callerName} = '' then contact_name else ${completion.callerName} end,
        contact_phone = case when ${completion.callerPhone} = '' then contact_phone else ${completion.callerPhone} end,
        contact_meta = coalesce(contact_meta, '{}'::jsonb) || ${meta}::jsonb
      where id::text = ${leadId}
    `;
  }

  const requestId = newId("apr");
  const leadRef = leadId || null;
  await sql`
    insert into appointment_requests (
      id, consumer_lead_id, caller_name, caller_phone, requested_service, transcript, vapi_call_id, status
    ) values (
      ${requestId},
      ${leadRef},
      ${completion.callerName},
      ${completion.callerPhone},
      ${completion.requestedService},
      ${completion.transcript},
      ${completion.callId},
      ${"new"}
    )
    on conflict (vapi_call_id) do update set
      caller_name = excluded.caller_name,
      caller_phone = excluded.caller_phone,
      requested_service = excluded.requested_service,
      transcript = excluded.transcript
  `;

  return Response.json({
    ok: true,
    leadId,
    callId: completion.callId,
  });
}
