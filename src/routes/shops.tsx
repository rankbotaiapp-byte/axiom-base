import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowUpRight } from "lucide-react";
import { RedirectToSignIn } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { listMyShops, listShowcaseShops } from "@/lib/axiom/server";
import type { Shop } from "@/lib/axiom/types";
import { nicheLabel } from "@/lib/axiom/directory";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/shops")({
  head: () => ({
    meta: [
      { title: "Tenant directory · Axiom" },
      { name: "theme-color", content: "#030712" },
      { name: "description", content: "Select a storefront portal or open your shops." },
    ],
  }),
  component: ShopsDirectory,
});

function ShopsDirectory() {
  const { user, isPending } = useCurrentUserState();
  const [mine, setMine] = useState<Shop[] | null>(null);
  const [showcases, setShowcases] = useState<Shop[] | null>(null);

  useEffect(() => {
    void listShowcaseShops()
      .then(setShowcases)
      .catch(() => setShowcases([]));
  }, []);

  useEffect(() => {
    if (!user) {
      setMine(null);
      return;
    }
    void listMyShops()
      .then(setMine)
      .catch(() => setMine([]));
  }, [user]);

  if (isPending) {
    return (
      <main className="grid min-h-dvh place-items-center" style={{ background: "#030712" }}>
        <div className="h-10 w-48 animate-pulse rounded-full bg-[#00ffcc]/15" />
      </main>
    );
  }

  if (!user) {
    return <RedirectToSignIn to="/login" next="/shops" />;
  }

  return (
    <main className="min-h-dvh px-5 py-8 text-[#e8e8ed] sm:px-10" style={{ background: "#030712" }}>
      <header className="mx-auto flex max-w-5xl flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-[#00ffcc]/80">Void · Tenant directory</p>
          <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight sm:text-4xl">Portal selection</h1>
          <p className="mt-2 max-w-lg text-sm text-[#8b8b96]">
            Choose a storefront to enter, or open one of your shops.
          </p>
        </div>
        <Link
          to="/login"
          className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 font-mono text-[10px] uppercase tracking-[0.18em] text-[#8b8b96] backdrop-blur-md hover:border-[#00ffcc]/35 hover:text-[#e8e8ed]"
        >
          Portal gate
        </Link>
      </header>

      <section className="mx-auto mt-10 max-w-5xl">
        <h2 className="font-mono text-[11px] uppercase tracking-[0.22em] text-[#5c5c66]">Your shops</h2>
        <ShopGrid shops={mine} empty="No shops linked to this operator yet." owned />
      </section>

      <section className="mx-auto mt-12 max-w-5xl pb-16">
        <h2 className="font-mono text-[11px] uppercase tracking-[0.22em] text-[#5c5c66]">Showcase portals</h2>
        <ShopGrid shops={showcases} empty="No showcase storefronts online." />
      </section>
    </main>
  );
}

function ShopGrid({
  shops,
  empty,
  owned = false,
}: {
  shops: Shop[] | null;
  empty: string;
  owned?: boolean;
}) {
  if (!shops) {
    return <div className="mt-4 h-24 animate-pulse rounded-2xl bg-white/5" />;
  }
  if (shops.length === 0) {
    return <p className="mt-4 text-sm text-[#8b8b96]">{empty}</p>;
  }
  return (
    <ul className="mt-4 grid gap-3 sm:grid-cols-2">
      {shops.map((shop) => (
        <li key={shop.id}>
          <Link
            to="/$shopSlug"
            params={{ shopSlug: shop.slug }}
            className={cn(
              "group flex items-start justify-between gap-3 rounded-2xl border border-white/10 bg-[#0a0f1a]/70 p-4 backdrop-blur-md transition",
              "hover:border-[#00ffcc]/40 hover:shadow-[0_0_28px_rgba(0,255,204,0.12)]",
            )}
          >
            <div>
              <p className="font-medium text-[#e8e8ed]">{shop.name}</p>
              <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.18em] text-[#8b8b96]">
                {nicheLabel(shop.niche)}
                {owned ? " · owned" : ""}
              </p>
              {shop.tagline ? <p className="mt-2 line-clamp-2 text-sm text-[#8b8b96]">{shop.tagline}</p> : null}
            </div>
            <ArrowUpRight className="mt-0.5 size-4 shrink-0 text-[#00ffcc]/60 transition group-hover:text-[#00ffcc]" />
          </Link>
        </li>
      ))}
    </ul>
  );
}
