import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { RedirectToSignIn } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { listMyShops } from "@/lib/axiom/server";
import { Wordmark } from "@/components/shop-chrome";

export const Route = createFileRoute("/welcome")({
  validateSearch: (search: Record<string, unknown>): { shop?: string } => ({
    shop: typeof search.shop === "string" && search.shop.trim() ? search.shop.trim() : undefined,
  }),
  component: Welcome,
});

function Welcome() {
  const { shop } = Route.useSearch();
  const { user, isPending } = useCurrentUserState();
  const [slug, setSlug] = useState(shop ?? "");

  useEffect(() => {
    if (shop || !user) return;
    void listMyShops()
      .then((shops) => {
        const owned = shops.find((row) => row.ownerUserId === user.id) ?? shops[0];
        if (owned) setSlug(owned.slug);
      })
      .catch(() => undefined);
  }, [shop, user]);

  if (isPending) {
    return (
      <main className="grid min-h-dvh place-items-center bg-bg">
        <div className="h-10 w-48 animate-pulse rounded-full bg-fg/8" />
      </main>
    );
  }
  if (!user) return <RedirectToSignIn to="/login" />;

  return (
    <main className="min-h-dvh bg-bg px-5 py-6 sm:px-10">
      <Wordmark />
      <div className="mx-auto mt-10 max-w-3xl pb-16">
        <p className="text-[11px] uppercase tracking-[0.22em] text-muted">New Era Apps</p>
        <h1 className="mt-3 font-display text-4xl leading-none sm:text-5xl">You're on the book.</h1>
        <p className="mt-3 max-w-lg text-muted">A short introduction, then the desk.</p>
        <div className="mt-8 overflow-hidden rounded-[24px] bg-surface shadow-[0_0_0_1px_rgba(243,241,235,0.08)]">
          <video
            className="aspect-video w-full"
            src="/media/heroes/intro-welcome.mp4"
            autoPlay
            playsInline
            controls
          />
        </div>
        {slug ? (
          <Link
            to="/$shopSlug/admin"
            params={{ shopSlug: slug }}
            className="mt-6 inline-flex h-12 w-full items-center justify-center rounded-xl bg-fg text-sm font-medium text-bg sm:w-auto sm:px-6"
          >
            Continue to Dashboard
          </Link>
        ) : (
          <Link
            to="/onboard"
            className="mt-6 inline-flex h-12 w-full items-center justify-center rounded-xl bg-fg text-sm font-medium text-bg sm:w-auto sm:px-6"
          >
            Continue to Dashboard
          </Link>
        )}
      </div>
    </main>
  );
}
