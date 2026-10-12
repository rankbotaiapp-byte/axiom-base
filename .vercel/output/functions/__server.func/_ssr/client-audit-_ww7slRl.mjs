import { i as createServerFn } from "./ssr.mjs";
import { t as createServerRpc } from "./createServerRpc--phiu8Av.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/client-audit-_ww7slRl.js
/** Answers from the trade's tap questions. Keys are the question ids. */
var submitClientAudit_createServerFn_handler = createServerRpc({
	id: "1549713d18f5387d1013c766b97ebb7a32b829aa76c44b2978e181c5edda20eb",
	name: "submitClientAudit",
	filename: "src/lib/axiom/client-audit.ts"
}, (opts) => submitClientAudit.__executeServer(opts));
var submitClientAudit = createServerFn({ method: "POST" }).validator((input) => {
	const tenantId = String(input?.tenantId ?? "").trim().slice(0, 80);
	const consumerName = String(input?.consumerName ?? "").trim().slice(0, 80);
	const consumerContact = String(input?.consumerContact ?? "").trim().slice(0, 120);
	const answers = {};
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
	if (!Number.isFinite(auditScore) || auditScore < 0 || auditScore > 100) throw new Error("Audit score is not usable");
	return {
		tenantId,
		consumerName,
		consumerContact,
		answers,
		auditScore
	};
}).handler(submitClientAudit_createServerFn_handler, async ({ data }) => {
	const { getSql } = await import("./db-BbGQAJUy.mjs").then((n) => n.n).then((n) => n.n);
	const sql = await getSql();
	if (!(await sql`select id from shops where id = ${data.tenantId} limit 1`)[0]) throw new Error("Shop not found");
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
	return { ok: true };
});
//#endregion
export { submitClientAudit_createServerFn_handler };
