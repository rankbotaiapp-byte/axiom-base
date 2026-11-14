import { useEffect, useState } from "react";
import { Link, Navigate, useParams } from "@tanstack/react-router";
import { BrandWebStudio } from "@/components/admin/brand-web-studio";
import { RedirectToSignIn } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { localStorefront } from "@/lib/axiom/autopilot";
import { materializeDatasetShop } from "@/lib/axiom/autopilot-shop";
import { getOperatorData } from "@/lib/axiom/server";
import type { AccessMode, Shop } from "@/lib/axiom/types";

export default function BrandStudioPage() {
  const { shopSlug } = useParams({ from: "/$shopSlug/admin/brand-studio" });
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
      <main className="admin-hud grid min-h-dvh place-items-center bg-slate-950">
        <div className="h-10 w-48 animate-pulse rounded-full border border-cyan-500/30 bg-slate-900/60" />
      </main>
    );
  }
  if (!user) return <RedirectToSignIn to="/login" next={`/${shopSlug}/admin/brand-studio`} />;
  if (mode === "employee") return <Navigate to="/$shopSlug/employee" params={{ shopSlug }} />;
  if (error || !shop) {
    return (
      <main className="admin-hud grid min-h-dvh place-items-center bg-slate-950 px-6 text-center">
        <div className={`${"rounded-2xl border border-cyan-500/30 bg-slate-900/60 p-8"} max-w-md`}>
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-cyan-400/80">Brand studio</p>
          <p className="mt-3 font-display text-3xl">This studio is locked.</p>
          <Link to="/$shopSlug/admin" params={{ shopSlug }} className="mt-5 inline-flex h-11 items-center text-cyan-300">
            Back to the desk
          </Link>
        </div>
      </main>
    );
  }

  return <BrandWebStudio shop={shop} readonly={mode === "preview" || shop.isShowcase} />;
}
