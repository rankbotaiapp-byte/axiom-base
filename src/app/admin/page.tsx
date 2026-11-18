"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { StudioAutoBuildPanel } from "@/components/studio/StudioAutoBuildPanel";
import { AxiomStudioHudShell } from "@/components/studio/ObsidianHudChrome";
import { RedirectToSignIn } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { getOperatorData, listMyShops } from "@/lib/axiom/server";
import type { Shop } from "@/lib/axiom/types";

export default function MasterAdminPage() {
  const { user, isPending } = useCurrentUserState();
  const [shop, setShop] = useState<Shop | null>(null);
  const [error, setError] = useState<string | null>(null);
  const userId = user?.id;

  useEffect(() => {
    if (isPending || !userId) return;
    let cancelled = false;
    void listMyShops()
      .then(async (shops) => {
        const first = shops[0];
        if (!first) throw new Error("Open a shop first.");
        const next = await getOperatorData({ data: first.slug });
        if (cancelled) return;
        setShop(next.shop);
        setError(null);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Forbidden");
      });
    return () => {
      cancelled = true;
    };
  }, [isPending, userId]);

  if (isPending || (user && !shop && !error)) {
    return (
      <main className="grid min-h-dvh place-items-center bg-obsidian">
        <div className="h-10 w-48 animate-pulse rounded-full bg-fg/10" />
      </main>
    );
  }
  if (!user) return <RedirectToSignIn to="/login" next="/admin" />;
  if (error || !shop) {
    return (
      <main className="grid min-h-dvh place-items-center bg-obsidian px-6 text-center">
        <div className="max-w-md rounded-2xl border border-white/10 bg-[#050507] px-6 py-8">
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-hud">Master admin</p>
          <p className="mt-3 text-sm text-muted">{error || "No shop on this desk."}</p>
          <Link href="/onboard" className="mt-5 inline-block text-sm text-hud underline-offset-4 hover:underline">
            Create a shop
          </Link>
        </div>
      </main>
    );
  }

  return (
    <AxiomStudioHudShell brandTitle="Platform studio control" deskSlug={shop.slug} themeId="cyber_cyan">
      <div className="mx-auto max-w-[1400px] space-y-4">
        <a
          href={`/${shop.slug}/admin`}
          className="inline-flex min-h-9 items-center rounded-full border border-white/15 bg-white/[0.03] px-3 font-mono text-[10px] uppercase tracking-[0.12em] text-white/70 transition hover:border-[var(--brand-primary)]/40 hover:text-white"
        >
          Open tenant admin →
        </a>
        <StudioAutoBuildPanel
          shopSlug={shop.slug}
          shopName={shop.name}
          niche={shop.niche || "contractor"}
          previewHref={`/${shop.slug}`}
          embedInShell
        />
      </div>
    </AxiomStudioHudShell>
  );
}