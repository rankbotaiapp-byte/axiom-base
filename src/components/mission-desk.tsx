import { useMemo, useState, type ReactNode } from "react";
import { CATALOG, EXTRA_HERO_LOOPS, catalogFilmPath, catalogFilmUrl, isCatalogNiche } from "@/config/catalog";
import { TelemetryLog } from "@/components/telemetry-log";
import { writeHeroDraft } from "@/lib/axiom/hero-studio-state";
import { isCatalogHeroUrl } from "@/lib/axiom/hero-films";
import { updateShopBrand } from "@/lib/axiom/server";
import type { Appointment, Shop, ShopNotice } from "@/lib/axiom/types";

export type MissionTab = "overview" | "services" | "hero" | "autopilot";

export const MISSION_TABS: { id: MissionTab; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "services", label: "Services & Pricing" },
  { id: "hero", label: "Hero Studio & Branding" },
  { id: "autopilot", label: "Autopilot & Logs" },
];

type Switches = {
  sms: boolean;
  reviews: boolean;
  social: boolean;
};

const SWITCHES: { key: keyof Switches; label: string; detail: string }[] = [
  { key: "sms", label: "SMS reminders", detail: "Text the guest the morning of the job." },
  { key: "reviews", label: "Review requests", detail: "Ask for a review after the job is marked done." },
  { key: "social", label: "Social syndication", detail: "Queue the day's finished job for the shop page." },
];

function switchKey(slug: string) {
  return `axiom-desk-autopilot:${slug}`;
}

function readSwitches(slug: string): Switches {
  const empty = { sms: false, reviews: false, social: false };
  if (typeof localStorage === "undefined") return empty;
  try {
    const raw = JSON.parse(localStorage.getItem(switchKey(slug)) || "") as Partial<Switches>;
    return {
      sms: raw.sms === true,
      reviews: raw.reviews === true,
      social: raw.social === true,
    };
  } catch {
    return empty;
  }
}

function writeSwitches(slug: string, next: Switches) {
  localStorage.setItem(switchKey(slug), JSON.stringify(next));
}

