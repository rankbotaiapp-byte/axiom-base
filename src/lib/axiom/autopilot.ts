import { isEmailReady } from "./funnel.ts";

export type AutopilotMode = "simulation" | "live";

export type AutopilotLead = {
  id: string;
  leadSlug: string;
  businessName: string;
  city: string;
  county: string;
  tradeType: string;
  email: string;
  phone: string;
};

export type AutopilotProposal = {
  mode: AutopilotMode;
  totalLeads: number;
  dailySent: number;
  remainingQueue: number;
  county: string;
  tradeType: string;
  tradeLabel: string;
  emailCount: number;
  smsCount: number;
  summary: string;
};

/** A listed phone can take the SMS side of a simulated batch. */
export function hasListedPhone(phone: string): boolean {
  return phone.replace(/\D/g, "").length >= 10;
}

/**
 * Email-only and SMS-only leads stay on their channel.
 * Leads with both go to whichever side is smaller, so the batch stays balanced.
 */
export function balanceChannels<T extends { email: string; phone: string }>(leads: readonly T[]): {
  email: T[];
  sms: T[];
} {
  const email: T[] = [];
  const sms: T[] = [];
  const both: T[] = [];
  for (const lead of leads) {
    const emailReady = isEmailReady(lead.email);
    const smsReady = hasListedPhone(lead.phone);
    if (emailReady && smsReady) both.push(lead);
    else if (emailReady) email.push(lead);
    else if (smsReady) sms.push(lead);
  }
  for (const lead of both) {
    if (email.length <= sms.length) email.push(lead);
    else sms.push(lead);
  }
  return { email, sms };
}

export function formulateProposal(input: {
  mode: AutopilotMode;
  totalLeads: number;
  dailySent: number;
  remainingQueue: number;
  county: string;
  tradeLabel: string;
  emailCount: number;
  smsCount: number;
}): string {
  const hold =
    input.mode === "live"
      ? "Live mode is on. Approving places the batch on the queue."
      : "Simulation is on. Approving places the batch on the queue and does not send email or SMS.";
  if (!input.county || input.emailCount + input.smsCount === 0) {
    return `No contactable unclaimed leads are waiting in the local counties. ${input.totalLeads.toLocaleString("en-US")} leads are on file, ${input.dailySent.toLocaleString("en-US")} went out today, and ${input.remainingQueue.toLocaleString("en-US")} remain unclaimed. ${hold}`;
  }
  return `${input.county} ${input.tradeLabel}: ${input.emailCount.toLocaleString("en-US")} email and ${input.smsCount.toLocaleString("en-US")} SMS. ${input.totalLeads.toLocaleString("en-US")} leads are on file, ${input.dailySent.toLocaleString("en-US")} went out today, and ${input.remainingQueue.toLocaleString("en-US")} remain unclaimed. ${hold}`;
}

/** Wildlife, welding, guided river fishing, and tattoo studios are the seeded niches. */
export type StorefrontAmbience = "forest" | "river" | "workshop";
export type StorefrontSource = "supabase" | "json" | "shop";

export type ServiceShard = {
  id: string;
  label: string;
  meta: string;
  blurb: string;
  priceCents: number;
  videoUrl: string;
};

export type ClientStorefront = {
  shopSlug: string;
  name: string;
  tagline: string;
  niche: string;
  accent: string;
  heroVideoUrl: string;
  address: string;
  ambience: StorefrontAmbience;
  shards: ServiceShard[];
  telemetry: string[];
  source: StorefrontSource;
};

const HEX = /^#[0-9a-fA-F]{6}$/;
const FALLBACK_ACCENT = "#2EE6D6";
const FALLBACK_FILM = "/media/orb-explosion-hero-animation.mp4";

export function sanitizeAccent(value: string, fallback = FALLBACK_ACCENT): string {
  const next = value.trim();
  return HEX.test(next) ? next : fallback;
}

export function ambienceFor(niche: string, slug = ""): StorefrontAmbience {
  const hay = `${niche} ${slug}`.toLowerCase();
  if (/river|fish|raft|guide/.test(hay)) return "river";
  if (/wild|hunt|leopard|forest|owl/.test(hay)) return "forest";
  return "workshop";
}

function cleanVideo(value: unknown, fallback = FALLBACK_FILM): string {
  if (typeof value !== "string") return fallback;
  const url = value.trim();
  if (url.startsWith("/") || url.startsWith("https://") || url.startsWith("http://")) return url.slice(0, 400);
  return fallback;
}

function moneyCents(row: Record<string, unknown>): number {
  const cents = row.price_cents ?? row.priceCents;
  if (typeof cents === "number" && Number.isFinite(cents)) return Math.max(0, Math.round(cents));
  const price = row.price;
  if (typeof price === "number" && Number.isFinite(price)) return Math.max(0, Math.round(price * 100));
  return 0;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : null;
}

