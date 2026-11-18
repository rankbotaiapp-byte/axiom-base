"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { RedirectToSignIn } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { localStorefront } from "@/lib/axiom/autopilot";
import { materializeDatasetShop } from "@/lib/axiom/autopilot-shop";
import { getOperatorData } from "@/lib/axiom/server";
import { rememberHeroStudioSlug } from "@/lib/axiom/hero-studio-route";
import type { AccessMode, Shop } from "@/lib/axiom/types";

/** Client-only: canvas / video / localStorage studio chrome — never SSR. */
const HeroStudio = dynamic(
  () => import("../components/HeroStudio").then((m) => m.HeroStudio),
  {
    ssr: false,
    loading: () => (
      <main className="grid min-h-dvh place-items-center bg-obsidian">
        <div className="h-10 w-48 animate-pulse rounded-full bg-fg/10" aria-hidden />
      </main>
    ),
  },
);

function StudioSkeleton() {
  return (
    <main className="grid min-h-dvh place-items-center bg-obsidian">
      <div className="h-10 w-48 animate-pulse rounded-full bg-fg/10" aria-hidden />
    </main>
  );
}

export default function HeroStudioPage() {
  const params = useParams<{ shopSlug: string }>();
  const shopSlug = params.shopSlug || "demo";
  const router = useRouter();
  const { user, isPending } = useCurrentUserState();
  const [shop, setShop] = useState<Shop | null>(null);
  const [mode, setMode] = useState<AccessMode>("none");
  const [error, setError] = useState<string | null>(null);
  // Ensure client-only execution for WebGL / canvas / window refs
  const [isMounted, setIsMounted] = useState(false);
  const userId = user?.id;

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    rememberHeroStudioSlug(shopSlug);
  }, [shopSlug]);

  useEffect(() => {
    if (isPending || !userId) return;
    let cancelled = false;

    // Seeded tenants (axiom-auto, etc.) must paint immediately — TanStack
    // createServerFn can hang under the Next App Router, which left the desk
    // on a forever skeleton and crashed preflight.
    const dataset = localStorefront(shopSlug);
    if (dataset) {
      setShop(materializeDatasetShop(dataset).shop);
      setMode("preview");
      setError(null);
    }

    const operator = Promise.race([
      getOperatorData({ data: shopSlug }),
      new Promise<null>((resolve) => {
        window.setTimeout(() => resolve(null), 2500);
      }),
    ]);

    void operator
      .then((next) => {
        if (cancelled || !next) {
          if (!dataset && !cancelled) setError("Forbidden");
          return;
        }
        setShop(next.shop as Shop);
        setMode(next.mode);
        setError(null);
      })
      .catch((err: unknown) => {
        if (cancelled || dataset) return;
        const message = err instanceof Error ? err.message : "";
        setError(message || "Forbidden");
      });

    return () => {
      cancelled = true;
    };
  }, [isPending, shopSlug, userId]);

  useEffect(() => {
    if (mode === "employee") router.replace(`/${shopSlug}/employee`);
  }, [mode, router, shopSlug]);

  if (!isMounted) return <StudioSkeleton />;

  if (isPending || (user && !shop && !error)) {
    return <StudioSkeleton />;
  }
  if (!user) return <RedirectToSignIn to="/login" next={`/${shopSlug}/admin/hero-studio`} />;
  if (mode === "employee") return null;
  if (error || !shop) {
    return (
      <main className="grid min-h-dvh place-items-center bg-obsidian px-6 text-center">
        <div className="film-glass max-w-md rounded-2xl px-6 py-8">
          <p className="film-kicker">Hero studio</p>
          <p className="mt-3 font-mono text-3xl text-fg">This studio is locked.</p>
          <Link href={`/${shopSlug}/admin`} className="film-link mt-5">
            Back to the desk
          </Link>
        </div>
      </main>
    );
  }

  return <HeroStudio shop={shop} readonly={mode === "preview" || shop.isShowcase} />;
}
