import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { CinematicHero } from "@/components/cinematic-hero";
import { LoopOverlay, TourOverlay } from "@/components/tour-overlay";
import { PoweredBy, ShopNav } from "@/components/shop-chrome";
import { formatMoney, formatPhone, initials } from "@/lib/utils";
import { nicheCopy, WEEKDAYS } from "@/lib/axiom/niches";
import type { AccessMode } from "@/lib/axiom/types";
import { getShopAccess } from "@/lib/axiom/server";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { Route as ShopLayoutRoute } from "./route";

export const Route = createFileRoute("/$shopSlug/")({
  validateSearch: (s: Record<string, unknown>): { tour?: boolean; loop?: boolean } => {
    const out: { tour?: boolean; loop?: boolean } = {};
    if (s.tour === true || s.tour === "1" || s.tour === "true") out.tour = true;
    if (s.loop === true || s.loop === "1" || s.loop === "true") out.loop = true;
    return out;
  },
  component: CustomerHome,
});

function CustomerHome() {
  const data = ShopLayoutRoute.useLoaderData();
  const search = Route.useSearch();
  const { user, isPending } = useCurrentUserState();
  const [mode, setMode] = useState<AccessMode>("customer");

  useEffect(() => {
    if (isPending || !user) return;
    void getShopAccess({ data: data.shop.slug })
      .then((a) => setMode(a.mode === "none" ? "customer" : a.mode))
      .catch(() => setMode("customer"));
  }, [data.shop.slug, isPending, user]);

  const invited = data.employees[data.employees.length - 1];
  const copy = nicheCopy(data.shop.niche);
  const contact = data.employees.find((e) => e.phone)?.phone;

  return (
    <div className="bg-bg">
      <CinematicHero
        imageUrl={data.shop.heroImageUrl}
        videoUrl={data.shop.heroVideoUrl}
        blendPercent={data.shop.heroBlendPercent}
        ringColor={data.shop.ringColor}
      >
        <ShopNav shop={data.shop} mode={mode} highlightAdmin={search.tour} />
        <div className="mt-auto px-5 pb-28 pt-24 sm:px-10">
          <p className="text-[11px] uppercase tracking-[0.22em] text-muted">{data.shop.address}</p>
          <h1 className="mt-3 max-w-3xl font-display text-[clamp(3rem,10vw,6.5rem)] leading-[0.92]">
            {data.shop.name}
          </h1>
          <p className="mt-4 max-w-lg text-base text-fg/80 sm:text-lg">{data.shop.tagline}</p>
          <Link
            to="/$shopSlug/book"
            params={{ shopSlug: data.shop.slug }}
            className="mt-8 inline-flex h-12 items-center gap-2 rounded-xl bg-fg px-5 text-sm font-medium text-bg"
          >
            Book now
            <ArrowRight className="size-4" />
          </Link>
        </div>
      </CinematicHero>

      <section className="px-5 py-16 sm:px-10">
        <div className="mx-auto max-w-5xl">
          <p className="text-[11px] uppercase tracking-[0.2em] text-muted">{copy.bench}</p>
          <h2 className="mt-2 font-display text-3xl sm:text-4xl">{copy.heading}</h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {data.employees.map((e) => (
              <Link
                key={e.id}
                to="/$shopSlug/staff/$employeeId"
                params={{ shopSlug: data.shop.slug, employeeId: e.id }}
                className="flex gap-4 overflow-hidden rounded-[24px] bg-surface p-3 shadow-[0_0_0_1px_rgba(243,241,235,0.08)]"
              >
                {e.avatarUrl ? (
                  <img
                    src={e.avatarUrl}
                    alt=""
                    className="size-28 shrink-0 rounded-[16px] object-cover"
                  />
                ) : (
                  <div className="grid size-28 shrink-0 place-items-center rounded-[16px] bg-surface-2 font-display text-2xl">
                    {initials(e.displayName)}
                  </div>
                )}
                <div className="py-2 pr-2">
                  <p className="font-display text-2xl leading-tight">{e.displayName}</p>
                  <p className="text-sm text-muted">{e.title}</p>
                  {e.phone ? (
                    <p className="mt-1 text-sm tabular text-muted">{formatPhone(e.phone)}</p>
                  ) : null}
                  <p className="mt-2 line-clamp-3 text-sm text-muted">{e.bio}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-line px-5 py-16 sm:px-10">
        <div className="mx-auto grid max-w-5xl gap-10 md:grid-cols-[1.2fr_0.8fr]">
          <div>
            <p className="text-[11px] uppercase tracking-[0.2em] text-muted">Menu</p>
            <h2 className="mt-2 font-display text-3xl">Services</h2>
            <ul className="mt-6 divide-y divide-line">
              {data.services.map((s) => (
                <li key={s.id} className="flex items-baseline justify-between gap-4 py-4">
                  <div>
                    <p className="font-medium">{s.name}</p>
                    <p className="text-sm text-muted">{s.description}</p>
                  </div>
                  <p className="tabular shrink-0 text-sm text-muted">
                    {formatMoney(s.priceCents)}
                    <span className="ml-2 text-faint">{s.durationMin}m</span>
                  </p>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-[0.2em] text-muted">Hours</p>
            <ul className="mt-4 space-y-2 text-sm">
              {WEEKDAYS.map(([k, label]) => (
                <li key={k} className="flex justify-between">
                  <span className="text-muted">{label}</span>
                  <span className="tabular">{data.shop.hours[k] ?? "closed"}</span>
                </li>
              ))}
            </ul>
            <p className="mt-6 text-sm text-muted">{data.shop.address}</p>
            {contact ? (
              <a href={`tel:${contact}`} className="mt-2 block text-sm tabular text-muted hover:text-fg">
                {formatPhone(contact)}
              </a>
            ) : null}
          </div>
        </div>
      </section>

      <PoweredBy />

      <div className="sticky bottom-0 z-30 border-t border-line bg-bg/90 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:hidden">
        <Link
          to="/$shopSlug/book"
          params={{ shopSlug: data.shop.slug }}
          className="flex h-12 items-center justify-center rounded-xl bg-fg text-sm font-medium text-bg"
        >
          Book now
        </Link>
      </div>

      {search.tour ? <TourOverlay slug={data.shop.slug} /> : null}
      {search.loop ? <LoopOverlay slug={data.shop.slug} employeeId={invited?.id} /> : null}
    </div>
  );
}
