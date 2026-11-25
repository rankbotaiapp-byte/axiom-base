import { NextResponse } from "next/server";
import { z } from "zod";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const IntakeSchema = z.object({
  tenantId: z.string().min(1).max(80),
  slug: z.string().min(1).max(80),
  mode: z.enum(["instant-booking", "quote-request", "hybrid-dispatch"]),
  contact: z.object({
    name: z.string().min(2).max(80),
    phone: z.string().min(7).max(28),
  }),
  answers: z.record(z.string().max(400)).default({}),
  sourceRoute: z.string().max(200),
  isSimulated: z.boolean().optional(),
});

export async function POST(request: Request) {
  const raw = await request.json().catch(() => null);
  const parsed = IntakeSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "Check the name, phone, and required answers." }, { status: 400 });
  }

  const lead = parsed.data;
  if (lead.contact.phone.replace(/\D/g, "").length < 7) {
    return NextResponse.json({ ok: false, error: "Add a phone number we can call." }, { status: 400 });
  }

  const isSimulated = lead.isSimulated === true;

  try {
    const { resolveShopIdBySlug, recordIntakeLead, alertOwnerForRealLead, activateAfterFirstRealLead } =
      await import("@/lib/axiom/lifecycle.server");
    const shop = await resolveShopIdBySlug(lead.slug);
    const stored = await recordIntakeLead({
      shopId: shop?.id ?? null,
      slug: lead.slug,
      name: lead.contact.name.trim(),
      phone: lead.contact.phone.trim(),
      mode: lead.mode,
      answers: lead.answers,
      sourceRoute: lead.sourceRoute,
      isSimulated,
    });
    if (shop && !isSimulated) {
      await alertOwnerForRealLead({
        shopId: shop.id,
        shopName: shop.name,
        guestName: lead.contact.name.trim(),
        guestPhone: lead.contact.phone.trim(),
      });
      await activateAfterFirstRealLead(shop.id, { isSimulated: false });
    }
    return NextResponse.json({
      ok: true,
      stored: true,
      id: stored.id,
      is_simulated: isSimulated,
    });
  } catch {
    return NextResponse.json(
      { ok: false, error: "The desk couldn't save that request. Try again." },
      { status: 502 },
    );
  }
}
