/**
 * Simulated $1 unlock settlement against a preloaded lead.
 * No Stripe API call. The same checkout session settled twice must not open a second shop.
 */
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { evaluatePublishGate, type PlanStatus } from "../src/lib/billing/publishGate.ts";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const LEAD_ID = "lead_unlock_sim_plumbing";
const SLUG = "unlock-sim-rogue-plumbing";
const SESSION_ID = "cs_test_unlock_sim_plumbing_001";
const OWNER_ID = "11111111-1111-4111-8111-111111111111";
const OWNER_EMAIL = "claim-unlock-sim-owner@axiom.test";

function databaseUrl(): string {
  if (process.env.DATABASE_URL?.trim()) return process.env.DATABASE_URL.trim();
  const envPath = join(ROOT, ".env");
  if (!existsSync(envPath)) return "";
  const line = readFileSync(envPath, "utf8")
    .split(/\r?\n/)
    .find((row) => row.startsWith("DATABASE_URL="));
  if (!line) return "";
  return line.slice("DATABASE_URL=".length).trim().replace(/^["']|["']$/g, "");
}

test("atomic $1 unlock settlement is idempotent and the publish gate holds draft", async (t) => {
  const url = databaseUrl();
  if (!url) {
    t.skip("DATABASE_URL unset — unlock settlement simulation skipped");
    return;
  }
  process.env.DATABASE_URL = url;
  delete process.env.SUPABASE_URL;
  delete process.env.NEXT_PUBLIC_SUPABASE_URL;
  delete process.env.SUPABASE_SERVICE_ROLE_KEY;
  delete process.env.SUPABASE_SERVICE_KEY;
  delete process.env.STRIPE_SECRET_KEY;
  process.env.AXIOM_LOCAL_AUTH = "true";
  if (process.env.NODE_ENV === "production") process.env.NODE_ENV = "development";

  const { getSql } = await import("../src/lib/db.ts");
  const { readStorefrontDesk, settleStorefrontUnlock, publishStorefront } = await import(
    "../src/lib/axiom/storefront-unlock.server.ts"
  );
  const sql = await getSql();

  const ready = await sql<{ ok: boolean }>`
    select to_regclass('auth.users') is not null
      and exists (
        select 1 from information_schema.columns
        where table_schema = 'public' and table_name = 'tenants' and column_name = 'unlock_status'
      ) as ok
  `.catch(() => [{ ok: false }]);
  if (!ready[0]?.ok) {
    t.skip("claim unlock columns or auth.users are not available");
    return;
  }

  async function cleanup() {
    const shops = await sql<{ id: string; slug: string }>`
      select id, slug from shops where owner_user_id = ${OWNER_ID} or slug = ${SLUG}
    `.catch(() => []);
    await sql`delete from claim_unlock_sessions where shop_slug = ${SLUG} or lead_id = ${LEAD_ID}`.catch(() => undefined);
    for (const shop of shops) {
      await sql`delete from shop_events where shop_id = ${shop.id}`.catch(() => undefined);
      await sql`delete from shop_members where shop_id = ${shop.id}`.catch(() => undefined);
      await sql`delete from shop_billing where shop_id = ${shop.id}`.catch(() => undefined);
      await sql`delete from storefront_configs where slug = ${shop.slug}`.catch(() => undefined);
    }
    await sql`delete from tenants where user_id = ${OWNER_ID}::uuid`.catch(() => undefined);
    await sql`update preloaded_leads set shop_id = null where id = ${LEAD_ID}`.catch(() => undefined);
    for (const shop of shops) {
      await sql`delete from shops where id = ${shop.id}`.catch(() => undefined);
    }
    await sql`delete from preloaded_leads where id = ${LEAD_ID}`.catch(() => undefined);
    await sql`delete from auth.users where id = ${OWNER_ID}::uuid`.catch(() => undefined);
  }

  await cleanup();
  t.after(cleanup);

  await sql`
    insert into preloaded_leads (
      id, business_name, trade_type, trade_label, niche, city, county, state,
      lead_slug, claimed, contact_phone, phone_line, contact_name
    )
    values (
      ${LEAD_ID}, ${"Rogue Sim Plumbing"}, ${"plumbing"}, ${"Plumbing"}, ${"plumbing"},
      ${"Medford"}, ${"Jackson"}, ${"OR"},
      ${SLUG}, ${false}, ${"+15415550120"}, ${"+15415550120"}, ${"Rogue Owner"}
    )
  `;

  const lead = await sql<{
    id: string;
    business_name: string;
    lead_slug: string;
    city: string;
    contact_phone: string;
    niche: string;
  }>`
    select id, business_name, lead_slug, city, contact_phone, niche
    from preloaded_leads
    where id = ${LEAD_ID}
    limit 1
  `;
  assert.equal(lead[0]?.lead_slug, SLUG);

  await sql`
    insert into auth.users (id, email, aud, role)
    values (${OWNER_ID}::uuid, ${OWNER_EMAIL}, 'authenticated', 'authenticated')
  `;

  const input = {
    sessionId: SESSION_ID,
    paymentIntentId: "pi_test_unlock_sim_plumbing_001",
    leadId: lead[0].id,
    slug: lead[0].lead_slug,
    niche: lead[0].niche || "plumbing",
    businessName: lead[0].business_name,
    userId: OWNER_ID,
    phone: lead[0].contact_phone,
    city: lead[0].city,
    email: OWNER_EMAIL,
  };

  const first = await settleStorefrontUnlock(input);
  const second = await settleStorefrontUnlock(input);
  assert.equal(first.already, false);
  assert.equal(second.already, true);
  assert.equal(second.shopId, first.shopId);
  assert.equal(first.phase, "draft");

  const shops = await sql<{ n: number }>`select count(*)::int as n from shops where slug = ${SLUG}`;
  const sessions = await sql<{ n: number; status: string }>`
    select count(*)::int as n, max(status) as status
    from claim_unlock_sessions
    where stripe_checkout_session_id = ${SESSION_ID}
  `;
  assert.equal(Number(shops[0]?.n), 1);
  assert.equal(Number(sessions[0]?.n), 1);
  assert.equal(sessions[0]?.status, "unlocked");

  const tenant = await sql<{ unlock_status: string; publish_status: string; plan_status: string; shop_id: string }>`
    select unlock_status, publish_status, plan_status, shop_id
    from tenants
    where user_id = ${OWNER_ID}::uuid
    limit 1
  `;
  assert.equal(tenant[0]?.shop_id, first.shopId);
  assert.equal(tenant[0]?.unlock_status, "unlocked");
  assert.equal(tenant[0]?.publish_status, "draft");
  assert.equal(tenant[0]?.plan_status, "none");

  const request = new Request("http://127.0.0.1/api/storefront/publish", { method: "POST" });
  for (const planStatus of ["none", "past_due", "canceled"] as const) {
    await sql`
      update tenants
      set plan_status = ${planStatus}, publish_status = 'draft'
      where shop_id = ${first.shopId}
    `;
    const desk = await readStorefrontDesk(SLUG);
    assert.ok(desk);
    assert.equal(desk.planStatus, planStatus satisfies PlanStatus);
    const decision = evaluatePublishGate({
      unlockStatus: desk.unlockStatus,
      publishStatus: desk.publishStatus,
      planStatus: desk.planStatus,
      stripeSubscriptionId: desk.stripeSubscriptionId,
    });
    assert.equal(decision.reason, "PLAN_SELECTION_REQUIRED");
    const attempt = await publishStorefront(request, SLUG);
    assert.equal(attempt.published, false);
    if (!attempt.published) assert.equal(attempt.decision.reason, "PLAN_SELECTION_REQUIRED");
    const row = await sql<{ publish_status: string }>`
      select publish_status from tenants where shop_id = ${first.shopId} limit 1
    `;
    assert.equal(row[0]?.publish_status, "draft");
  }

  for (const planStatus of ["active", "trialing"] as const) {
    await sql`
      update tenants
      set plan_status = ${planStatus}, publish_status = 'draft'
      where shop_id = ${first.shopId}
    `;
    if (planStatus === "active") {
      await sql`
        update shop_billing
        set plan = 'lifetime', status = 'active'
        where shop_id = ${first.shopId}
      `;
    }
    const desk = await readStorefrontDesk(SLUG);
    assert.ok(desk);
    assert.equal(desk.planStatus, planStatus satisfies PlanStatus);
    assert.deepEqual(
      evaluatePublishGate({
        unlockStatus: desk.unlockStatus,
        publishStatus: desk.publishStatus,
        planStatus: desk.planStatus,
        stripeSubscriptionId: desk.stripeSubscriptionId,
      }),
      {
        canPublishImmediately: true,
        requiresPlanSelection: false,
        requiresUnlockFirst: false,
        reason: "READY_TO_PUBLISH",
      },
    );
    const row = await sql<{ publish_status: string }>`
      select publish_status from tenants where shop_id = ${first.shopId} limit 1
    `;
    assert.equal(row[0]?.publish_status, "draft");
  }
});
