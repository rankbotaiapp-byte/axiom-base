import { t as __exportAll } from "./rolldown-runtime-D7D4PA-g.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/pricing-BxirjfBG.js
var pricing_exports = /* @__PURE__ */ __exportAll({
	TERRITORY_PLANS: () => TERRITORY_PLANS,
	modeAfterCheckout: () => modeAfterCheckout,
	pitchHref: () => pitchHref,
	renewalFor: () => renewalFor,
	territoryPlan: () => territoryPlan,
	territorySessionSettled: () => territorySessionSettled
});
/** Territory plans the preview and the pitch screen sell. Amounts are cents. */
var TERRITORY_PLANS = [
	{
		id: "trial",
		name: "30-Day Free Trial",
		amountCents: 0,
		cadence: "trial",
		summary: "$0 today. $497 a month starting day 31.",
		renewalCents: 49700
	},
	{
		id: "growth",
		name: "Managed Territory Growth Engine",
		amountCents: 49700,
		cadence: "month",
		summary: "$497 every month.",
		renewalCents: 49700
	},
	{
		id: "lifetime",
		name: "Lifetime Territory Monopoly",
		amountCents: 249700,
		cadence: "once",
		summary: "$2,497 once. The territory stays yours.",
		renewalCents: null
	}
];
var DAY_MS = 864e5;
function territoryPlan(id) {
	return TERRITORY_PLANS.find((plan) => plan.id === id) ?? null;
}
/** Day 31 of a trial is thirty days after the day they start. Growth bills again in thirty days. */
function renewalFor(planId, from) {
	const plan = territoryPlan(planId);
	if (!plan || plan.cadence === "once") return {
		renewsAt: null,
		renewalCents: null
	};
	return {
		renewsAt: new Date(from.getTime() + 30 * DAY_MS).toISOString(),
		renewalCents: plan.renewalCents
	};
}
/** Checkout always leaves simulation and lands in live production. */
function modeAfterCheckout() {
	return "live";
}
/**
* A paid session is settled. A 30-day trial settles only when Stripe completes
* checkout with nothing due today. Anything else stays in simulation.
*/
function territorySessionSettled(plan, paymentStatus) {
	if (paymentStatus === "paid") return true;
	return plan.cadence === "trial" && plan.amountCents === 0 && paymentStatus === "no_payment_required";
}
function pitchHref(lead) {
	const params = new URLSearchParams({
		b: lead.leadSlug,
		pitch: "1"
	});
	if (lead.county) params.set("county", lead.county);
	return `/?${params.toString()}`;
}
//#endregion
export { renewalFor as a, pricing_exports as i, modeAfterCheckout as n, territoryPlan as o, pitchHref as r, TERRITORY_PLANS as t };
