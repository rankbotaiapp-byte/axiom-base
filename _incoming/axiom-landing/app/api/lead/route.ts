import { NextResponse } from "next/server";

// Receives onboarding leads and forwards them to LEAD_WEBHOOK_URL (Formspree, Zapier, n8n, Supabase fn…).
export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  // Honeypot: bots fill the hidden "website" field. Pretend success, drop it.
  if (typeof body.website === "string" && body.website.trim()) return NextResponse.json({ ok: true });

  const str = (k: string, max = 200) => (typeof body[k] === "string" ? (body[k] as string).trim().slice(0, max) : "");
  const lead = {
    business: str("business"),
    name: str("name"),
    phone: str("phone", 40),
    email: str("email", 120),
    city: str("city"),
    template: str("template"),
    plan: str("plan", 20),
    source: str("source", 60),
    submittedAt: new Date().toISOString(),
  };

  if (!lead.business || !lead.name || !/\S+@\S+\.\S+/.test(lead.email) || lead.phone.replace(/\D/g, "").length < 10) {
    return NextResponse.json({ ok: false, error: "Missing required fields" }, { status: 422 });
  }

  const hook = process.env.LEAD_WEBHOOK_URL;
  if (!hook) {
    console.warn("[lead] LEAD_WEBHOOK_URL not set — lead logged only:", lead);
    return NextResponse.json({ ok: true, forwarded: false });
  }

  try {
    const res = await fetch(hook, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ ...lead, _subject: `New Axiom lead: ${lead.business} (${lead.plan})` }),
    });
    if (!res.ok) throw new Error(`Webhook ${res.status}`);
    return NextResponse.json({ ok: true, forwarded: true });
  } catch (err) {
    console.error("[lead] forward failed", err, lead);
    return NextResponse.json({ ok: false, error: "Could not save lead" }, { status: 502 });
  }
}
