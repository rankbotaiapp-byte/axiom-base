import { getSql, isDatabaseUnavailable } from "@/lib/db";
import {
  DEFAULT_PLUMBER_OUTREACH,
  PLUMBER_OUTREACH_SLUG,
  bidCents,
  checkDispatchMobile,
  emptyOutreachTenant,
  fillTemplate,
  outreachVars,
  parsePlumberOutreach,
  testDispatchAllowed,
  type OutreachTenant,
  type PlumberOutreachConfig,
} from "./plumber-outreach";

export type OutreachRead = {
  config: PlumberOutreachConfig;
  updatedAt: string | null;
  source: "saved" | "default";
};

export type OutreachPage = OutreachRead & {
  tenant: OutreachTenant;
  /** False when Stripe keys are missing — the CTA then routes to the studio's fallback link. */
  checkoutReady: boolean;
};

export type OutreachCheckoutStart =
  | { status: "ready"; sessionId: string; clientSecret: string; publishableKey: string; amountCents: number }
  | { status: "unconfigured" }
  | { status: "unbound"; reason: string };

export type TestDispatchResult = {
  status: "sent" | "skipped" | "failed" | "throttled";
  detail: string;
  to: string;
};

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const SESSION = /^cs_[A-Za-z0-9_]+$/;

function cleanSlug(value: unknown): string {
  const slug = String(value ?? "").trim().toLowerCase().slice(0, 64);
  return SLUG.test(slug) ? slug : "";
}

/* ------------------------------------------------------------------ config */

/** Public read. A missing row or an offline database serves the defaults — never a broken page. */
export async function readPlumberOutreach(): Promise<OutreachRead> {
  try {
    const sql = await getSql();
    const rows = await sql<{ config: unknown; updated_at: string | Date }>`
      select config, updated_at from storefront_configs where slug = ${PLUMBER_OUTREACH_SLUG} limit 1
    `;
    const row = rows[0];
    if (!row) return { config: DEFAULT_PLUMBER_OUTREACH, updatedAt: null, source: "default" };
    return {
      config: parsePlumberOutreach(row.config),
      updatedAt: new Date(row.updated_at).toISOString(),
      source: "saved",
    };
  } catch (err) {
    if (!isDatabaseUnavailable(err)) console.error("[plumber-outreach] read failed", err);
    return { config: DEFAULT_PLUMBER_OUTREACH, updatedAt: null, source: "default" };
  }
}

/** Same owner gate as the Emergency Plumbing studio. */
export async function canEditOutreach(bearerToken?: string) {
  const { canEditStorefront } = await import("./plumbing-storefront.server");
  return canEditStorefront(bearerToken);
}

export async function savePlumberOutreach(input: unknown, bearerToken?: string): Promise<OutreachRead> {
  const { assertSameSiteRequest } = await import("@/lib/auth/isolation.server");
  assertSameSiteRequest();
  const access = await canEditOutreach(bearerToken);
  if (!access.ok) throw new Error("Unlock the studio with the owner key to publish.");
  const config = parsePlumberOutreach(input);
  const sql = await getSql();
  const rows = await sql<{ updated_at: string | Date }>`
    insert into storefront_configs (slug, config, updated_at)
    values (${PLUMBER_OUTREACH_SLUG}, ${JSON.stringify(config)}::jsonb, now())
    on conflict (slug) do update set config = excluded.config, updated_at = now()
    returning updated_at
  `;
  return { config, updatedAt: new Date(rows[0]?.updated_at ?? Date.now()).toISOString(), source: "saved" };
}

/* ------------------------------------------------------------------ tenant */

/**
 * Who the link was built for. A territory lead (`preloaded_leads`) wins because
 * checkout binds to it; a cinematic tenant record only supplies name and phone.
 */
export async function readOutreachTenant(rawSlug: string): Promise<OutreachTenant> {
  const slug = cleanSlug(rawSlug);
  const tenant = emptyOutreachTenant(slug || String(rawSlug ?? "").slice(0, 64));
  if (!slug) return tenant;
  try {
    const { readLeadPreview } = await import("./territory.server");
    const lead = await readLeadPreview(slug);
    if (lead) {
      return {
        slug,
        business: lead.businessName,
        city: lead.city,
        county: lead.county,
        phone: lead.contactPhone,
        live: Boolean(lead.activation) || lead.mode === "live",
        known: true,
      };
    }
  } catch (err) {
    if (!isDatabaseUnavailable(err)) console.error("[plumber-outreach] lead lookup failed", err);
  }
  try {
    const { getTenantBySlug } = await import("@/lib/axiom-landing/tenants/store");
    const record = await getTenantBySlug(slug);
    if (record && record.status !== "suspended") {
      return { ...tenant, business: record.business_name, phone: record.phone, live: record.status === "active" };
    }
  } catch (err) {
    console.error("[plumber-outreach] tenant lookup failed", err);
  }
  return tenant;
}

