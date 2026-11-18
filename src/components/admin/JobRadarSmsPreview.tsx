"use client";

import { useEffect, useId, useMemo, useState } from "react";
import { MessageSquare, Radio } from "lucide-react";
import { HudGlassPanel, HudSectionTitle } from "@/components/studio/ObsidianHudChrome";
import { cn } from "@/lib/utils";

type RadarEvent = {
  id: string;
  at: string;
  title: string;
  body: string;
  kind: "book" | "orb";
};

function maskPhone(e164: string): string {
  const digits = e164.replace(/\D/g, "");
  if (digits.length < 10) return "Your cell · add in settings";
  const tail = digits.slice(-4);
  return `(•••) •••-${tail}`;
}

export function JobRadarSmsPreview({
  shopName,
  shopSlug,
  city,
  ownerPhone,
  className,
}: {
  shopName: string;
  shopSlug: string;
  city?: string;
  ownerPhone?: string;
  className?: string;
}) {
  const titleId = useId();
  const [activeIndex, setActiveIndex] = useState(0);
  const place = city?.trim() || "your area";

  const events = useMemo<RadarEvent[]>(
    () => [
      {
        id: "orb",
        at: "Just now",
        title: "AI orb conversation",
        kind: "orb",
        body: `AXIOM: ${shopName} — homeowner in ${place} asked for emergency dispatch via orb. Tap to join video: https://axiom.local/${shopSlug}/admin`,
      },
      {
        id: "book",
        at: "12s ago",
        title: "Booking confirmed",
        kind: "book",
        body: `JOB RADAR · ${shopName}: New booking — Plumbing repair, ${place}. Window: under 45 min. Reply 1 to accept.`,
      },
      {
        id: "quote",
        at: "2m ago",
        title: "Quote locked",
        kind: "book",
        body: `AXIOM: Instant quote $149–$389 accepted. Customer waiting on video. Open desk: /${shopSlug}/admin`,
      },
    ],
    [place, shopName, shopSlug],
  );

  useEffect(() => {
    const id = window.setInterval(() => {
      setActiveIndex((value) => (value + 1) % events.length);
    }, 4200);
    return () => window.clearInterval(id);
  }, [events.length]);

  const active = events[activeIndex]!;

  return (
    <HudGlassPanel className={cn("space-y-4", className)}>
      <HudSectionTitle
        kicker="Job radar · SMS loop"
        title="Owner dispatch preview"
        subtitle="What hits the contractor's personal phone the second a homeowner books or talks to the orb."
      />

      <div className="grid gap-4 lg:grid-cols-[minmax(200px,240px)_1fr] lg:items-start">
        <div
          className="mx-auto w-full max-w-[220px] rounded-[1.75rem] border border-white/15 bg-[#050507] p-2 shadow-[0_24px_48px_rgba(0,0,0,0.65)]"
          aria-hidden
        >
          <div className="rounded-[1.35rem] border border-white/10 bg-white/[0.03] px-3 py-4">
            <p className="text-center font-mono text-[9px] uppercase tracking-[0.14em] text-white/40">Owner device</p>
            <p className="mt-2 text-center text-xs font-semibold text-white">{maskPhone(ownerPhone || "")}</p>
            <div className="mt-4 space-y-2">
              <div className="rounded-2xl rounded-bl-md bg-emerald-500/15 px-2.5 py-2 text-[10px] leading-snug text-emerald-100">
                {active.body}
              </div>
              <p className="text-center font-mono text-[8px] uppercase tracking-[0.12em] text-white/35">{active.at}</p>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--brand-primary)]">
            <Radio className="h-3.5 w-3.5 animate-pulse text-emerald-400" />
            Live simulation · Twilio armed
          </div>
          <ul className="space-y-2" aria-labelledby={titleId}>
            {events.map((row, index) => (
              <li
                key={row.id}
                className={cn(
                  "rounded-xl border px-3 py-2.5 transition",
                  index === activeIndex
                    ? "border-[var(--brand-primary)]/45 bg-white/[0.04]"
                    : "border-white/10 bg-transparent opacity-70",
                )}
              >
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-3.5 w-3.5 text-[var(--brand-glow)]" />
                  <p className="font-mono text-[9px] uppercase tracking-[0.12em] text-white/55">{row.title}</p>
                </div>
                <p className="mt-1 text-xs leading-relaxed text-white/75">{row.body}</p>
              </li>
            ))}
          </ul>
          <p className="text-[11px] text-white/45">
            Production path: booking hold + orb intent routes through Twilio to{" "}
            <span className="text-[var(--brand-glow)]">{maskPhone(ownerPhone || "")}</span> with no manual copy-paste.
          </p>
        </div>
      </div>
    </HudGlassPanel>
  );
}