function shardList(value: unknown, film: string): ServiceShard[] {
  let raw = value;
  if (typeof raw === "string") {
    try {
      raw = JSON.parse(raw) as unknown;
    } catch {
      return [];
    }
  }
  if (!Array.isArray(raw)) return [];
  const shards: ServiceShard[] = [];
  for (const item of raw) {
    const row = asRecord(item);
    if (!row) continue;
    const label = String(row.label ?? row.name ?? "").trim().slice(0, 80);
    if (label.length < 2) continue;
    const id = String(row.id ?? label)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")
      .slice(0, 40);
    shards.push({
      id: id || `shard-${shards.length + 1}`,
      label,
      meta: String(row.meta ?? row.group ?? "Service").trim().slice(0, 40) || "Service",
      blurb: String(row.blurb ?? row.description ?? "").trim().slice(0, 280),
      priceCents: moneyCents(row),
      videoUrl: cleanVideo(row.video_url ?? row.videoUrl ?? row.clip_url, film),
    });
  }
  return shards.slice(0, 8);
}

function telemetryFor(name: string, niche: string, film: string): string[] {
  const file = film.split("/").pop() || "loop";
  return ["GPS ACTIVE", "LIVE TELEMETRY", `${name} · ${niche} · ${file}`].map((line) => line.slice(0, 96));
}

export function parseClientStorefront(row: unknown, source: StorefrontSource): ClientStorefront | null {
  const record = asRecord(row);
  if (!record) return null;
  const shopSlug = String(record.shop_slug ?? record.shopSlug ?? record.slug ?? "")
    .trim()
    .toLowerCase();
  const name = String(record.business_name ?? record.name ?? "").trim().slice(0, 80);
  if (!shopSlug || name.length < 2) return null;
  const niche = String(record.niche ?? record.trade ?? "trade").trim().slice(0, 80) || "trade";
  const heroVideoUrl = cleanVideo(record.hero_video_url ?? record.heroVideoUrl ?? record.background_video_url);
  const shards = shardList(record.service_shards ?? record.shards ?? record.services, heroVideoUrl);
  return {
    shopSlug,
    name,
    tagline: String(record.tagline ?? "").trim().slice(0, 180),
    niche,
    accent: sanitizeAccent(String(record.accent ?? record.accent_color ?? record.accentColor ?? "")),
    heroVideoUrl,
    address: String(record.address ?? record.city ?? "").trim().slice(0, 160),
    ambience: ambienceFor(niche, shopSlug),
    shards,
    telemetry: telemetryFor(name, niche, heroVideoUrl),
    source,
  };
}

