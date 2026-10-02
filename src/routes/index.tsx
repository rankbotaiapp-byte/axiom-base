import { useEffect, useState, type ReactNode } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowUpRight, Store, Truck } from "lucide-react";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { SignedIn, SignedOut, UserButton } from "@/lib/auth/gates";
import { listMyShops, listShowcaseShops } from "@/lib/axiom/server";
import type { Shop } from "@/lib/axiom/types";
import { Wordmark } from "@/components/shop-chrome";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  const { user, isPending } = useCurrentUserState();
  const [mine, setMine] = useState<Shop[] | null>(null);
  const [showcases, setShowcases] = useState<Shop[]>([]);

  useEffect(() => {
    void listShowcaseShops().then(setShowcases).catch(() => setShowcases([]));
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

  const owned = mine?.filter((s) => s.ownerUserId === user?.id) ?? [];

  return (
    <main className="min-h-dvh bg-bg">
      <header className="flex items-center justify-between px-5 py-5 sm:px-10">
        <Wordmark />
        <div className="flex items-center gap-3">
          {isPending ? (
            <div className="size-8 animate-pulse rounded-full bg-fg/10" />
          ) : (
            <>
              <SignedOut>
                <Link to="/login" className="text-sm text-muted hover:text-fg">
                  Sign in
                </Link>
              </SignedOut>
              <SignedIn>
                <UserButton />
              </SignedIn>
            </>
          )}
        </div>
      </header>

      <section className="relative mx-auto max-w-6xl px-5 pb-16 pt-6 sm:px-10 sm:pt-16">
        <p className="text-[11px] uppercase tracking-[0.28em] text-muted">Vertical SaaS · local services</p>
        <h1 className="mt-4 max-w-3xl font-display text-[clamp(2.6rem,8vw,5.6rem)] leading-[0.95] tracking-[-0.03em]">
          Your shop, live before the second cup of coffee.
        </h1>
        <p className="mt-6 max-w-xl text-base leading-relaxed text-muted sm:text-lg">
          Pick a niche. Axiom stands up a booking site, an operator console, and a staff station — then lights the edge of the screen when the first appointment lands.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          {owned[0] ? (
            <Link
              to="/$shopSlug"
              params={{ shopSlug: owned[0].slug }}
              className="inline-flex h-12 items-center justify-center rounded-xl bg-fg px-5 text-sm font-medium text-bg"
            >
              Open {owned[0].name}
            </Link>
          ) : (
            <Link
              to="/onboard"
              className="inline-flex h-12 items-center justify-center rounded-xl bg-fg px-5 text-sm font-medium text-bg"
            >
              Create your shop
            </Link>
          )}
          <a
            href="#live"
            className="inline-flex h-12 items-center justify-center rounded-xl px-5 text-sm text-muted shadow-[0_0_0_1px_rgba(243,241,235,0.1)] hover:text-fg"
          >
            See live shops
          </a>
        </div>

        <div className="mt-14 grid gap-3 sm:grid-cols-2">
          <NicheCard
            icon={<Store className="size-4" />}
            title="Storefront"
            copy="Barbers, salons, studios. They walk in. You run the chair."
          />
          <NicheCard
            icon={<Truck className="size-4" />}
            title="Field service"
            copy="Auto, HVAC, trades. You go to the curb — or they come to the lift."
          />
        </div>
      </section>

      <section id="live" className="border-t border-line px-5 py-16 sm:px-10">
        <div className="mx-auto max-w-6xl">
          <p className="text-[11px] uppercase tracking-[0.22em] text-muted">Live tenants</p>
          <h2 className="mt-2 font-display text-3xl sm:text-4xl">Two shops. Already taking chairs.</h2>
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {showcases.map((s) => (
              <Link
                key={s.id}
                to="/$shopSlug"
                params={{ shopSlug: s.slug }}
                className="group overflow-hidden rounded-[28px] bg-surface shadow-[0_0_0_1px_rgba(243,241,235,0.08)]"
              >
                <div className="relative aspect-[16/10] overflow-hidden">
                  <img
                    src={s.heroImageUrl}
                    alt=""
                    className="h-full w-full object-cover outline-none transition-transform duration-500 ease-out group-hover:scale-[1.03]"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-bg via-transparent to-transparent" />
                </div>
                <div className="flex items-end justify-between gap-3 p-5">
                  <div>
                    <p className="font-display text-2xl">{s.name}</p>
                    <p className="mt-1 text-sm text-muted">{s.tagline}</p>
                  </div>
                  <ArrowUpRight className="size-5 text-muted" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}

function NicheCard({
  icon,
  title,
  copy,
}: {
  icon: ReactNode;
  title: string;
  copy: string;
}) {
  return (
    <div className="rounded-2xl bg-surface p-5 shadow-[0_0_0_1px_rgba(243,241,235,0.08)]">
      <div className="flex size-9 items-center justify-center rounded-lg bg-surface-2 text-fg">
        {icon}
      </div>
      <p className="mt-4 text-sm font-medium">{title}</p>
      <p className="mt-1 text-sm text-muted">{copy}</p>
    </div>
  );
}
