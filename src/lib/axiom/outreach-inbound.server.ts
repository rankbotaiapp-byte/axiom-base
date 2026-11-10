import { getSql } from "@/lib/db";
import { haltLeadDrip } from "./funnel-guard.server";
import { isMessagingOptOut, OPT_OUT_CONFIRMATION } from "./legal-notices";
import { toE164 } from "./notify-target";
import { shouldPauseSmsDrip, smsDripHaltReason } from "./sms-drip";

function formValue(body: URLSearchParams, key: string): string {
  return (body.get(key) ?? "").trim();
}

export async function handleOutreachInbound(request: Request): Promise<Response> {
  const raw = await request.text();
  const params = new URLSearchParams(raw.includes("=") ? raw : "");
  const from = toE164(formValue(params, "From") || formValue(params, "from"));
  const inbound = formValue(params, "Body") || formValue(params, "body");
  if (!from) return new Response("<?xml version=\"1.0\" encoding=\"UTF-8\"?><Response></Response>", {
    headers: { "content-type": "text/xml" },
  });
  const sql = await getSql();
  const digits = from.replace(/\D/g, "");
  const leads = await sql<{ lead_slug: string }>`
    select lead_slug from preloaded_leads
    where regexp_replace(coalesce(contact_phone, ''), '\\D', '', 'g') = ${digits}
      and lead_slug <> ''
    limit 8
  `.catch(() => [] as { lead_slug: string }[]);
  // Any inbound reply (including STOP) pauses the SMS drip for matched leads.
  const pauseEvent = isMessagingOptOut(inbound) ? "opt_out" : "reply";
  if (shouldPauseSmsDrip(pauseEvent)) {
    const reason = smsDripHaltReason(pauseEvent);
    for (const lead of leads) await haltLeadDrip(sql, lead.lead_slug, reason);
  }
  const confirm = isMessagingOptOut(inbound)
    ? `<Message>${OPT_OUT_CONFIRMATION}</Message>`
    : "";
  return new Response(`<?xml version="1.0" encoding="UTF-8"?><Response>${confirm}</Response>`, {
    headers: { "content-type": "text/xml" },
  });
}
