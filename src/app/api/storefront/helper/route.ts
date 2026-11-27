import { NextResponse } from "next/server";
import { z } from "zod";
import { handleStorefrontHelperTurn } from "@/lib/axiom/storefront-helper";
import { persistThenNotify, EMPTY_NOTIFY_RESULT } from "@/lib/axiom/notify-dispatch";
import { cleanShopSlug } from "@/lib/axiom/hydrate-storefront";
import { loadTenantStorefrontConfig } from "@/lib/storefront/load-tenant-config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BodySchema = z.object({
  slug: z.string().min(1).max(80),
  message: z.string().min(1).max(500),
  guestName: z.string().max(80).optional(),
  guestPhone: z.string().max(28).optional(),
});

export async function POST(request: Request) {
  const raw = await request.json().catch(() => null);
  const parsed = BodySchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "Send a short message." }, { status: 400 });
  }
  const slug = cleanShopSlug(parsed.data.slug);
  if (!slug) return NextResponse.json({ ok: false, error: "Unknown shop" }, { status: 400 });

  const loaded = await loadTenantStorefrontConfig(slug);
  const shopName =
    loaded.status === "ok" ? loaded.config.businessName : slug.replace(/-/g, " ");
  const phone = loaded.status === "ok" ? loaded.config.conversion.displayPhone : "";
  const cities = loaded.status === "ok" ? loaded.config.conversion.serviceCities : [];

  const turn = handleStorefrontHelperTurn({
    shopName,
    phone,
    cities,
    message: parsed.data.message,
    guestName: parsed.data.guestName,
    guestPhone: parsed.data.guestPhone,
  });

  if (turn.intent !== "book") {
    return NextResponse.json({ ok: true, ...turn, stored: false });
  }

  const idempotencyKey = (request.headers.get("idempotency-key") || "").trim().slice(0, 120);

  try {
    const { resolveShopIdBySlug, recordIntakeLead, alertOwnerForRealLead, activateAfterFirstRealLead } =
      await import("@/lib/axiom/lifecycle.server");
    const shop = await resolveShopIdBySlug(slug);
    const { stored, notifyOk, notifyError } = await persistThenNotify(
      () =>
        recordIntakeLead({
          shopId: shop?.id ?? null,
          slug,
          name: turn.guestName,
          phone: turn.guestPhone,
          mode: "hybrid-dispatch",
          answers: { service: turn.service, source: "storefront-helper" },
          sourceRoute: `/t/${slug}`,
          isSimulated: false,
          idempotencyKey,
        }),
      async () => {
        if (!shop) return EMPTY_NOTIFY_RESULT;
        return alertOwnerForRealLead({
          shopId: shop.id,
          shopName: shop.name || shopName,
          guestName: turn.guestName,
          guestPhone: turn.guestPhone,
          service: turn.service,
        });
      },
    );
    if (shop && !stored.duplicate) {
      await activateAfterFirstRealLead(shop.id, { isSimulated: false }).catch((err) => {
        console.error("[helper] first-lead billing", err instanceof Error ? err.message : err);
      });
    }
    return NextResponse.json({
      ok: true,
      ...turn,
      stored: true,
      id: stored.id,
      duplicate: stored.duplicate || undefined,
      notifyOk,
      notifyError: notifyError || undefined,
    });
  } catch {
    return NextResponse.json(
      {
        ok: false,
        ...turn,
        stored: false,
        error: "I captured the details. The desk could not save just now — call the shop line if it is urgent.",
      },
      { status: 502 },
    );
  }
}