const LOCAL_STOREFRONTS: readonly ClientStorefront[] = [
  {
    shopSlug: "rogue-river-outfitters",
    name: "Rogue River Outfitters",
    tagline: "Drift boats, steelhead, and a jet boat that knows the canyon.",
    niche: "guided river fishing",
    accent: "#2EE6D6",
    heroVideoUrl: "/media/trout-fishin-hero-animation.mp4",
    address: "Grants Pass, Oregon",
    ambience: "river",
    source: "json",
    telemetry: telemetryFor("Rogue River Outfitters", "guided river fishing", "/media/trout-fishin-hero-animation.mp4"),
    shards: [
      {
        id: "drift",
        label: "Drift boat",
        meta: "Full day",
        blurb: "Steelhead and trout with a guide, the boat, and lunch on the gravel.",
        priceCents: 39500,
        videoUrl: "/media/guide-service-hero-animation.mp4",
      },
      {
        id: "raft",
        label: "Raft run",
        meta: "Half day",
        blurb: "Class III water, gear included, put-in at dawn.",
        priceCents: 16500,
        videoUrl: "/media/trout-fishin-hero-animation.mp4",
      },
      {
        id: "canyon",
        label: "Canyon jet",
        meta: "2 hrs",
        blurb: "Wildlife and the canyon walls from the bow.",
        priceCents: 7000,
        videoUrl: "/media/guide-service-hero-animation.mp4",
      },
    ],
  },
  {
    shopSlug: "high-desert-wildlife",
    name: "High Desert Wildlife Co.",
    tagline: "Leopard country on film, and a night hunt when the season opens.",
    niche: "wildlife",
    accent: "#7EC8E3",
    heroVideoUrl: "/media/leopard-hero-animation.mp4",
    address: "Ashland, Oregon",
    ambience: "forest",
    source: "json",
    telemetry: telemetryFor("High Desert Wildlife Co.", "wildlife", "/media/leopard-hero-animation.mp4"),
    shards: [
      {
        id: "leopard",
        label: "Leopard watch",
        meta: "Dawn",
        blurb: "A still hide and a long lens. The cat comes to the water.",
        priceCents: 24000,
        videoUrl: "/media/leopard-hero-animation.mp4",
      },
      {
        id: "grizzly",
        label: "Grizzly country",
        meta: "3 days",
        blurb: "Backcountry camp, glassing ridges, and a guide who knows the draws.",
        priceCents: 89000,
        videoUrl: "/media/owl-attack-hero-animation.mp4",
      },
      {
        id: "owl",
        label: "Night flight",
        meta: "Evening",
        blurb: "Owls over the timber. Quiet boots, no spotlight.",
        priceCents: 18000,
        videoUrl: "/media/owl-attack-hero-animation.mp4",
      },
    ],
  },
  {
    shopSlug: "cascade-weld",
    name: "Cascade Weld",
    tagline: "Mobile rigs, shop welds, and railings that stay square.",
    niche: "welding",
    accent: "#E7B48A",
    heroVideoUrl: "/media/electrician-hero-animation.mp4",
    address: "Medford, Oregon",
    ambience: "workshop",
    source: "json",
    telemetry: telemetryFor("Cascade Weld", "welding", "/media/electrician-hero-animation.mp4"),
    shards: [
      {
        id: "mobile",
        label: "Mobile weld",
        meta: "Callout",
        blurb: "The truck comes to the gate. Cracks, hinges, and a trailer tongue.",
        priceCents: 18500,
        videoUrl: "/media/electrician-hero-animation.mp4",
      },
      {
        id: "rail",
        label: "Shop railing",
        meta: "Bay",
        blurb: "Stairs and decks, measured on site and finished in the bay.",
        priceCents: 64000,
        videoUrl: "/media/electrician-hero-animation.mp4",
      },
      {
        id: "repair",
        label: "Frame repair",
        meta: "Same week",
        blurb: "A bracket, a mount, a piece of equipment that has to go back to work.",
        priceCents: 24000,
        videoUrl: "/media/electrician-hero-animation.mp4",
      },
    ],
  },
  {
    shopSlug: "meridian-ink",
    name: "Meridian Ink",
    tagline: "Custom work, flash on the wall, and cover-ups that read clean.",
    niche: "tattoo studio",
    accent: "#FF4FD8",
    heroVideoUrl: "/media/leopard-hero-animation.mp4",
    address: "Ashland, Oregon",
    ambience: "workshop",
    source: "json",
    telemetry: telemetryFor("Meridian Ink", "tattoo studio", "/media/leopard-hero-animation.mp4"),
    shards: [
      {
        id: "custom",
        label: "Custom piece",
        meta: "Session",
        blurb: "A drawing first, then the needle. Deposit holds the chair.",
        priceCents: 20000,
        videoUrl: "/media/leopard-hero-animation.mp4",
      },
      {
        id: "flash",
        label: "Flash",
        meta: "Walk-in",
        blurb: "The sheet on the wall. Small work, same day when the book allows.",
        priceCents: 8000,
        videoUrl: "/media/leopard-hero-animation.mp4",
      },
      {
        id: "cover",
        label: "Cover-up",
        meta: "Consult",
        blurb: "We look at the old piece in daylight before anyone draws over it.",
        priceCents: 15000,
        videoUrl: "/media/silver-orb-hero-animation.mp4",
      },
    ],
  },
  {
    shopSlug: "night-circuit",
    name: "Night Circuit",
    tagline: "Cyberpunk paint, night diagnostics, and a bay that stays open late.",
    niche: "cyberpunk auto",
    accent: "#7EC8E3",
    heroVideoUrl: "/media/auto-hero-animation.mp4",
    address: "Medford, Oregon",
    ambience: "workshop",
    source: "json",
    telemetry: telemetryFor("Night Circuit", "cyberpunk auto", "/media/auto-hero-animation.mp4"),
    shards: [
      {
        id: "diag",
        label: "Night diagnostic",
        meta: "Bay",
        blurb: "Codes, lights, and a road test after dark.",
        priceCents: 18000,
        videoUrl: "/media/auto-hero-animation.mp4",
      },
    ],
  },
  {
    shopSlug: "ashland-barber",
    name: "Ashland Barber Co.",
    tagline: "A straight cut, a hot towel, and the chair by the front window.",
    niche: "barber",
    accent: "#E7B48A",
    heroVideoUrl: "/media/leopard-hero-animation.mp4",
    address: "Ashland, Oregon",
    ambience: "workshop",
    source: "json",
    telemetry: telemetryFor("Ashland Barber Co.", "barber", "/media/leopard-hero-animation.mp4"),
    shards: [
      {
        id: "cut",
        label: "Cut",
        meta: "Chair",
        blurb: "Scissor cut and a clean neckline.",
        priceCents: 4500,
        videoUrl: "/media/leopard-hero-animation.mp4",
      },
    ],
  },
  {
    shopSlug: "rogue-contractor",
    name: "Rogue Contractor",
    tagline: "Foundations, framing, and a crew that shows up with the lumber.",
    niche: "contractor",
    accent: "#E7B48A",
    heroVideoUrl: "/media/auto-hero-animation.mp4",
    address: "Grants Pass, Oregon",
    ambience: "workshop",
    source: "json",
    telemetry: telemetryFor("Rogue Contractor", "contractor", "/media/auto-hero-animation.mp4"),
    shards: [
      {
        id: "frame",
        label: "Framing",
        meta: "Job",
        blurb: "Walls, openings, and a level line.",
        priceCents: 120000,
        videoUrl: "/media/auto-hero-animation.mp4",
      },
    ],
  },
];