export async function readOutreachPage(slug: string): Promise<OutreachPage> {
  const [read, tenant] = await Promise.all([readPlumberOutreach(), readOutreachTenant(slug)]);
  let checkoutReady = false;
  try {
    const payments = await import("./payments.server");
    checkoutReady = payments.stripeConfigured() && Boolean(payments.stripePublishableKey());
  } catch {
    checkoutReady = false;
  }
  return { ...read, tenant, checkoutReady };
}

/* ---------------------------------------------------------------- checkout */

/**
 * Opens Stripe Embedded Checkout for the Name Your Price trial, bound to this
 * link's territory slug. Same guards and ledger rows as the redirect flow.
 */
export async function beginOutreachCheckout(input: { slug: string; dollars: number }): Promise<OutreachCheckoutStart> {
  const slug = cleanSlug(input.slug);
  if (!slug) return { status: "unbound", reason: "This link is not tied to a territory yet." };
  const { getRequest } = await import("@tanstack/react-start/server");
  const guard = await import("./funnel-guard.server");
  if (!guard.requestHasFunnelSession(getRequest())) {
    throw new Error("Reload this page, then start your trial again");
  }
  const payments = await import("./payments.server");
  const publishableKey = payments.stripePublishableKey();
  if (!payments.stripeConfigured() || !publishableKey) return { status: "unconfigured" };

  const { territoryPlan } = await import("./pricing");
  const plan = territoryPlan("trial");
  if (!plan) throw new Error("Unknown plan");
  const amountCents = bidCents(input.dollars);
  const territory = await import("./territory.server");
  let opened: Awaited<ReturnType<typeof territory.openTerritoryCheckout>>;
  try {
    opened = await territory.openTerritoryCheckout(slug, plan.id, "stripe", amountCents);
  } catch (err) {
    const message = err instanceof Error ? err.message : "";
    if (message === "Unknown business") {
      return { status: "unbound", reason: "This link is not tied to a territory yet." };
    }
    if (message === "This territory is already live") {
      return { status: "unbound", reason: "This territory is already live — sign in to manage it." };
    }
    throw err;
  }
  try {
    let userId = "";
    try {
      const { getSessionUser } = await import("@/lib/auth/verify.server");
      const buyer = await getSessionUser();
      if (buyer?.id && buyer.id !== "dev-user") userId = buyer.id;
    } catch {
      // A signed-out buyer can still pay. The shop opens once their account matches.
    }
    const session = await payments.createTerritoryCheckout({
      leadSlug: slug,
      checkoutId: opened.checkoutId,
      planId: plan.id,
      planName: plan.name,
      amountCents,
      cadence: plan.cadence,
      origin: payments.requestOrigin(),
      userId,
      namedPriceCents: amountCents,
      embedded: true,
    });
    return { status: "ready", sessionId: session.id, clientSecret: session.clientSecret, publishableKey, amountCents };
  } catch (err) {
    const sql = await getSql();
    await sql`delete from territory_checkouts where id = ${opened.checkoutId} and status = 'pending'`;
    throw err instanceof Error ? err : new Error("Card checkout did not start");
  }
}

/** Re-reads the session from Stripe; the browser never decides on its own that a payment settled. */
export async function confirmOutreachCheckout(input: { slug: string; sessionId: string }) {
  const slug = cleanSlug(input.slug);
  if (!slug || !SESSION.test(input.sessionId)) throw new Error("Invalid session");
  const payments = await import("./payments.server");
  const activation = await payments.settleTerritorySession(input.sessionId);
  if (activation.leadSlug !== slug) throw new Error("This payment belongs to a different territory");
  const locked = await readLockedNumber(slug, input.sessionId);
  return {
    leadSlug: activation.leadSlug,
    businessName: activation.businessName,
    amountCents: activation.amountCents,
    lockedPhone: locked?.phone ?? "",
  };
}

/* ------------------------------------------------------------- mobile lock */