function whenLabel(iso: string) {
  const when = new Date(iso);
  if (Number.isNaN(when.getTime())) return "";
  return when.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function bookingLine(row: Appointment) {
  const when = whenLabel(row.startsAt);
  const who = `${row.customerName} · ${row.serviceName}`;
  if (row.status === "confirmed" || row.paymentStatus === "paid") return `Confirmed ${who}${when ? ` · ${when}` : ""}`;
  if (row.status === "cancelled") return `Cancelled ${who}`;
  if (row.status === "completed") return `Finished ${who}${when ? ` · ${when}` : ""}`;
  return `Requested ${who}${when ? ` · ${when}` : ""}`;
}

function noticeLine(row: ShopNotice) {
  const subject = row.subject.trim() || row.body.trim();
  if (row.kind === "booking_confirmed" || row.kind === "booking_paid") return `Confirmed · ${subject}`;
  if (row.kind === "booking_request") return `Requested · ${subject}`;
  return subject;
}

/** Human lines for the desk log. Newest notes first, then the book. */
export function activityFeed(input: {
  appointments: readonly Appointment[];
  notices: readonly ShopNotice[];
  notes: readonly string[];
}): string[] {
  const booked = [...input.appointments]
    .sort((a, b) => Date.parse(b.startsAt) - Date.parse(a.startsAt))
    .slice(0, 8)
    .map(bookingLine);
  const noted = input.notices.slice(0, 6).map(noticeLine).filter(Boolean);
  return [...input.notes, ...booked, ...noted].filter(Boolean).slice(0, 12);
}

export function MissionFrame({ children }: { children: ReactNode }) {
  return (
    <div className="mission-frame">
      <span className="mission-bracket mission-bracket-nw" aria-hidden />
      <span className="mission-bracket mission-bracket-ne" aria-hidden />
      <span className="mission-bracket mission-bracket-sw" aria-hidden />
      <span className="mission-bracket mission-bracket-se" aria-hidden />
      {children}
    </div>
  );
}

export function CatalogFilmDesk({
  shop,
  readonly,
  onReload,
}: {
  shop: Shop;
  readonly: boolean;
  onReload: () => void;
}) {
  const nicheFilm = isCatalogNiche(shop.niche) ? catalogFilmUrl(shop.niche) : catalogFilmUrl("contractor");
  const pinned = isCatalogHeroUrl(shop.heroVideoUrl) ? shop.heroVideoUrl!.split("?")[0]! : nicheFilm;
  const [selected, setSelected] = useState(pinned);
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const loops = useMemo(
    () => [
      ...CATALOG.map((row) => ({
        id: row.id,
        label: row.label,
        blurb: row.blurb,
        url: catalogFilmUrl(row.id),
      })),
      ...EXTRA_HERO_LOOPS.map((row) => ({
        id: row.id,
        label: row.label,
        blurb: row.blurb,
        url: catalogFilmPath(row.file),
      })),
    ],
    [],
  );
  const active = loops.find((row) => row.url === selected);

  async function choose(url: string) {
    setSelected(url);
    const label = loops.find((row) => row.url === url)?.label ?? "Loop";
    if (readonly && !shop.isShowcase) {
      setStatus(`${label} preview. A shop you own can pin it.`);
      return;
    }
    setBusy(true);
    setStatus("");
    try {
      await updateShopBrand({ data: { slug: shop.slug, heroFilm: url } });
      writeHeroDraft(shop.slug, { hero_video_url: url, tagline: shop.tagline });
      setStatus(`${label} is the live loop.`);
      onReload();
    } catch {
      try {
        writeHeroDraft(shop.slug, { hero_video_url: url, tagline: shop.tagline });
        setStatus(`${label} is on this desk. The hosted book did not take the pin.`);
      } catch {
        setStatus("That loop did not save.");
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <figure className="mission-stage">
        <video key={selected} src={selected} autoPlay muted loop playsInline />
        <figcaption>
          <p className="font-mono text-xs uppercase tracking-widest text-accent">{active?.label ?? "Loop"}</p>
          <p className="mt-1 text-sm text-muted">{active?.blurb}</p>
          {status ? <p className="mt-2 text-sm text-fg">{status}</p> : null}
        </figcaption>
      </figure>
      <div className="mission-film-grid" role="listbox" aria-label="Hero loops">
        {loops.map((row) => {
          const url = row.url;
          const on = url === selected;
          return (
            <button
              key={row.id}
              type="button"
              role="option"
              aria-selected={on}
              disabled={busy}
              className={on ? "mission-film is-on" : "mission-film"}
              onClick={() => void choose(url)}
            >
              <video src={url} muted playsInline preload="metadata" />
              <span>{row.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function AutopilotDesk({
  slug,
  appointments,
  notices,
  disabled,
}: {
  slug: string;
  appointments: readonly Appointment[];
  notices: readonly ShopNotice[];
  disabled: boolean;
}) {
  const [switches, setSwitches] = useState<Switches>(() => readSwitches(slug));
  const [notes, setNotes] = useState<string[]>([]);
  const lines = activityFeed({ appointments, notices, notes });

  function toggle(key: keyof Switches) {
    if (disabled) return;
    const next = { ...switches, [key]: !switches[key] };
    setSwitches(next);
    writeSwitches(slug, next);
    const label = SWITCHES.find((row) => row.key === key)?.label ?? "Autopilot";
    setNotes((current) => [`${next[key] ? "Armed" : "Paused"} · ${label}`, ...current].slice(0, 4));
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
      <div className="grid gap-2">
        {SWITCHES.map((row) => {
          const on = switches[row.key];
          return (
            <button
              key={row.key}
              type="button"
              role="switch"
              aria-checked={on}
              disabled={disabled}
              className={on ? "mission-switch is-on" : "mission-switch"}
              onClick={() => toggle(row.key)}
            >
              <span>
                <span className="block text-sm text-fg">{row.label}</span>
                <span className="mt-1 block text-sm text-muted">{row.detail}</span>
              </span>
              <span className="mission-knob" aria-hidden />
            </button>
          );
        })}
        <p className="text-sm text-muted">These stay on this desk. Nothing is sent until the shop is live.</p>
      </div>
      <TelemetryLog variant="desk" dataset={lines} />
    </div>
  );
}
