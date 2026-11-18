import { NextResponse } from "next/server";
import { z } from "zod";
import {
  createConnectLoginLink,
  readConnectStatus,
  requestOrigin,
  startConnectOnboarding,
  stripeConfigured,
  syncConnectAccount,
} from "@/lib/axiom/payments.server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const postSchema = z.object({
  shopSlug: z.string().min(2).max(80),
  action: z.enum(["onboard", "login", "refresh"]).default("onboard"),
  origin: z.string().url().optional(),
});

/** GET ?shopSlug= — payout standing + recent connected-account charges. */
export async function GET(request: Request) {
  try {
    if (!stripeConfigured()) {
      return NextResponse.json({ ok: false, error: "Stripe is not configured." }, { status: 503 });
    }
    const url = new URL(request.url);
    const shopSlug = (url.searchParams.get("shopSlug") || url.searchParams.get("slug") || "").trim();
    if (!shopSlug) {
      return NextResponse.json({ ok: false, error: "Missing shopSlug." }, { status: 400 });
    }
    const status = await readConnectStatus(shopSlug);
    return NextResponse.json({ ok: true, ...status, processorReady: true });
  } catch (err) {
    const error = err instanceof Error ? err.message : "Connect status failed.";
    console.error("[stripe/connect GET]", error);
    return NextResponse.json({ ok: false, error }, { status: 502 });
  }
}

/**
 * POST — generate Express account onboarding / refresh links, or Express login
 * for bank + payout dashboard.
 */
export async function POST(request: Request) {
  try {
    if (!stripeConfigured()) {
      return NextResponse.json({ ok: false, error: "Stripe is not configured." }, { status: 503 });
    }
    const json = (await request.json()) as unknown;
    const parsed = postSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: "Invalid Connect request.", details: parsed.error.flatten() },
        { status: 400 },
      );
    }
    const { shopSlug, action, origin } = parsed.data;
    const base = (origin || requestOrigin()).replace(/\/$/, "");

    if (action === "refresh") {
      const status = await readConnectStatus(shopSlug);
      if (status.accountId) await syncConnectAccount(status.accountId);
      const next = await readConnectStatus(shopSlug);
      return NextResponse.json({ ok: true, ...next });
    }

    if (action === "login") {
      const status = await readConnectStatus(shopSlug);
      if (!status.accountId) {
        return NextResponse.json(
          { ok: false, error: "Connect Stripe first to open the payout dashboard." },
          { status: 400 },
        );
      }
      const link = await createConnectLoginLink(status.accountId);
      return NextResponse.json({ ok: true, url: link.url, action: "login" });
    }

    const started = await startConnectOnboarding(shopSlug, base);
    return NextResponse.json({
      ok: true,
      url: started.url,
      accountId: started.accountId,
      action: "onboard",
    });
  } catch (err) {
    const error = err instanceof Error ? err.message : "Connect onboarding failed.";
    console.error("[stripe/connect POST]", error);
    const status = /unknown shop/i.test(error) ? 404 : 502;
    return NextResponse.json({ ok: false, error }, { status });
  }
}
