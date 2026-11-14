import { useEffect, useState } from "react";
import { Link, Navigate, useParams } from "@tanstack/react-router";
import { HeroLibraryBench } from "@/components/admin/hero-library-bench";
import { RedirectToSignIn } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { localStorefront } from "@/lib/axiom/autopilot";
import { materializeDatasetShop } from "@/lib/axiom/autopilot-shop";
import { getOperatorData } from "@/lib/axiom/server";
import type { AccessMode, Shop } from "@/lib/axiom/types";

export default function HeroLibraryPage() {
  const { shopSlug } = useParams({ from: "/$shopSlug/admin/branding/hero-library" });
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

  if (isPending || (user && !shop && !error)) {
    return (
      <main className="grid min-h-dvh place-items-center bg-obsidian">
        <div className="h-10 w-48 animate-pulse rounded-full bg-fg/10" />
      </main>
    );
  }
  if (!user) return <RedirectToSignIn to="/login" next={`/${shopSlug}/admin/branding/hero-library`} />;
  if (mode === "employee") return <Navigate to="/$shopSlug/employee" params={{ shopSlug }} />;
  if (error || !shop) {
    return (
      <main className="grid min-h-dvh place-items-center bg-obsidian px-6 text-center">
        <div className="film-glass max-w-md rounded-2xl px-6 py-8">
          <p className="film-kicker">Hero library</p>
          <p className="mt-3 font-mono text-3xl text-fg">This studio is locked.</p>
          <Link to="/$shopSlug/admin" params={{ shopSlug }} className="film-link mt-5">
            Back to the desk
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-dvh bg-obsidian px-5 py-8 sm:px-10">
      <div className="mx-auto max-w-6xl">
        <Link to="/$shopSlug/admin" params={{ shopSlug }} className="text-sm text-muted hover:text-fg">
          Mission control
        </Link>
        <HeroLibraryBench shop={shop} readonly={mode === "preview" || shop.isShowcase} />
      </div>
    </main>
  );
}
