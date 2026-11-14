import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { HeroLibraryBench } from "@/components/admin/hero-library-bench";
import { RedirectToSignIn } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { getOperatorData, listMyShops } from "@/lib/axiom/server";
import type { Shop } from "@/lib/axiom/types";

export default function MasterHeroLibraryPage() {
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
  if (!user) return <RedirectToSignIn to="/login" next="/admin/branding/hero-library" />;
  if (error || !shop) {
    return (
      <main className="grid min-h-dvh place-items-center bg-obsidian px-6 text-center">
        <div className="film-glass max-w-md rounded-2xl px-6 py-8">
          <p className="film-kicker">Hero library</p>
          <p className="mt-3 font-mono text-3xl text-fg">{error || "No shop on this desk."}</p>
          <Link to="/onboard" className="film-link mt-5">
            Create a shop
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-dvh bg-obsidian px-5 py-8 sm:px-10">
      <div className="mx-auto max-w-6xl">
        <Link to="/$shopSlug/admin" params={{ shopSlug: shop.slug }} className="text-sm text-muted hover:text-fg">
          {shop.name} desk
        </Link>
        <HeroLibraryBench shop={shop} readonly={false} />
      </div>
    </main>
  );
}
