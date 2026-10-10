import { a as newId } from "./utils-BkNFIPfO.mjs";
import { i as getSql } from "./db-BasGGAz9.mjs";
import { a as renewalFor, n as modeAfterCheckout, o as territoryPlan } from "./pricing-BxirjfBG.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/territory.server-B3nyeMic.js
function stamp(value) {
	if (value instanceof Date) return value.toISOString();
	return String(value ?? "");
}
function num(value) {
	if (value == null || value === "") return null;
	if (typeof value === "bigint") return Number(value);
	const n = typeof value === "number" ? value : Number(value);
	return Number.isFinite(n) ? n : null;
}
async function readLeadPreview(leadSlug) {
	const row = (await (await getSql())`
    select l.business_name, l.city, l.county, l.trade_type, l.trade_label, l.contact_name,
      l.review_score, l.review_count, l.account_mode,
      a.plan_id, a.plan_name, a.amount_cents, a.renewal_cents, a.renews_at,
      a.payment_ref, a.created_at as activated_at
    from preloaded_leads l
    left join territory_activations a on a.lead_slug = l.lead_slug
    where l.lead_slug = ${leadSlug}
    limit 1
  `)[0];
	if (!row) return null;
	const mode = row.account_mode === "live" ? "live" : "simulation";
	return {
		businessName: row.business_name,
		city: row.city,
		county: row.county,
		tradeType: row.trade_type,
		tradeLabel: row.trade_label ?? "",
		contactName: row.contact_name ?? "",
		reviewScore: num(row.review_score),
		reviewCount: num(row.review_count),
		mode,
		activation: row.plan_id ? {
			planId: row.plan_id,
			planName: row.plan_name ?? "",
			amountCents: num(row.amount_cents) ?? 0,
			renewalCents: num(row.renewal_cents),
			renewsAt: row.renews_at ? stamp(row.renews_at) : null,
			paymentRef: row.payment_ref ?? ""
		} : null
	};
}
async function openTerritoryCheckout(leadSlug, planId, processor) {
	const plan = territoryPlan(planId);
	if (!plan) throw new Error("Unknown plan");
	if (processor !== "stripe") throw new Error("Card checkout is required");
	const sql = await getSql();
	const lead = (await sql`
    select business_name, county, account_mode
    from preloaded_leads
    where lead_slug = ${leadSlug}
    limit 1
  `)[0];
	if (!lead) throw new Error("Unknown business");
	if (lead.account_mode === "live") throw new Error("This territory is already live");
	const checkoutId = newId("chk");
	await sql`
    insert into territory_checkouts (id, lead_slug, plan_id, amount_cents, processor)
    values (${checkoutId}, ${leadSlug}, ${plan.id}, ${plan.amountCents}, ${processor})
  `;
	return {
		checkoutId,
		plan,
		businessName: lead.business_name,
		county: lead.county
	};
}
async function finishDeskCheckout(_checkoutId, _paymentRef) {
	throw new Error("This territory goes live only after Stripe confirms the payment");
}
async function activateTerritory(input) {
	const plan = territoryPlan(input.planId);
	if (!plan) throw new Error("Unknown plan");
	const sql = await getSql();
	const lead = (await sql`
    select business_name, county from preloaded_leads where lead_slug = ${input.leadSlug} limit 1
  `)[0];
	if (!lead) throw new Error("Unknown business");
	if (!input.paymentRef.startsWith("cs_")) throw new Error("Payment was not confirmed");
	if (input.checkoutId) await sql`
      update territory_checkouts
      set status = 'paid', payment_ref = ${input.paymentRef}
      where id = ${input.checkoutId} and lead_slug = ${input.leadSlug} and status = 'pending'
    `;
	const renewal = renewalFor(plan.id, /* @__PURE__ */ new Date());
	const mode = modeAfterCheckout();
	await sql`
    update preloaded_leads
    set account_mode = ${mode}
    where lead_slug = ${input.leadSlug}
  `;
	const inserted = await sql`
    insert into territory_activations (
      id, lead_slug, business_name, county, plan_id, plan_name,
      amount_cents, renewal_cents, renews_at, payment_ref
    ) values (
      ${newId("act")}, ${input.leadSlug}, ${lead.business_name}, ${lead.county},
      ${plan.id}, ${plan.name}, ${plan.amountCents}, ${renewal.renewalCents},
      ${renewal.renewsAt}, ${input.paymentRef}
    )
    on conflict (lead_slug) do nothing
    returning id
  `;
	const row = (await sql`
    select business_name, county, plan_id, plan_name, amount_cents, renewal_cents,
      renews_at, payment_ref, created_at
    from territory_activations
    where lead_slug = ${input.leadSlug}
    limit 1
  `)[0];
	if (!row) throw new Error("Activation did not save");
	return {
		already: !inserted[0],
		leadSlug: input.leadSlug,
		businessName: row.business_name,
		county: row.county,
		planId: row.plan_id,
		planName: row.plan_name,
		amountCents: Number(row.amount_cents) || 0,
		renewalCents: row.renewal_cents == null ? null : Number(row.renewal_cents),
		renewsAt: row.renews_at ? stamp(row.renews_at) : null,
		paymentRef: row.payment_ref,
		createdAt: stamp(row.created_at),
		mode
	};
}
async function listActivations() {
	return (await (await getSql())`
    select id, lead_slug, business_name, county, plan_name, amount_cents,
      renewal_cents, renews_at, created_at
    from territory_activations
    order by created_at desc
    limit 12
  `).map((row) => ({
		id: row.id,
		leadSlug: row.lead_slug,
		businessName: row.business_name,
		county: row.county,
		planName: row.plan_name,
		amountCents: Number(row.amount_cents) || 0,
		renewalCents: row.renewal_cents == null ? null : Number(row.renewal_cents),
		renewsAt: row.renews_at ? stamp(row.renews_at) : null,
		createdAt: stamp(row.created_at)
	}));
}
//#endregion
export { activateTerritory, finishDeskCheckout, listActivations, openTerritoryCheckout, readLeadPreview };
