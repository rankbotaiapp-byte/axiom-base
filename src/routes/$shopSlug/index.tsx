import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { CinematicHero, InsetFilm, IntroFxToggle } from "@/components/cinematic-hero";
import { ProductShelf } from "@/components/product-shelf";
import { NeonField, SnapEstimate } from "@/components/snap-estimate";
import { offerModel, shelfFor } from "@/lib/axiom/storefront";
import { LoopOverlay, TourOverlay } from "@/components/tour-overlay";
import { PoweredBy, ShopNav } from "@/components/shop-chrome";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { formatPhone, initials } from "@/lib/utils";
import { ShopProofGallery } from "@/components/proof-gallery";
import { TradeStorefront } from "@/components/trade-storefront";
import { StorefrontAuditWidget } from "@/components/StorefrontAuditWidget";
import { presetsForShop } from "@/config/nichePresets";
import { formatOffer, nicheCopy, serviceGroups, WEEKDAYS } from "@/lib/axiom/niches";
import { heroForCustomNiche, NICHE_MEDIA, resolveHeroMedia } from "@/lib/axiom/media";
import type { AccessMode } from "@/lib/axiom/types";
import { getShopAccess, submitInquiry } from "@/lib/axiom/server";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { useShopPageData } from "./route";

export const Route = createFileRoute("/$shopSlug/")({
  validateSearch: (s: Record<string, unknown>): { tour?: boolean; loop?: boolean; requested?: boolean } => {
    const out: { tour?: boolean; loop?: boolean; requested?: boolean } = {};
    if (s.tour === true || s.tour === "1" || s.tour === "true") out.tour = true;
    if (s.loop === true || s.loop === "1" || s.loop === "true") out.loop = true;
    if (s.requested === true || s.requested === "1" || s.requested === "true") out.requested = true;
    return out;
  },
  component: CustomerHome,
});

