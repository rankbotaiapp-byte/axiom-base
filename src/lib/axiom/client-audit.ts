import { createServerFn } from "@tanstack/react-start";

/** Answers from the trade's tap questions. Keys are the question ids. */
export type ClientAuditDetails = Record<string, string>;

/** Public consumer audit. The shop id is the tenant, and the row lands in client_audit_submissions. */
export const submitClientAudit = createServerFn({ method: "POST" })
  .validator(
    (input: {
      tenantId?: string;
      consumerName?: string;
      consumerContact?: string;
      projectDetails?: ClientAuditDetails;
      auditScore?: number;
    }) => {
      const tenantId = String(input?.tenantId ?? "").trim().slice(0, 80);
      const consumerName = String(input?.consumerName ?? "").trim().slice(0, 80);
      const consumerContact = String(input?.consumerContact ?? "").trim().slice(0, 120);
      const answers: ClientAuditDetails = {};
      const raw = input?.projectDetails ?? {};
      for (const [key, value] of Object.entries(raw)) {
        const id = key.trim().slice(0, 40);
        if (!/^[a-zA-Z][a-zA-Z0-9_-]{0,39}$/.test(id)) continue;
        const text = String(value ?? "").trim().slice(0, 80);
        if (text) answers[id] = text;
      }
      const auditScore = Math.round(Number(input?.auditScore));
      if (!tenantId) throw new Error("Shop not found");
      if (consumerName.length < 2) throw new Error("Name required");
      if (consumerContact.length < 3) throw new Error("Phone or email required");
      if (Object.keys(answers).length < 1) throw new Error("A few answers are required");
      if (!Number.isFinite(auditScore) || auditScore < 0 || auditScore > 100) {
        throw new Error("Audit score is not usable");
      }
      return { tenantId, consumerName, consumerContact, answers, auditScore };
    },
  )
  .handler(async ({ data }) => {
    const { getSql } = await import("@/lib/db");
    const sql = await getSql();
    const shops = await sql<{ id: string }>`select id from shops where id = ${data.tenantId} limit 1`;
    if (!shops[0]) throw new Error("Shop not found");
    const details = JSON.stringify(data.answers);
    await sql`
      insert into client_audit_submissions (
        tenant_id, consumer_name, consumer_contact, property_or_project_details, audit_score
      ) values (
        ${data.tenantId},
        ${data.consumerName},
        ${data.consumerContact},
        ${details}::jsonb,
        ${data.auditScore}
      )
    `;
    return { ok: true as const };
  });
