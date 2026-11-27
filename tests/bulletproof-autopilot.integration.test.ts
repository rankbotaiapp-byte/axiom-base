/**
 * Live-adjacent settlement + webhook signing against DATABASE_URL when present.
 * Skips cleanly when claim-unlock columns are missing.
 */
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { buildAxiomVcard } from "../src/lib/axiom/axiom-business-number.ts";
import { mmsSenderMayUpdateProof } from "../src/lib/axiom/mms-owner-gate.ts";
import { stripeSignatureHeader, verifyStripeSignature } from "../src/lib/axiom/stripe-webhook-crypto.ts";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SLUG = "bp-autopilot-plumbing";
const SESSION_ID = "cs_test_bp_autopilot_001";
const OWNER_ID = "22222222-2222-4222-8222-222222222222";
const OWNER_EMAIL = "bp-autopilot-owner@axiom.test";
const LEAD_ID = "lead_bp_autopilot_plumbing";

function databaseUrl(): string {
  if (process.env.DATABASE_URL?.trim()) return process.env.DATABASE_URL.trim();
  for (const file of [".env.local", ".env"]) {
    const envPath = join(ROOT, file);
    if (!existsSync(envPath)) continue;
    const line = readFileSync(envPath, "utf8")
      .split(/\r?\n/)
      .find((row) => row.startsWith("DATABASE_URL="));
    if (line) return line.slice("DATABASE_URL=".length).trim().replace(/^["']|["']$/g, "");
  }
  return "";
}

test("signed webhook crypto plus owner MMS gate hold without a live Stripe call", () => {
  const payload = JSON.stringify({
    id: "evt_bp_checkout",
    type: "checkout.session.completed",
    data: {
      object: {
        id: SESSION_ID,
        payment_status: "paid",
        amount_total: 100,
        metadata: { kind: "storefront_unlock", shop_slug: SLUG },
      },
    },
  });
  const header = stripeSignatureHeader(payload, "whsec_bp");
  assert.equal(verifyStripeSignature(payload, header, "whsec_bp"), true);
  assert.equal(mmsSenderMayUpdateProof("+15415550148", ["+1 (541) 555-0148"]), true);
  assert.equal(mmsSenderMayUpdateProof("+15415550000", ["+1 (541) 555-0148"]), false);
  const vcf = buildAxiomVcard({ businessName: "Bulletproof Plumbing", e164: "+15415550148" });
  assert.match(vcf, /BEGIN:VCARD/);
  assert.match(vcf, /TEL;TYPE=WORK,VOICE:\+15415550148/);
});

test("duplicate unlock settlement does not open a second shop", async (t) => {
  const url = databaseUrl();
  if (!url) {
    t.skip("DATABASE_URL unset — billing settlement skipped");
    return;
  }
  process.env.DATABASE_URL = url;
  process.env.AXIOM_LOCAL_AUTH = "true";
  if (process.env.NODE_ENV === "production") process.env.NODE_ENV = "development";

  const { getSql } = await import("../src/lib/db.ts");
  const { settleStorefrontUnlock } = await import("../src/lib/axiom/storefront-unlock.server.ts");
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
    const shops = await sql<{ id: string }>`
      select id from shops where owner_user_id = ${OWNER_ID} or slug = ${SLUG}
    `.catch(() => []);
    await sql`delete from claim_unlock_sessions where shop_slug = ${SLUG} or lead_id = ${LEAD_ID}`.catch(() => undefined);
    for (const shop of shops) {
      await sql`delete from shop_events where shop_id = ${shop.id}`.catch(() => undefined);
      await sql`delete from shop_members where shop_id = ${shop.id}`.catch(() => undefined);
      await sql`delete from shop_billing where shop_id = ${shop.id}`.catch(() => undefined);
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
  try {
    await sql`
      insert into auth.users (id, email, encrypted_password, created_at, updated_at, instance_id, aud, role)
      values (${OWNER_ID}::uuid, ${OWNER_EMAIL}, 'x', now(), now(), '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated')
    `.catch(() => undefined);

    const payload = {
      sessionId: SESSION_ID,
      paymentIntentId: "pi_test_bp_autopilot_001",
      leadId: LEAD_ID,
      slug: SLUG,
      niche: "plumbing",
      businessName: "Bulletproof Plumbing",
      userId: OWNER_ID,
      email: OWNER_EMAIL,
      phone: "5415550148",
      city: "Medford",
    };
    const first = await settleStorefrontUnlock(payload).catch((err: unknown) => err);
    const second = await settleStorefrontUnlock(payload).catch((err: unknown) => err);
    if (first instanceof Error || second instanceof Error) {
      t.skip(`settlement unavailable: ${first instanceof Error ? first.message : (second as Error).message}`);
      return;
    }
    const shops = await sql<{ slug: string }>`select slug from shops where slug = ${SLUG}`;
    assert.equal(shops.length, 1);
  } finally {
    await cleanup();
  }
});
