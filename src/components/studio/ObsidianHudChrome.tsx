"use client";

import type { CSSProperties, ReactNode } from "react";
import { LayoutGrid, MessageSquare, Settings, Sparkles, Users } from "lucide-react";
import {
  resolveStorefrontTheme,
  STOREFRONT_OBSIDIAN,
  themeCssVars,
  type StorefrontThemeId,
} from "@/lib/axiom/storefront-themes";
import { cn } from "@/lib/utils";
import "./obsidian-hud-studio.css";

export function AxiomStudioHudShell({
  brandTitle,
  deskSlug,
  themeId = "cyber_cyan",
  children,
}: {
  brandTitle: string;
  deskSlug: string;
  themeId?: StorefrontThemeId | string;
  children: ReactNode;
}) {
  return (
    <div
      className="axiom-studio-hud min-h-dvh"
      style={themeCssVars(resolveStorefrontTheme(themeId)) as CSSProperties}
    >
      <AxiomHudTopBar brandTitle={brandTitle} deskSlug={deskSlug} />
      <div className="flex min-h-[calc(100dvh-4rem)]">
        <AxiomHudNavRail />
        <div className="min-w-0 flex-1 p-4 lg:p-6">{children}</div>
      </div>
    </div>
  );
}

export function AxiomHudTopBar({ brandTitle, deskSlug }: { brandTitle: string; deskSlug: string }) {
  return (
    <header
      className="sticky top-0 z-40 flex h-16 items-center justify-between gap-4 border-b px-4 lg:px-6"
      style={{
        backgroundColor: STOREFRONT_OBSIDIAN,
        borderColor: "color-mix(in srgb, var(--brand-primary) 18%, transparent)",
      }}
    >
      <div className="min-w-0">
        <p className="truncate font-mono text-[11px] uppercase tracking-[0.22em] text-white/55">
          Axiom Studio <span className="text-white/30">//</span>{" "}
          <span className="text-[var(--brand-glow)]">{deskSlug}</span>
        </p>
        <p className="truncate font-display text-sm font-semibold text-white">{brandTitle}</p>
      </div>
      <div className="axiom-hud-status-pill shrink-0">
        <span className="axiom-hud-status-pill__dot" aria-hidden />
        Axiom AI Booking Agent: <strong className="font-semibold text-white">Online &amp; Active</strong>
      </div>
    </header>
  );
}

function AxiomHudNavRail() {
  const items: {
    icon: typeof LayoutGrid;
    label: string;
    active?: boolean;
  }[] = [
    { icon: LayoutGrid, label: "Site Studio", active: true },
    { icon: Sparkles, label: "AI Copilot", active: false },
    { icon: Users, label: "Leads", active: false },
    { icon: MessageSquare, label: "Bookings", active: false },
    { icon: Settings, label: "Settings", active: false },
  ];

  return (
    <aside className="axiom-hud-rail hidden flex-col items-center gap-4 py-6 md:flex">
      {items.map((item) => (
        <button
          key={item.label}
          type="button"
          title={item.label}
          className={cn(
            "flex h-10 w-10 items-center justify-center rounded-lg border transition",
            item.active
              ? "border-[color-mix(in_srgb,var(--brand-primary)_55%,transparent)] bg-white/[0.04] text-[var(--brand-primary)] shadow-[0_0_18px_color-mix(in_srgb,var(--brand-primary)_25%,transparent)]"
              : "border-transparent text-white/40 hover:border-white/15 hover:text-white/80",
          )}
        >
          <item.icon className="h-4 w-4" aria-hidden />
        </button>
      ))}
    </aside>
  );
}

export function HudGlassPanel({
  className,
  style,
  children,
}: {
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
}) {
  return (
    <div className={cn("axiom-hud-panel p-4 sm:p-5", className)} style={style}>
      {children}
    </div>
  );
}

export function HudSectionTitle({
  kicker,
  title,
  subtitle,
  className,
}: {
  kicker: string;
  title: string;
  subtitle?: string;
  className?: string;
}) {
  return (
    <header className={cn("mb-4", className)}>
      <p className="axiom-hud-kicker">{kicker}</p>
      <h2 className="mt-1 font-display text-lg font-semibold tracking-tight text-white">{title}</h2>
      {subtitle ? <p className="mt-1 text-sm text-white/55">{subtitle}</p> : null}
    </header>
  );
}

export function HudMeter({ label, percent }: { label: string; percent: number }) {
  const clamped = Math.max(0, Math.min(100, percent));
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between font-mono text-[9px] uppercase tracking-[0.16em] text-white/50">
        <span>{label}</span>
        <span className="text-[var(--brand-glow)]">{clamped}%</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${clamped}%`,
            background: `linear-gradient(90deg, var(--brand-primary), var(--brand-secondary))`,
            boxShadow: `0 0 12px color-mix(in srgb, var(--brand-primary) 45%, transparent)`,
          }}
        />
      </div>
    </div>
  );
}