/** The paid session is the credential: it must be the one that activated this territory. */
async function assertPaidSession(slug: string, sessionId: string) {
  if (!slug || !SESSION.test(sessionId)) throw new Error("Finish checkout before setting the dispatch number");
  const sql = await getSql();
  const rows = await sql<{ business_name: string }>`
    select business_name from territory_activations
    where lead_slug = ${slug} and payment_ref = ${sessionId}
    limit 1
  `;
  if (!rows[0]) throw new Error("Finish checkout before setting the dispatch number");
  return { businessName: rows[0].business_name };
}

async function readLockedNumber(slug: string, sessionId: string) {
  try {
    const sql = await getSql();
    const rows = await sql<{ phone: string; test_count: number; last_test_at: string | Date | null }>`
      select phone, test_count, last_test_at from territory_dispatch_numbers
      where lead_slug = ${slug} and payment_ref = ${sessionId}
      limit 1
    `;
    return rows[0] ?? null;
  } catch {
    return null;
  }
}

/** Saves the owner's direct cell after checkout. Placeholder (555) lines are refused. */
export async function lockDispatchMobile(input: { slug: string; sessionId: string; phone: string }) {
  const { assertSameSiteRequest } = await import("@/lib/auth/isolation.server");
  assertSameSiteRequest();
  const slug = cleanSlug(input.slug);
  await assertPaidSession(slug, input.sessionId);
  const check = checkDispatchMobile(input.phone);
  if (!check.ok) throw new Error(check.reason);
  const sql = await getSql();
  await sql`
    insert into territory_dispatch_numbers (lead_slug, phone, payment_ref)
    values (${slug}, ${check.e164}, ${input.sessionId})
    on conflict (lead_slug) do update
      set phone = excluded.phone, payment_ref = excluded.payment_ref, updated_at = now()
  `;
  // Route real alerts there too when the territory already has a shop behind it.
  try {
    await sql`
      update shops set notify_phone = ${check.e164}
      where id = (select shop_id from preloaded_leads where lead_slug = ${slug} limit 1)
        and coalesce(notify_phone, '') = ''
    `;
  } catch (err) {
    console.error("[plumber-outreach] shop alert phone not updated", err instanceof Error ? err.message : err);
  }
  return { phone: check.e164, display: check.display };
}

/** Sends one real text through Twilio to the locked number. Throttled per territory. */
export async function sendTestDispatch(input: { slug: string; sessionId: string }): Promise<TestDispatchResult> {
  const { assertSameSiteRequest } = await import("@/lib/auth/isolation.server");
  assertSameSiteRequest();
  const slug = cleanSlug(input.slug);
  const { businessName } = await assertPaidSession(slug, input.sessionId);
  const locked = await readLockedNumber(slug, input.sessionId);
  if (!locked) throw new Error("Save your direct cell number first");
  const check = checkDispatchMobile(locked.phone);
  if (!check.ok) throw new Error(check.reason);

  const gate = testDispatchAllowed(
    { count: Number(locked.test_count) || 0, lastAt: locked.last_test_at ? new Date(locked.last_test_at).getTime() : null },
    Date.now(),
  );
  if (!gate.ok) return { status: "throttled", detail: gate.reason, to: check.display };

  const sql = await getSql();
  // Claim the attempt before sending so two taps can never fire two texts.
  const claimed = await sql<{ lead_slug: string }>`
    update territory_dispatch_numbers
    set test_count = test_count + 1, last_test_at = now(), last_test_status = 'sending', updated_at = now()
    where lead_slug = ${slug} and payment_ref = ${input.sessionId} and test_count = ${Number(locked.test_count) || 0}
    returning lead_slug
  `;
  if (!claimed[0]) return { status: "throttled", detail: "A test is already on its way.", to: check.display };

  const { config } = await readPlumberOutreach();
  const body = fillTemplate(config.mobileLock.smsBody, {
    ...outreachVars({ ...emptyOutreachTenant(slug), business: businessName }),
  });
  const { deliverOutreachMessage } = await import("./notify.server");
  const result = await deliverOutreachMessage({ channel: "sms", to: check.e164, subject: "", body });
  await sql`
    update territory_dispatch_numbers set last_test_status = ${result.status}, updated_at = now()
    where lead_slug = ${slug}
  `;
  if (result.status !== "sent") {
    // A text that never left does not count against the limit.
    await sql`
      update territory_dispatch_numbers set test_count = greatest(test_count - 1, 0), last_test_at = null
      where lead_slug = ${slug}
    `;
  }
  return { status: result.status, detail: result.detail, to: check.display };
}
