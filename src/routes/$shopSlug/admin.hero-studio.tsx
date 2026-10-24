import { useEffect, useState } from "react";
import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { HeroStudioClient } from "@/components/HeroStudioClient";
import { RedirectToSignIn } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { getOperatorData } from "@/lib/axiom/server";
import type { AccessMode, Shop } from "@/lib/axiom/types";

export const Route = createFileRoute("/$shopSlug/admin/hero-studio")({
  component: HeroStudioPage,
});

function HeroStudioPage() {
  const { shopSlug } = Route.useParams();
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
        if (!cancelled) setError(err instanceof Error ? err.message : "Forbidden");
      });
    return () => {
      cancelled = true;
    };
  }, [isPending, shopSlug, userId]);

  if (isPending || (user && !shop && !error)) {
    return (
      <main className="grid min-h-dvh place-items-center bg-bg">
        <div className="h-10 w-48 animate-pulse rounded-full bg-fg/10" />
      </main>
    );
  }
  if (!user) return <RedirectToSignIn to="/login" next={`/${shopSlug}/admin/hero-studio`} />;
  if (error || !shop) {
    return (
      <main className="grid min-h-dvh place-items-center bg-bg px-6 text-center">
        <div>
          <p className="font-display text-3xl text-fg">This studio is locked.</p>
          <p className="mt-2 text-sm text-muted">Sign in as the shop owner to brand the hero.</p>
          <Link to="/$shopSlug/admin" params={{ shopSlug }} className="mt-4 inline-block text-sm text-accent">
            Back to the desk
          </Link>
        </div>
      </main>
    );
  }
  if (mode === "employee") {
    return <Navigate to="/$shopSlug/employee" params={{ shopSlug }} />;
  }

  return (
    <main className="min-h-dvh bg-bg">
      <HeroStudioClient shop={shop} readonly={mode === "preview"} />
    </main>
  );
}
