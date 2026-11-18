import { NextResponse } from "next/server";
import { getSql } from "@/lib/db";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    name?: unknown;
    phone?: unknown;
    message?: unknown;
    niche?: unknown;
    city?: unknown;
    county?: unknown;
    slug?: unknown;
  };
  const name = String(body.name ?? "").replace(/\s+/g, " ").trim().slice(0, 80);
  const phone = String(body.phone ?? "").replace(/[^\d+() .-]/g, "").trim().slice(0, 24);
  const message = String(body.message ?? "").replace(/\s+/g, " ").trim().slice(0, 500);
  const niche = String(body.niche ?? "contractor").trim().slice(0, 40) || "contractor";
  const city = String(body.city ?? "").trim().slice(0, 80);
  const county = String(body.county ?? "").trim().slice(0, 80);
  const slug = String(body.slug ?? "").trim().slice(0, 80);
  if (name.length < 2 || phone.replace(/\D/g, "").length < 7) {
    return NextResponse.json({ error: "Add a name and a phone number." }, { status: 400 });
  }
  try {
    const sql = await getSql();
    await sql`
      insert into consumer_leads (niche, city, county, contact_name, contact_phone, contact_meta)
      values (
        ${niche},
        ${city},
        ${county},
        ${name},
        ${phone},
        ${JSON.stringify({ source: "outbound-preview", slug, message })}
      )
    `;
    return NextResponse.json({ ok: true, stored: true });
  } catch {
    return NextResponse.json({ ok: false, stored: false, error: "That request could not be filed." }, { status: 502 });
  }
}
