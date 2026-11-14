"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { AiContentAutopilotToggle } from "@/components/admin/ai-content-autopilot";
import { AutopilotClipPreview, AutopilotLoopsPanel } from "@/components/admin/autopilot-loops";
import { RedirectToSignIn } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { bookingCta, resolveAutopilotLoops } from "@/config/AutopilotContentEngine";
import { localStorefront } from "@/lib/axiom/autopilot";
import { materializeDatasetShop } from "@/lib/axiom/autopilot-shop";
import { shopCity } from "@/lib/axiom/avatar";
import { getOperatorData } from "@/lib/axiom/server";
import type { AccessMode, Shop } from "@/lib/axiom/types";

export default function AutopilotSettingsPage() {
  const params = useParams<{ shopSlug: string }>();
  const shopSlug = params.shopSlug || "demo";
  const router = useRouter();
  const { user, isPending } = useCurrentUserState();
  const [shop, setShop] = useState<Shop | null>(null);
  const [mode, setMode] = useState<AccessMode>("none");
  const [error, setError] = useState<string | null>(null);
  const userId = user?.id;

  useEffect(() => {
    if (isPending || !userId) return;
    let cancelled = false;
    void getOperatorData({ data: shopSlug })
      .then((next) => {
        if (cancelled) return;
        setShop(next.shop);
        setMode(next.mode);
        setError(null);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        const dataset = localStorefront(shopSlug);
        const message = err instanceof Error ? err.message : "";
        if (dataset && /not found|database|unavailable|paused|recovery|connection/i.test(message)) {
          setShop(materializeDatasetShop(dataset).shop);
          setMode("preview");
          setError(null);
          return;
        }
        setError(message || "Forbidden");
      });
    return () => {
      cancelled = true;
    };
  }, [isPending, shopSlug, userId]);

  useEffect(() => {
    if (mode === "employee") router.replace(`/${shopSlug}/employee`);
  }, [mode, router, shopSlug]);

  if (isPending || (user && !shop && !error)) {
    return (
      <main className="grid min-h-dvh place-items-center bg-obsidian">
        <div className="h-10 w-48 animate-pulse rounded-full bg-fg/10" />
      </main>
    );
  }
  if (!user) return <RedirectToSignIn to="/login" next={`/${shopSlug}/admin/autopilot`} />;
  if (mode === "employee") return null;
  if (error || !shop) {
    return (
      <main className="grid min-h-dvh place-items-center bg-obsidian px-6 text-center">
        <div className="film-glass max-w-md rounded-2xl px-6 py-8">
          <p className="film-kicker">Autopilot</p>
          <p className="mt-3 font-mono text-3xl text-fg">This desk is locked.</p>
          <Link href={`/${shopSlug}/admin`} className="film-link mt-5">
            Back to the desk
          </Link>
        </div>
      </main>
    );
  }

  const readonly = mode === "preview" || shop.isShowcase;
  const loops = resolveAutopilotLoops({
    shopConfig: shop.shopConfig,
    pinnedHeroUrl: shop.heroVideoUrl,
    niche: shop.niche,
  });
  const city = shopCity(shop.address);

  return (
    <main className="min-h-dvh bg-obsidian px-5 py-8 sm:px-10">
      <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <div>
          <Link href={`/${shopSlug}/admin`} className="text-sm text-muted hover:text-fg">
            Mission control
          </Link>
          <AiContentAutopilotToggle shop={shop} readonly={readonly} />
          <div className="mt-8">
            <AutopilotLoopsPanel shop={shop} readonly={readonly} />
          </div>
        </div>
        <AutopilotClipPreview
          src={loops[0] ?? ""}
          shopName={shop.name}
          city={city}
          cta={bookingCta(city)}
        />
      </div>
    </main>
  );
}
