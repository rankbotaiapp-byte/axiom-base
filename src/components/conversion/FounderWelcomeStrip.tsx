"use client";

import { useState } from "react";
import {
  AXIOM_CRO_OFFER_LINE,
  FOUNDER_WELCOME_POSTER,
  FOUNDER_WELCOME_VIDEO,
} from "@/lib/axiom/founder-welcome";
import { cn } from "@/lib/utils";
import "@/components/studio/obsidian-hud-studio.css";

export function FounderWelcomeStrip({
  owner,
  business,
  trade,
  place,
  className,
  compact,
}: {
  owner: string;
  business: string;
  trade: string;
  place: string;
  className?: string;
  compact?: boolean;
}) {
  const [failed, setFailed] = useState(false);
  const target = business.trim() || "your shop";

  return (
    <section
      className={cn(
        "axiom-hud-panel mx-auto max-w-5xl overflow-hidden px-4 py-4 sm:px-5",
        compact && "py-3",
        className,
      )}
      aria-label="Founder welcome"
      data-founder-welcome=""
    >
      <div className="grid gap-4 lg:grid-cols-[minmax(200px,280px)_1fr] lg:items-center">
        <div className="relative overflow-hidden rounded-xl border border-white/10 bg-[#050507]">
          {failed ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={FOUNDER_WELCOME_POSTER} alt="" className="aspect-video w-full object-cover" />
          ) : (
            <video
              className="aspect-video w-full object-cover"
              src={FOUNDER_WELCOME_VIDEO}
              poster={FOUNDER_WELCOME_POSTER}
              autoPlay
              muted
              playsInline
              loop
              preload="metadata"
              onError={() => setFailed(true)}
            />
          )}
        </div>
        <div>
          <p className="axiom-hud-kicker">A note from Eric</p>
          <h2 className="mt-1 font-display text-lg font-semibold text-white sm:text-xl">
            Built for hardworking local trades
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-white/65">
            {owner || "There"}, we locked this preview on <span className="text-[var(--brand-glow)]">{target}</span>
            {trade ? ` · ${trade}` : ""}
            {place ? ` · ${place}` : ""}. Axiom answers after-hours, books on video, and texts you when money is on
            the line.
          </p>
          <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--brand-primary)]">
            {AXIOM_CRO_OFFER_LINE}
          </p>
        </div>
      </div>
    </section>
  );
}