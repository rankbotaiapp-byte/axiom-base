"use client";

import { useEffect, useId, useState } from "react";
import { CalendarCheck, Clapperboard, Settings2, Sparkles, X } from "lucide-react";
import { cn } from "@/lib/utils";

export type CompanionPersona = "female" | "male";
export type CompanionEnvironment = "storefront" | "admin" | "hero-studio";

const ASSETS = {
  female: {
    still: "/media/ai-female.png",
    loop: "/media/ai-female.mp4",
    callsign: "AX-FEM",
    name: "Nova",
  },
  male: {
    still: "/media/ai-male.png",
    loop: "",
    callsign: "AX-MAL",
    name: "Orbit",
  },
} as const;

type Action = {
  id: string;
  label: string;
  detail: string;
  icon: typeof CalendarCheck;
  onClick?: () => void;
  href?: string;
};

export function CyberCompanionHud({
  environment,
  shopName,
  shopSlug,
  bookHref,
  onBook,
  onFocusArchive,
  className,
}: {
  environment: CompanionEnvironment;
  shopName: string;
  shopSlug: string;
  bookHref?: string;
  onBook?: () => void;
  /** Hero Studio: scroll/focus the historical archive picker. */
  onFocusArchive?: () => void;
  className?: string;
}) {
  const titleId = useId();
  const [open, setOpen] = useState(false);
  const [persona, setPersona] = useState<CompanionPersona>("female");
  const [ping, setPing] = useState(12);
  const [sync, setSync] = useState(98.4);
  const asset = ASSETS[persona];
  const role = environment === "storefront" ? "concierge" : "guide";

  useEffect(() => {
    if (!open) return;
    const tick = () => {
      setPing(Math.round(8 + Math.random() * 16));
      setSync((s) => Math.min(99.97, Math.max(96.8, s + (Math.random() - 0.5) * 0.5)));
    };
    tick();
    const id = window.setInterval(tick, 1400);
    return () => window.clearInterval(id);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const actions = actionsFor({
    environment,
    shopSlug,
    bookHref,
    onBook: () => {
      setOpen(false);
      onBook?.();
    },
    onFocusArchive: () => {
      setOpen(false);
      onFocusArchive?.();
    },
  });

  const blurb =
    environment === "storefront"
      ? `I can walk you through ${shopName}'s services and open the book.`
      : environment === "hero-studio"
        ? "Pick any historical MP4 from the archive, live-test it on your hero, then publish."
        : "I help you run storefront settings, hero loops, and the operator desk.";

  return (
    <div
      className={cn(
        "cyber-companion pointer-events-none fixed bottom-4 left-4 z-40 flex max-w-[min(22rem,calc(100vw-2rem))] flex-col items-start gap-3 sm:bottom-6 sm:left-6",
        className,
      )}
    >
      {open ? (
        <section
          role="dialog"
          aria-labelledby={titleId}
          className="pointer-events-auto w-full overflow-hidden rounded-2xl border border-[#00ffcc]/25 bg-[#030712]/92 shadow-[0_0_0_1px_rgba(0,255,204,0.12),0_0_40px_rgba(88,28,135,0.35)] backdrop-blur-xl"
        >
          <div className="flex items-start gap-3 border-b border-white/10 px-4 py-3">
            <CompanionOrb persona={persona} size="sm" live={open} />
            <div className="min-w-0 flex-1">
              <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[#00ffcc]/80">
                {role === "concierge" ? "Virtual concierge" : "System guide"} · {asset.callsign}
              </p>
              <h2 id={titleId} className="mt-1 font-display text-xl leading-none text-fg">
                {asset.name}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-muted">{blurb}</p>
            </div>
            <button
              type="button"
              className="grid size-11 shrink-0 place-items-center rounded-full text-muted hover:text-fg"
              aria-label="Close companion"
              onClick={() => setOpen(false)}
            >
              <X className="size-4" />
            </button>
          </div>

          <div className="grid grid-cols-3 gap-2 border-b border-white/10 px-4 py-3 font-mono text-[10px] uppercase tracking-[0.16em]">
            <Telemetry label="Link" value={`${ping}ms`} tone="cyan" />
            <Telemetry label="Sync" value={`${sync.toFixed(1)}%`} tone="violet" />
            <Telemetry label="Mode" value={role === "concierge" ? "Guest" : "Ops"} tone="cyan" />
          </div>

          <div className="flex gap-2 px-4 pt-3" role="group" aria-label="Companion persona">
            {(["female", "male"] as const).map((id) => (
              <button
                key={id}
                type="button"
                aria-pressed={persona === id}
                onClick={() => setPersona(id)}
                className={cn(
                  "flex flex-1 items-center gap-2 rounded-xl border px-2 py-2 text-left transition",
                  persona === id
                    ? "border-[#00ffcc]/60 bg-[#00ffcc]/10 text-fg"
                    : "border-white/10 bg-white/[0.02] text-muted hover:border-[#00ffcc]/30",
                )}
              >
                <CompanionOrb persona={id} size="xs" live={persona === id} />
                <span className="min-w-0">
                  <span className="block truncate text-sm text-fg">{ASSETS[id].name}</span>
                  <span className="block font-mono text-[9px] uppercase tracking-[0.14em] text-muted">
                    {ASSETS[id].callsign}
                  </span>
                </span>
              </button>
            ))}
          </div>

          <ul className="grid gap-2 p-4">
            {actions.map((action) => {
              const Icon = action.icon;
              const body = (
                <>
                  <span className="grid size-10 place-items-center rounded-xl border border-[#00ffcc]/25 bg-[#00ffcc]/10 text-[#00ffcc]">
                    <Icon className="size-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm text-fg">{action.label}</span>
                    <span className="mt-0.5 block text-xs text-muted">{action.detail}</span>
                  </span>
                </>
              );
              if (action.href) {
                return (
                  <li key={action.id}>
                    <a
                      href={action.href}
                      className="flex w-full items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5 text-left transition hover:border-[#00ffcc]/40"
                      onClick={() => setOpen(false)}
                    >
                      {body}
                    </a>
                  </li>
                );
              }
              return (
                <li key={action.id}>
                  <button
                    type="button"
                    className="flex w-full items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5 text-left transition hover:border-[#00ffcc]/40"
                    onClick={action.onClick}
                  >
                    {body}
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}

      <button
        type="button"
        aria-expanded={open}
        aria-controls={open ? titleId : undefined}
        onClick={() => setOpen((v) => !v)}
        className="pointer-events-auto group relative grid size-[4.75rem] place-items-center rounded-full outline-none focus-visible:ring-2 focus-visible:ring-[#00ffcc]"
      >
        <span
          aria-hidden
          className="absolute inset-0 rounded-full border border-[#00ffcc]/45 border-t-transparent shadow-[0_0_24px_rgba(0,255,204,0.35)] motion-safe:animate-[spin_12s_linear_infinite]"
        />
        <span
          aria-hidden
          className="absolute inset-1 rounded-full border border-violet-500/40 border-b-transparent motion-safe:animate-[spin_18s_linear_infinite]"
          style={{ animationDirection: "reverse" }}
        />
        <CompanionOrb persona={persona} size="md" live className="relative z-[1]" />
        <span className="sr-only">
          {open ? "Close" : "Open"} cyber companion {asset.name}
        </span>
        <span
          aria-hidden
          className="absolute -right-0.5 -top-0.5 size-3 rounded-full bg-[#00ffcc] shadow-[0_0_12px_#00ffcc] group-hover:scale-110"
        />
      </button>
    </div>
  );
}

function CompanionOrb({
  persona,
  size,
  live = false,
  className,
}: {
  persona: CompanionPersona;
  size: "xs" | "sm" | "md";
  live?: boolean;
  className?: string;
}) {
  const asset = ASSETS[persona];
  const dim = size === "md" ? "size-16" : size === "sm" ? "size-12" : "size-9";
  return (
    <span
      className={cn(
        "relative inline-grid shrink-0 place-items-center overflow-hidden rounded-full bg-[#0a0f1a]",
        dim,
        "shadow-[0_0_0_1px_rgba(0,255,204,0.45),0_0_18px_rgba(139,92,246,0.35)]",
        className,
      )}
    >
      {live && asset.loop ? (
        <video
          className="absolute inset-0 h-full w-full object-cover"
          src={asset.loop}
          poster={asset.still}
          muted
          playsInline
          loop
          autoPlay
          aria-hidden
        />
      ) : (
        <img src={asset.still} alt="" className="absolute inset-0 h-full w-full object-cover" />
      )}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-full bg-gradient-to-t from-[#030712]/55 via-transparent to-violet-500/10"
      />
    </span>
  );
}

function Telemetry({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "cyan" | "violet";
}) {
  return (
    <div>
      <p className="text-white/40">{label}</p>
      <p className={cn("mt-1 tabular-nums", tone === "cyan" ? "text-[#00ffcc]" : "text-violet-300")}>{value}</p>
    </div>
  );
}

function actionsFor(input: {
  environment: CompanionEnvironment;
  shopSlug: string;
  bookHref?: string;
  onBook?: () => void;
  onFocusArchive?: () => void;
}): Action[] {
  if (input.environment === "storefront") {
    return [
      {
        id: "services",
        label: "Browse services",
        detail: "Jump to the service list on this page",
        icon: Sparkles,
        onClick: () => {
          document.getElementById("services")?.scrollIntoView({ behavior: "smooth", block: "start" });
        },
      },
      {
        id: "book",
        label: "Open booking",
        detail: "Start a booking for this shop",
        icon: CalendarCheck,
        onClick: input.onBook,
        href: input.onBook ? undefined : input.bookHref || `/${input.shopSlug}/book`,
      },
      {
        id: "desk",
        label: "Operator desk",
        detail: "Owners manage the book here",
        icon: Settings2,
        href: `/${input.shopSlug}/admin`,
      },
    ];
  }

  if (input.environment === "hero-studio") {
    return [
      {
        id: "archive",
        label: "Historical archive",
        detail: "Search and live-test every platform MP4",
        icon: Clapperboard,
        onClick: input.onFocusArchive,
      },
      {
        id: "desk",
        label: "Back to desk",
        detail: "Return to mission control",
        icon: Settings2,
        href: `/${input.shopSlug}/admin`,
      },
      {
        id: "preview",
        label: "Customer site",
        detail: "See the live storefront",
        icon: Sparkles,
        href: `/${input.shopSlug}`,
      },
    ];
  }

  return [
    {
      id: "hero-studio",
      label: "Hero studio",
      detail: "Pick background loops from the archive",
      icon: Clapperboard,
      href: `/${input.shopSlug}/admin/hero-studio`,
    },
    {
      id: "storefront",
      label: "Customer site",
      detail: "Preview the public booking page",
      icon: Sparkles,
      href: `/${input.shopSlug}`,
    },
    {
      id: "settings",
      label: "Storefront settings",
      detail: "Brand, film, and autopilot live under Autopilot",
      icon: Settings2,
      onClick: () => {
        const tab = document.querySelector<HTMLButtonElement>('.mission-tabs button');
        // Prefer the Autopilot tab when present (hosts storefront settings).
        const buttons = Array.from(document.querySelectorAll<HTMLButtonElement>(".mission-tabs button"));
        const autopilot = buttons.find((btn) => /autopilot/i.test(btn.textContent || ""));
        (autopilot || tab)?.click();
      },
    },
  ];
}