function CustomerHome() {
  const data = useShopPageData();
  const search = Route.useSearch();
  const { user, isPending } = useCurrentUserState();
  const [mode, setMode] = useState<AccessMode>("customer");

  useEffect(() => {
    if (isPending || !user) return;
    void getShopAccess({ data: data.shop.slug })
      .then((a) => setMode(a.mode === "none" ? "customer" : a.mode))
      .catch(() => setMode("customer"));
  }, [data.shop.slug, isPending, user]);

  const employees = data.employees ?? [];
  const services = data.services ?? [];
  const hours = data.shop.hours ?? {};
  const invited = employees[employees.length - 1];
  const copy = nicheCopy(data.shop.niche);
  const bookLabel = presetsForShop(data.shop.niche)[0]?.bookingCta ?? copy.bookLabel;
  const contact = employees.find((e) => e.phone)?.phone;
  const hero = resolveHeroMedia(data.shop);
  const nicheFilm = data.shop.customNiche ? heroForCustomNiche(data.shop.customNiche) : NICHE_MEDIA[data.shop.niche];
  const stockFilm = NICHE_MEDIA.trade;

  const neon = data.shop.neonAccent || data.shop.ringColor;
  const staffBlock = (
      <section className="px-5 py-16 sm:px-10">
        <div className="mx-auto max-w-5xl">
          {search.requested ? (
            <p className="mb-10 max-w-lg text-sm text-muted">
              Request received. This shop has it. If you left a phone or email, a confirmation follows when the time is accepted.
            </p>
          ) : null}
          <p className="text-[11px] uppercase tracking-[0.2em] text-muted">{copy.bench}</p>
          <h2 className="mt-2 font-display text-3xl sm:text-4xl">{copy.heading}</h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {employees.map((e) => (
              <Link
                key={e.id}
                to="/$shopSlug/staff/$employeeId"
                params={{ shopSlug: data.shop.slug, employeeId: e.id }}
                className="lift-card flex gap-4 overflow-hidden rounded-[24px] bg-surface/80 p-3 shadow-[0_0_0_1px_rgba(243,241,235,0.08)] backdrop-blur-md"
              >
                {e.avatarUrl ? (
                  <img
                    src={e.avatarUrl}
                    alt=""
                    className="size-28 shrink-0 rounded-[16px] object-cover"
                  />
                ) : (
                  <div className="grid size-28 shrink-0 place-items-center rounded-[16px] bg-surface-2 font-display text-2xl">
                    {initials(e.displayName || "Staff")}
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
          {nicheFilm.insetImageUrl || nicheFilm.insetLoopUrl ? (
            <div className="mt-8 max-w-xl">
              <InsetFilm imageUrl={nicheFilm.insetImageUrl} videoUrl={nicheFilm.insetLoopUrl} />
            </div>
          ) : null}
        </div>
      </section>
  );
  const product = offerModel(data.shop.niche) === "product";
  const shelf = shelfFor(
    data.shop.niche,
    services.map((service) => ({
      id: service.id,
      name: service.name,
      description: service.description,
      priceCents: service.priceCents,
    })),
  );
  const estimateBlock = (
    <section className="px-5 pb-4 sm:px-10">
      <div className="mx-auto max-w-5xl">
        {product ? (
          <ProductShelf items={shelf} />
        ) : (
          <SnapEstimate
            niche={data.shop.niche}
            bookLabel={bookLabel}
            shopSlug={data.shop.slug}
            lines={services.map((service) => ({
              name: service.name,
              description: service.description,
              priceCents: service.priceCents,
            }))}
            bookTo={`/${data.shop.slug}/book`}
          />
        )}
      </div>
    </section>
  );
  const menuBlock = (
      <section className="border-t border-line px-5 py-16 sm:px-10">
        <div className="mx-auto grid max-w-5xl gap-10 md:grid-cols-[1.2fr_0.8fr]">
          <div>
            <p className="text-[11px] uppercase tracking-[0.2em] text-muted">{copy.menuKicker}</p>
            <h2 className="mt-2 font-display text-3xl">{copy.menuHeading}</h2>
            <div className="mt-6">
              {serviceGroups(services).map((group) => (
                <div key={group.label || "menu"} className="mt-8 first:mt-0">
                  {group.label ? (
                    <p className="text-[11px] uppercase tracking-[0.18em] text-muted">{group.label}</p>
                  ) : null}
                  <ul className="divide-y divide-line">
                    {group.items.map((s) => {
                      const item = shelf.find((row) => row.id === s.id || row.name === s.name);
                      return (
                      <li key={s.id} className="flex min-w-0 items-baseline justify-between gap-4 py-4">
                        <div className="min-w-0">
                          <p className="break-words font-medium">{s.name}</p>
                          <p className="text-sm text-muted">{s.description}</p>
                          {item ? (
                            <p className="text-sm text-muted">{item.attribute} · {item.stock} in stock</p>
                          ) : null}
                        </div>
                        <p className="tabular shrink-0 text-sm text-muted">{formatOffer(s)}</p>
                      </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </div>
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-[0.2em] text-muted">Hours</p>
            <ul className="mt-4 space-y-2 text-sm">
              {WEEKDAYS.map(([k, label]) => (
                <li key={k} className="flex justify-between">
                  <span className="text-muted">{label}</span>
                  <span className="tabular">{hours[k] ?? "closed"}</span>
                </li>
              ))}
            </ul>
            <p className="mt-6 text-sm text-muted">{data.shop.description}</p>
            <p className="mt-2 text-sm text-muted">{data.shop.address}</p>
            <InquiryForm slug={data.shop.slug} label={copy.inquiry} />
            {contact ? (
              <a href={`tel:${contact}`} className="mt-2 block text-sm tabular text-muted hover:text-fg">
                {formatPhone(String(contact))}
              </a>
            ) : null}
          </div>
        </div>
      </section>
  );
  const blocks = { staff: staffBlock, estimate: estimateBlock, menu: menuBlock };

  return (
    <div className="bg-bg" data-neon={data.shop.glowEnabled ? "on" : "off"} style={{ ["--neon" as string]: neon }}>
      <NeonField active={data.shop.glowEnabled} />
      <CinematicHero
        imageUrl={hero.imageUrl}
        videoUrl={hero.videoUrl}
        blendPercent={data.shop.heroBlendPercent}
        introPreset={data.shop.introPreset}
        introSpeed={data.shop.introSpeed}
        introIntensity={data.shop.introIntensity}
        tone={hero.tone}
        fallbackImageUrl={data.shop.customNiche ? stockFilm.heroImageUrl : nicheFilm.heroImageUrl}
        fallbackVideoUrl={data.shop.customNiche ? stockFilm.heroVideoUrl : nicheFilm.heroVideoUrl}
      >
        <div className="hero-scrim pointer-events-none absolute inset-x-0 top-0 z-0 h-40" aria-hidden />
        <div className="relative z-10">
          <ShopNav shop={data.shop} mode={mode} highlightAdmin={search.tour} />
        </div>
        <div className="mt-auto px-5 pb-28 pt-24 sm:px-10">
          {data.shop.customNiche ? (
            <p className="text-[11px] uppercase tracking-[0.22em] text-muted">{data.shop.customNiche}</p>
          ) : null}
          <p className={`text-[11px] uppercase tracking-[0.22em] text-muted${data.shop.customNiche ? " mt-2" : ""}`}>
            {data.shop.address}
          </p>
          <h1 className="mt-3 max-w-3xl break-words font-display text-[clamp(3rem,10vw,6.5rem)] leading-[0.92]">
            {data.shop.name}
          </h1>
          <p className="mt-4 max-w-lg text-base text-fg/80 sm:text-lg">{data.shop.tagline}</p>
          <Link
            to="/$shopSlug/book"
            params={{ shopSlug: data.shop.slug }}
            className="glass-btn mt-8 inline-flex h-12 items-center gap-2 rounded-xl px-5 text-sm font-medium"
          >
            {bookLabel}
            <ArrowRight className="size-4" />
          </Link>
        </div>
      </CinematicHero>

      <TradeStorefront shop={data.shop} services={services} phone={contact ? String(contact) : ""} />

      <ShopProofGallery slug={data.shop.slug} niche={data.shop.niche} heading={copy.gallery} />

      <section className="px-5 pb-28 sm:px-10 sm:pb-16">
        <StorefrontAuditWidget
          tenantId={data.shop.id}
          businessName={data.shop.name}
          niche={data.shop.niche}
          bookSlug={data.shop.slug}
        />
      </section>

      {data.shop.layout.map((block) => (
        <div key={block}>{blocks[block]}</div>
      ))}

      <PoweredBy />

      <div className="sticky bottom-0 z-30 border-t border-line bg-bg/90 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:hidden">
        <div className="mb-2 flex justify-center">
          <IntroFxToggle />
        </div>
        <Link
          to="/$shopSlug/book"
          params={{ shopSlug: data.shop.slug }}
          className="glass-btn flex h-12 items-center justify-center rounded-xl text-sm font-medium"
        >
          {bookLabel}
        </Link>
      </div>

      {search.tour ? <TourOverlay slug={data.shop.slug} /> : null}
      {search.loop ? <LoopOverlay slug={data.shop.slug} employeeId={invited?.id} /> : null}
    </div>
  );
}

function InquiryForm({ slug, label }: { slug: string; label: string }) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  return (
    <form
      className="mt-8 grid gap-3"
      onSubmit={(event) => {
        event.preventDefault();
        setBusy(true);
        setError(null);
        void submitInquiry({ data: { slug, name, phone, message } })
          .then(() => {
            setSent(true);
            setMessage("");
          })
          .catch((err: unknown) => setError(err instanceof Error ? err.message : "Could not send"))
          .finally(() => setBusy(false));
      }}
    >
      <p className="text-[11px] uppercase tracking-[0.2em] text-muted">{label}</p>
      {sent ? <p className="text-sm text-ok">Sent. They have it on the console.</p> : null}
      <div>
        <Label htmlFor="inq-name">Name</Label>
        <Input id="inq-name" value={name} onChange={(e) => setName(e.target.value)} required />
      </div>
      <div>
        <Label htmlFor="inq-phone">Phone</Label>
        <Input id="inq-phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Optional" />
      </div>
      <div>
        <Label htmlFor="inq-msg">Message</Label>
        <textarea
          id="inq-msg"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          required
          minLength={8}
          rows={3}
          className="mt-2 w-full rounded-xl bg-surface-2 px-3 py-2 text-sm text-fg shadow-[0_0_0_1px_rgba(243,241,235,0.08)]"
        />
      </div>
      {error ? <p className="text-sm text-danger">{error}</p> : null}
      <Button type="submit" disabled={busy}>
        {busy ? "Sending" : "Send inquiry"}
      </Button>
    </form>
  );
}
