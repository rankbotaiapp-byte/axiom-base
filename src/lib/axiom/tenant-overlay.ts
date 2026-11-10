import {
  PLUMBING_DIAGNOSTIC_VIDEO,
  PLUMBING_FIELD_OPS_VIDEO,
  PLUMBING_HERO_VIDEO,
  filmTierFromSrc,
  pinPlumbingTenantFilm,
  type PlumbingFilmTier,
} from "./plumbing-storefront";

export const TENANT_OVERLAY_STORAGE = "axiom:tenant-overlay";
export const TENANT_OVERLAY_CHANNEL = "axiom-tenant-overlay";
export const TENANT_OVERLAY_MESSAGE = "axiom:tenant-overlay";
export const DEFAULT_TENANT_SLUG = "accurate-plumbing";

export type TenantPlan = "trial" | "lifetime";

export type TenantOverlay = {
  slug: string;
  company: string;
  phone: string;
  county: string;
  city: string;
  smsDispatch: boolean;
  capturedThisMonth: number;
  filmTier: PlumbingFilmTier;
  greetEnabled: boolean;
  plan: TenantPlan;
  dispatchPhone: string;
  dispatchPhoneLocked: boolean;
  paidAwaitingDispatch: boolean;
};

export const TENANT_FILM_OPTIONS: ReadonlyArray<{
  id: PlumbingFilmTier;
  title: string;
  body: string;
  src: string;
}> = [
  {
    id: "drain",
    title: "Pipes & wrench intro",
    body: "Pipes, wrench, and the first thing a night caller sees.",
    src: PLUMBING_HERO_VIDEO,
  },
  {
    id: "diagnostic",
    title: "Camera in the line",
    body: "Camera finds the clog, jet clears it, crew rolls.",
    src: PLUMBING_DIAGNOSTIC_VIDEO,
  },
  {
    id: "field",
    title: "Trucks on the job",
    body: "Your vans, your roads, your after-hours readiness.",
    src: PLUMBING_FIELD_OPS_VIDEO,
  },
];

export function defaultTenantOverlay(slug = DEFAULT_TENANT_SLUG): TenantOverlay {
  return {
    slug,
    company: "Accurate Plumbing",
    phone: "(541) 555-0100",
    county: "Jackson & Josephine Counties",
    city: "Medford, OR",
    smsDispatch: true,
    capturedThisMonth: 14,
    filmTier: "drain",
    greetEnabled: false,
    plan: "trial",
    dispatchPhone: "",
    dispatchPhoneLocked: false,
    paidAwaitingDispatch: false,
  };
}

function asPlan(value: unknown): TenantPlan {
  return value === "lifetime" ? "lifetime" : "trial";
}

export function parseTenantOverlay(input: unknown, fallbackSlug = DEFAULT_TENANT_SLUG): TenantOverlay {
  const raw = typeof input === "string" ? safeJson(input) : input;
  const row = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const base = defaultTenantOverlay(fallbackSlug);
  const slug =
    String(row.slug ?? fallbackSlug)
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80) || fallbackSlug;
  const captured = Number(row.capturedThisMonth);
  const film = filmTierFromSrc(
    typeof row.filmSrc === "string" ? row.filmSrc : PLUMBING_TENANT_SRC(row.filmTier as PlumbingFilmTier),
  );
  return {
    slug,
    company: String(row.company ?? base.company).trim().slice(0, 80) || base.company,
    phone: String(row.phone ?? base.phone).trim().slice(0, 32) || base.phone,
    county: String(row.county ?? base.county).trim().slice(0, 80) || base.county,
    city: String(row.city ?? base.city).trim().slice(0, 80) || base.city,
    smsDispatch: row.smsDispatch !== false,
    capturedThisMonth: Number.isFinite(captured) ? Math.max(0, Math.min(9999, Math.round(captured))) : base.capturedThisMonth,
    filmTier: film,
    greetEnabled: row.greetEnabled === true,
    plan: asPlan(row.plan),
    dispatchPhone: String(row.dispatchPhone ?? "").trim().slice(0, 32),
    dispatchPhoneLocked: row.dispatchPhoneLocked === true,
    paidAwaitingDispatch: row.paidAwaitingDispatch === true && row.dispatchPhoneLocked !== true,
  };
}

