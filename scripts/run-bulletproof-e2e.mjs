/**
 * HTTP E2E for Bulletproof Autopilot (no Chrome launch).
 * Covers the same routes as tests/bulletproof-autopilot.spec.ts.
 */
import { createHmac } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const BASE = process.env.E2E_BASE_URL || "http://127.0.0.1:3000";
const SHOP = "cascade-electric";
const rows = [];

function secret() {
  if (process.env.STRIPE_WEBHOOK_SECRET?.trim()) return process.env.STRIPE_WEBHOOK_SECRET.trim();
  for (const file of [".env.local", ".env"]) {
    const path = join(process.cwd(), file);
    if (!existsSync(path)) continue;
    const line = readFileSync(path, "utf8")
      .split(/\r?\n/)
      .find((row) => row.startsWith("STRIPE_WEBHOOK_SECRET="));
    if (line) return line.slice("STRIPE_WEBHOOK_SECRET=".length).trim().replace(/^["']|["']$/g, "");
  }
  return "";
}

async function check(name, fn) {
  try {
    await fn();
    rows.push({ name, ok: true });
    console.log(`PASS  ${name}`);
  } catch (err) {
    rows.push({ name, ok: false, detail: err instanceof Error ? err.message : String(err) });
    console.log(`FAIL  ${name}`);
    console.log(`      ${err instanceof Error ? err.message : err}`);
  }
}

const html = await fetch(`${BASE}/t/${SHOP}`).then((r) => ({ status: r.status, text: r.text() }));
const storefrontText = await html.text;

await check("storefront /t/cascade-electric + CinematicMediaFrame", async () => {
  if (html.status !== 200) throw new Error(`status ${html.status}`);
  if (!storefrontText.includes("cmf-frame")) throw new Error("missing .cmf-frame");
  if (/replicate\.delivery/i.test(storefrontText)) throw new Error("temporary Replicate URL leaked");
});

await check("welcome /t/cascade-electric/welcome", async () => {
  const res = await fetch(`${BASE}/t/${SHOP}/welcome`);
  const body = await res.text();
  if (!res.ok) throw new Error(`status ${res.status}`);
  if (!/Axiom|welcome|number|storefront/i.test(body)) throw new Error("welcome copy missing");
});

await check("admin /cascade-electric/admin <500", async () => {
  const res = await fetch(`${BASE}/${SHOP}/admin`, { redirect: "manual" });
  if (res.status >= 500) throw new Error(`status ${res.status}`);
});

await check("vCard endpoint 200 vcf or 404 unassigned", async () => {
  const res = await fetch(`${BASE}/api/storefront/vcard?slug=${SHOP}`);
  if (res.status === 200) {
    const body = await res.text();
    if (!/BEGIN:VCARD/.test(body) || !/TEL;TYPE=WORK,VOICE:/.test(body)) throw new Error("invalid vcard");
    return;
  }
  if (res.status !== 404) throw new Error(`status ${res.status}`);
  const json = await res.json();
  if (!/not assigned/i.test(String(json.error || ""))) throw new Error("unexpected 404 body");
});

await check("unsigned Stripe webhook rejected", async () => {
  const res = await fetch(`${BASE}/api/webhooks/stripe`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      id: "evt_e2e_unsigned",
      type: "checkout.session.completed",
      data: { object: { id: "cs_e2e", metadata: { kind: "storefront_unlock" } } },
    }),
  });
  if (res.status !== 400) throw new Error(`expected 400, got ${res.status}`);
});

await check("signed invoice.paid + duplicate retry", async () => {
  const key = secret();
  if (!key) throw new Error("STRIPE_WEBHOOK_SECRET unset");
  const payload = JSON.stringify({
    id: `evt_e2e_paid_${Date.now()}`,
    type: "invoice.paid",
    data: { object: { id: "in_e2e", metadata: {} } },
  });
  const timestamp = Math.floor(Date.now() / 1000);
  const v1 = createHmac("sha256", key).update(`${timestamp}.${payload}`).digest("hex");
  const headers = { "content-type": "application/json", "stripe-signature": `t=${timestamp},v1=${v1}` };
  const paid = await fetch(`${BASE}/api/webhooks/stripe`, { method: "POST", headers, body: payload });
  const paidBody = await paid.json();
  if (paid.status !== 200 || paidBody.received !== true) throw new Error(`paid ${paid.status} ${JSON.stringify(paidBody)}`);
  const replay = await fetch(`${BASE}/api/webhooks/stripe`, { method: "POST", headers, body: payload });
  const replayBody = await replay.json();
  if (replay.status !== 200 || replayBody.received !== true) throw new Error(`replay ${replay.status}`);
  if (replayBody.duplicate !== true) throw new Error("duplicate retry did not set duplicate:true");
});

await check("non-owner MMS does not store proof photos", async () => {
  const res = await fetch(`${BASE}/api/twilio/inbound`, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      From: "+15415550999",
      To: "+15415550100",
      Body: "job photo",
      MessageSid: "SM_e2e_non_owner",
      NumMedia: "1",
      MediaUrl0: "https://example.invalid/job.jpg",
      MediaContentType0: "image/jpeg",
    }).toString(),
  });
  const xml = await res.text();
  if (res.status >= 500) throw new Error(`status ${res.status}`);
  if (xml.toLowerCase().includes("proof-of-work photo")) throw new Error("non-owner mutated gallery");
});

await check("10 parallel storefront GETs", async () => {
  const results = await Promise.all(Array.from({ length: 10 }, () => fetch(`${BASE}/t/${SHOP}`)));
  const bad = results.filter((row) => !row.ok);
  if (bad.length) throw new Error(`${bad.length} failed (${bad[0]?.status})`);
});

const failed = rows.filter((row) => !row.ok);
console.log("");
console.log(`E2E ${rows.length - failed.length}/${rows.length} passed against ${BASE}`);
process.exit(failed.length ? 1 : 0);