export function localStorefront(shopSlug: string): ClientStorefront | null {
  const slug = shopSlug.trim().toLowerCase();
  const found = LOCAL_STOREFRONTS.find((row) => row.shopSlug === slug);
  if (!found) return null;
  return {
    ...found,
    shards: found.shards.map((shard) => ({ ...shard })),
    telemetry: [...found.telemetry],
  };
}

function envValue(name: string): string {
  const meta = import.meta as { env?: Record<string, string | undefined> };
  const fromVite = meta.env?.[name]?.trim();
  if (fromVite) return fromVite;
  if (typeof process === "undefined" || !process.env) return "";
  const bag = process.env as Record<string, string | undefined>;
  return bag[name]?.trim() ?? "";
}

function supabaseEnv(): { url: string; key: string } {
  const url = (
    envValue("VITE_SUPABASE_URL") ||
    envValue("NEXT_PUBLIC_SUPABASE_URL") ||
    envValue("SUPABASE_URL")
  ).replace(/\/$/, "");
  const key =
    envValue("VITE_SUPABASE_ANON_KEY") ||
    envValue("NEXT_PUBLIC_SUPABASE_ANON_KEY") ||
    envValue("SUPABASE_ANON_KEY");
  return { url, key };
}

/** `client_storefronts` by `shop_slug`. Missing env or a failed request falls through to the local dataset. */
export async function fetchSupabaseStorefront(shopSlug: string): Promise<ClientStorefront | null> {
  const { url, key } = supabaseEnv();
  const slug = shopSlug.trim().toLowerCase();
  if (!url || !key || !slug) return null;
  const endpoint = `${url}/rest/v1/client_storefronts?shop_slug=eq.${encodeURIComponent(slug)}&select=*&limit=1`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 4000);
  try {
    const response = await fetch(endpoint, {
      signal: controller.signal,
      headers: {
        apikey: key,
        authorization: `Bearer ${key}`,
        accept: "application/json",
      },
    });
    if (!response.ok) return null;
    const rows = (await response.json()) as unknown;
    const first = Array.isArray(rows) ? rows[0] : null;
    return parseClientStorefront(first, "supabase");
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

export async function fetchClientStorefront(shopSlug: string): Promise<ClientStorefront | null> {
  const remote = await fetchSupabaseStorefront(shopSlug);
  if (remote) return remote;
  return localStorefront(shopSlug);
}

export function storefrontFromFields(input: {
  shopSlug: string;
  name: string;
  tagline: string;
  niche: string;
  accent: string;
  heroVideoUrl: string;
  address?: string;
  services: { id: string; name: string; description: string; priceCents: number; group?: string; videoUrl?: string }[];
}): ClientStorefront {
  const heroVideoUrl = cleanVideo(input.heroVideoUrl);
  const niche = input.niche.trim().slice(0, 80) || "trade";
  const name = input.name.trim().slice(0, 80) || input.shopSlug;
  const shards = input.services.slice(0, 8).map((service) => ({
    id: service.id,
    label: service.name,
    meta: service.group?.trim() || "Service",
    blurb: service.description,
    priceCents: Math.max(0, Math.round(service.priceCents)),
    videoUrl: cleanVideo(service.videoUrl, heroVideoUrl),
  }));
  return {
    shopSlug: input.shopSlug.trim().toLowerCase(),
    name,
    tagline: input.tagline.trim().slice(0, 180),
    niche,
    accent: sanitizeAccent(input.accent),
    heroVideoUrl,
    address: (input.address ?? "").trim().slice(0, 160),
    ambience: ambienceFor(niche, input.shopSlug),
    shards,
    telemetry: telemetryFor(name, niche, heroVideoUrl),
    source: "shop",
  };
}