function PLUMBING_TENANT_SRC(tier: PlumbingFilmTier | undefined): string {
  if (tier === "diagnostic") return PLUMBING_DIAGNOSTIC_VIDEO;
  if (tier === "field") return PLUMBING_FIELD_OPS_VIDEO;
  return PLUMBING_HERO_VIDEO;
}

function safeJson(raw: string): unknown {
  try {
    return JSON.parse(raw) as unknown;
  } catch {
    return null;
  }
}

export function overlayStorageKey(slug: string): string {
  return `${TENANT_OVERLAY_STORAGE}:${slug}`;
}

export function readTenantOverlay(slug: string, seed?: Partial<TenantOverlay>): TenantOverlay {
  const fallback = parseTenantOverlay({ ...defaultTenantOverlay(slug), ...seed, slug }, slug);
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(overlayStorageKey(slug));
    if (!raw) return fallback;
    return parseTenantOverlay({ ...fallback, ...safeJson(raw) }, slug);
  } catch {
    return fallback;
  }
}

export function writeTenantOverlay(overlay: TenantOverlay): TenantOverlay {
  const next = parseTenantOverlay(overlay, overlay.slug);
  try {
    window.localStorage.setItem(overlayStorageKey(next.slug), JSON.stringify(next));
  } catch {
    /* private mode */
  }
  return next;
}

export function publishTenantOverlay(overlay: TenantOverlay) {
  const next = writeTenantOverlay(overlay);
  const payload = { type: TENANT_OVERLAY_MESSAGE, overlay: next };
  try {
    new BroadcastChannel(TENANT_OVERLAY_CHANNEL).postMessage(payload);
  } catch {
    /* unsupported */
  }
  window.dispatchEvent(new CustomEvent(TENANT_OVERLAY_MESSAGE, { detail: next }));
  return next;
}

export function subscribeTenantOverlay(slug: string, onChange: (overlay: TenantOverlay) => void): () => void {
  const apply = (candidate: unknown) => {
    const next = parseTenantOverlay(candidate, slug);
    if (next.slug !== slug) return;
    onChange(next);
  };
  const onStorage = (event: StorageEvent) => {
    if (event.key !== overlayStorageKey(slug) || !event.newValue) return;
    apply(event.newValue);
  };
  const onCustom = (event: Event) => apply((event as CustomEvent).detail);
  let channel: BroadcastChannel | null = null;
  try {
    channel = new BroadcastChannel(TENANT_OVERLAY_CHANNEL);
    channel.onmessage = (event: MessageEvent) => {
      if (event.data?.type === TENANT_OVERLAY_MESSAGE) apply(event.data.overlay);
    };
  } catch {
    channel = null;
  }
  window.addEventListener("storage", onStorage);
  window.addEventListener(TENANT_OVERLAY_MESSAGE, onCustom);
  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener(TENANT_OVERLAY_MESSAGE, onCustom);
    channel?.close();
  };
}

export function bumpCapturedCalls(slug: string): TenantOverlay {
  const current = readTenantOverlay(slug);
  return publishTenantOverlay({ ...current, capturedThisMonth: current.capturedThisMonth + 1 });
}

export function overlayFilmSrc(overlay: TenantOverlay): string {
  return pinPlumbingTenantFilm(PLUMBING_TENANT_SRC(overlay.filmTier));
}

export function capturedCopy(count: number): string {
  const n = Math.max(0, Math.round(count));
  return `${n} emergency call${n === 1 ? "" : "s"} captured automatically this month while your crew was in the field.`;
}
