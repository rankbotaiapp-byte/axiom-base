"use client";

import { useEffect, useState } from "react";
import { CalendarCheck, Images, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

type ActivityCard = {
  id: string;
  trade: string;
  headline: string;
  detail: string;
  tone: "accent" | "amber";
  icon: "zap" | "book" | "proof";
  /** Tailwind position classes for desktop float layout. */
  place: string;
  drift: string;
  delay: string;
};

const BASE_CARDS: ActivityCard[] = [
  {
    id: "book",
    trade: "HVAC",
    headline: "Service booked",
    detail: "Valley Air · 4m ago",
    tone: "accent",
    icon: "book",
    place: "right-[3%] top-[12%] hidden lg:flex",
    drift: "hero-float-a",
    delay: "0s",
  },
  {
    id: "proof",
    trade: "Roofing",
    headline: "Proof plate live",
    detail: "Ridge Line · gallery +1",
    tone: "amber",
    icon: "proof",
    place: "right-[4%] top-[28%] hidden xl:flex",
    drift: "hero-float-b",
    delay: "0.8s",
  },
  {
    id: "pay",
    trade: "Electrical",
    headline: "Stripe cleared",
    detail: "Cascade Electric · $420",
    tone: "accent",
    icon: "zap",
    place: "right-[5%] top-[44%] hidden xl:flex",
    drift: "hero-float-c",
    delay: "1.4s",
  },
];

const ROTATIONS = [
  { trade: "Landscaping", headline: "Site visit locked", detail: "Creek Line · just now" },
  { trade: "Plumbing", headline: "Emergency slot filled", detail: "Main Street · 2m ago" },
  { trade: "Auto", headline: "Bay booked overnight", detail: "Night Circuit · 6m ago" },
  { trade: "Cleaning", headline: "Recurring job started", detail: "North Shine · 9m ago" },
  { trade: "Barber", headline: "Chair reserved", detail: "Ashland · 11m ago" },
  { trade: "Construction", headline: "Estimate accepted", detail: "Rogue · 14m ago" },
];

function IconGlyph({ kind }: { kind: ActivityCard["icon"] }) {
  if (kind === "book") return <CalendarCheck className="size-3.5" aria-hidden />;
  if (kind === "proof") return <Images className="size-3.5" aria-hidden />;
  return <Zap className="size-3.5" aria-hidden />;
}

type HeroActivityCardsProps = {
  reducedMotion?: boolean;
};

/**
 * Decorative floating glass proof / activity chips for the corporate hero.
 * Simulated live stats — pointer-events none so they never block the CTA.
 */
export function HeroActivityCards({ reducedMotion = false }: HeroActivityCardsProps) {
  const [tick, setTick] = useState(0);
  const [liveCount, setLiveCount] = useState(128);

  useEffect(() => {
    if (reducedMotion) return;
    const id = window.setInterval(() => {
      setTick((n) => n + 1);
      setLiveCount((n) => n + (Math.random() > 0.45 ? 1 : 0));
    }, 4200);
    return () => window.clearInterval(id);
  }, [reducedMotion]);

  return (
    <div className="pointer-events-none absolute inset-0 z-[5] overflow-hidden" aria-hidden>
      {/* Live pulse strip — visible on tablet+ without crowding the CTA */}
      <div
        className={cn(
          "absolute right-6 top-24 hidden items-center gap-2 rounded-full border border-accent/25 md:flex lg:right-10 lg:top-28",
          "bg-obsidian/55 px-3 py-1.5 backdrop-blur-md",
          "shadow-[0_8px_28px_color-mix(in_srgb,var(--color-obsidian)_55%,transparent),0_0_24px_color-mix(in_srgb,var(--color-accent)_12%,transparent)]",
          !reducedMotion && "hero-float-pulse",
        )}
      >
        <span className="relative flex size-2">
          <span className="absolute inline-flex size-full animate-ping rounded-full bg-accent opacity-40" />
          <span className="relative inline-flex size-2 rounded-full bg-accent" />
        </span>
        <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-accent/90">
          {liveCount} shops live
        </span>
      </div>

      {BASE_CARDS.map((card, index) => {
        const rotation = ROTATIONS[(tick + index) % ROTATIONS.length]!;
        const trade = index === 0 ? rotation.trade : card.trade;
        const headline = index === 0 ? rotation.headline : card.headline;
        const detail = index === 0 ? rotation.detail : card.detail;
        const toneBorder =
          card.tone === "amber"
            ? "border-amber/35 shadow-[0_12px_36px_color-mix(in_srgb,var(--color-obsidian)_50%,transparent),0_0_28px_color-mix(in_srgb,var(--color-amber)_14%,transparent)]"
            : "border-accent/30 shadow-[0_12px_36px_color-mix(in_srgb,var(--color-obsidian)_50%,transparent),0_0_28px_color-mix(in_srgb,var(--color-accent)_14%,transparent)]";
        const toneText = card.tone === "amber" ? "text-amber" : "text-accent";

        return (
          <article
            key={card.id}
            className={cn(
              "absolute w-[11.5rem] flex-col gap-1.5 rounded-2xl border bg-obsidian/55 p-3 backdrop-blur-md",
              toneBorder,
              card.place,
              !reducedMotion && card.drift,
            )}
            style={!reducedMotion ? { animationDelay: card.delay } : undefined}
          >
            <div className="flex items-center justify-between gap-2">
              <span className={cn("inline-flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-[0.18em]", toneText)}>
                <IconGlyph kind={card.icon} />
                {trade}
              </span>
              <span className="size-1.5 rounded-full bg-ok/80 shadow-[0_0_8px_color-mix(in_srgb,var(--color-ok)_55%,transparent)]" />
            </div>
            <p className="text-xs font-medium leading-snug text-fg">{headline}</p>
            <p className="font-mono text-[10px] tracking-wide text-muted">{detail}</p>
          </article>
        );
      })}
    </div>
  );
}
