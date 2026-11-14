"use client";

import { CATALOG } from "@/config/catalog";
import { cn } from "@/lib/utils";

/** Display order for the hero strip — lead with common local trades. */
const MARQUEE_PRIORITY = [
  "hvac",
  "electrical",
  "landscaping",
  "roofing",
  "plumbing",
  "auto",
  "contractor",
  "barber",
  "woodworking",
  "security",
  "personal-trainer",
  "beauty-salon",
] as const;

function marqueeLabels(): string[] {
  const byId = new Map(CATALOG.map((row) => [row.id, row.label] as const));
  const lead: string[] = [];
  for (const id of MARQUEE_PRIORITY) {
    const label = byId.get(id);
    if (label) lead.push(label);
  }
  const rest = CATALOG.map((row) => row.label).filter((label) => !lead.includes(label));
  // Marketing aliases that map onto catalog coverage without inventing tenants.
  const aliases = ["Cleaning", "Junk removal", "Painting", "Locksmith"];
  return [...lead, ...rest, ...aliases];
}

type IndustryMarqueeProps = {
  className?: string;
};

/**
 * Subtle infinite badge strip under hero copy — signals Axiom covers local trades at large.
 */
export function IndustryMarquee({ className }: IndustryMarqueeProps) {
  const labels = marqueeLabels();
  const loop = [...labels, ...labels];

  return (
    <div
      className={cn("relative z-0 w-full max-w-2xl overflow-hidden py-1", className)}
      role="presentation"
      aria-hidden
    >
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-10 bg-gradient-to-r from-obsidian/90 to-transparent sm:w-14" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-10 bg-gradient-to-l from-obsidian/90 to-transparent sm:w-14" />
      <div className="industry-marquee-track flex w-max items-center gap-2 py-1.5">
        {loop.map((label, index) => (
          <span
            key={`${label}-${index}`}
            className={cn(
              "inline-flex shrink-0 items-center rounded-full border border-line/80 bg-obsidian/55 px-3 py-1",
              "font-mono text-[10px] uppercase tracking-[0.16em] text-muted/90 backdrop-blur-md",
            )}
          >
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}
