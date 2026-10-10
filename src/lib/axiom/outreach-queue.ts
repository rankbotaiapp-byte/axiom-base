export type OutreachMode = "simulation" | "live";

export const DEFAULT_TRICKLE_SECONDS = 45;
export const DEFAULT_CHUNK_SIZE = 5;

/** Anything other than an explicit live value stays in simulation. */
export function parseOutreachMode(value: string | undefined | null): OutreachMode {
  return value?.trim().toLowerCase() === "live" ? "live" : "simulation";
}

/** Configurable gap between chunks. Values outside 30–60 seconds clamp into that range. */
export function parseTrickleSeconds(value: string | undefined | null): number {
  const raw = String(value ?? "").trim();
  if (!raw) return DEFAULT_TRICKLE_SECONDS;
  const n = Number(raw);
  if (!Number.isFinite(n)) return DEFAULT_TRICKLE_SECONDS;
  return Math.min(60, Math.max(30, Math.round(n)));
}

/** Leads released together. Defaults to 5, and stays between 1 and 20. */
export function parseChunkSize(value: string | undefined | null): number {
  const raw = String(value ?? "").trim();
  if (!raw) return DEFAULT_CHUNK_SIZE;
  const n = Number(raw);
  if (!Number.isFinite(n)) return DEFAULT_CHUNK_SIZE;
  return Math.min(20, Math.max(1, Math.round(n)));
}

export type TrickleChunk<T> = {
  index: number;
  items: T[];
  scheduledAt: string;
};

/**
 * Chunk 0 is due at `start`. Each later chunk waits `intervalSeconds`.
 * An empty list produces no chunks, so a launch with nobody to contact queues nothing.
 */
export function planTrickleChunks<T>(
  items: T[],
  options: { chunkSize: number; intervalSeconds: number; start: Date },
): TrickleChunk<T>[] {
  const size = Math.max(1, Math.floor(options.chunkSize));
  const intervalMs = Math.max(1, Math.floor(options.intervalSeconds)) * 1000;
  const chunks: TrickleChunk<T>[] = [];
  for (let offset = 0; offset < items.length; offset += size) {
    const index = chunks.length;
    chunks.push({
      index,
      items: items.slice(offset, offset + size),
      scheduledAt: new Date(options.start.getTime() + index * intervalMs).toISOString(),
    });
  }
  return chunks;
}

/** A later chunk may leave the queue only after the previous release has aged a full interval. */
export function trickleMayRelease(lastSentAt: string | null, now: Date, intervalSeconds: number): boolean {
  if (!lastSentAt) return true;
  const then = new Date(lastSentAt).getTime();
  if (!Number.isFinite(then)) return true;
  return now.getTime() - then >= intervalSeconds * 1000;
}

/** Simulation never calls a provider. Live is the only mode allowed to. */
export function outreachMayCallProviders(mode: OutreachMode): boolean {
  return mode === "live";
}

/** Home-region clock. Vercel runs in UTC, so wall-clock hours are Pacific. */
export const OUTREACH_TIME_ZONE = "America/Los_Angeles";

export type SendTiming = "immediate" | "smart";
export type TimingProfile = "trades" | "salon" | "general";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

/** Start is inclusive. End is exclusive, so 7:00 PM is the close of the weekday window. */
type MinuteRange = { start: number; end: number };

type SendClock = {
  days: ReadonlySet<number>;
  ranges: MinuteRange[];
};

const GUARDRAIL: SendClock = {
  days: new Set([1, 2, 3, 4]),
  ranges: [{ start: 8 * 60, end: 19 * 60 }],
};

const PROFILE_CLOCKS: Record<TimingProfile, SendClock> = {
  trades: {
    days: new Set([1, 2, 3, 4]),
    ranges: [
      { start: 7 * 60, end: 8 * 60 + 30 },
      { start: 16 * 60 + 30, end: 18 * 60 },
    ],
  },
  salon: {
    days: new Set([1, 2]),
    ranges: [{ start: 8 * 60, end: 11 * 60 }],
  },
  general: {
    days: new Set([1, 2, 3, 4]),
    ranges: [{ start: 10 * 60, end: 14 * 60 }],
  },
};

const TRADE_PROFILES = new Set([
  "contractor",
  "clean",
  "field",
  "hvac",
  "plumbing",
  "electrical",
  "roofing",
  "landscaping",
  "air-conditioning",
]);

const SALON_PROFILES = new Set(["salon", "beauty"]);

export function parseSendTiming(value: unknown): SendTiming {
  return value === "smart" ? "smart" : "immediate";
}

export function parseTimingProfile(value: unknown): TimingProfile {
  return value === "trades" || value === "salon" || value === "general" ? value : "general";
}

/** HVAC, plumbing, contractors, and the other home-service keys share the early/late window. */
export function timingProfileFor(tradeType: string): TimingProfile {
  const key = tradeType.trim().toLowerCase();
  if (SALON_PROFILES.has(key)) return "salon";
  if (TRADE_PROFILES.has(key)) return "trades";
  if (key.includes("hvac") || key.includes("plumb") || key.includes("air-condition")) return "trades";
  return "general";
}

export function sendWindowBlurb(timing: SendTiming, profile?: TimingProfile | "mixed"): string {
  if (timing === "immediate") {
    return "Monday–Thursday, 8:00 AM–7:00 PM Pacific. A launch outside that window stays queued until it opens.";
  }
  if (profile === "trades") return "Home services wait for 7:00–8:30 AM or 4:30–6:00 PM, Monday–Thursday.";
  if (profile === "salon") return "Salons and beauty wait for Monday or Tuesday, 8:00–11:00 AM.";
  if (profile === "general") return "This trade waits for Monday–Thursday, 10:00 AM–2:00 PM.";
  return "Home services use early morning or late afternoon. Salons and beauty use Monday and Tuesday mornings. Every other trade uses 10:00 AM–2:00 PM.";
}

type ZonedParts = {
  year: number;
  month: number;
  day: number;
  weekday: number;
  minutes: number;
};

function zonedParts(date: Date, timeZone: string): ZonedParts {
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });
  const bag: Record<string, string> = {};
  for (const part of fmt.formatToParts(date)) bag[part.type] = part.value;
  let hour = Number(bag.hour);
  if (hour === 24) hour = 0;
  const weekday = WEEKDAYS.indexOf(bag.weekday as (typeof WEEKDAYS)[number]);
  return {
    year: Number(bag.year),
    month: Number(bag.month),
    day: Number(bag.day),
    weekday: weekday < 0 ? 0 : weekday,
    minutes: hour * 60 + Number(bag.minute),
  };
}

function timeZoneOffsetMs(instant: Date, timeZone: string): number {
  const parts = zonedParts(instant, timeZone);
  const asUtc = Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    Math.floor(parts.minutes / 60),
    parts.minutes % 60,
    0,
  );
  return asUtc - instant.getTime();
}

function zonedDateTime(year: number, month: number, day: number, minutes: number, timeZone: string): Date {
  const hour = Math.floor(minutes / 60);
  const minute = minutes % 60;
  const utcGuess = Date.UTC(year, month - 1, day, hour, minute, 0);
  let utc = utcGuess - timeZoneOffsetMs(new Date(utcGuess), timeZone);
  const adjusted = utcGuess - timeZoneOffsetMs(new Date(utc), timeZone);
  if (adjusted !== utc) utc = adjusted;
  return new Date(utc);
}

function addCalendarDays(year: number, month: number, day: number, add: number) {
  const utc = new Date(Date.UTC(year, month - 1, day + add));
  return {
    year: utc.getUTCFullYear(),
    month: utc.getUTCMonth() + 1,
    day: utc.getUTCDate(),
    weekday: utc.getUTCDay(),
  };
}

function sendClock(timing: SendTiming, profile: TimingProfile): SendClock {
  return timing === "smart" ? PROFILE_CLOCKS[profile] : GUARDRAIL;
}

function minuteInside(minutes: number, clock: SendClock, weekday: number): boolean {
  if (!clock.days.has(weekday)) return false;
  return clock.ranges.some((range) => minutes >= range.start && minutes < range.end);
}

/** True when this instant is inside the guardrail, or inside the niche window when smart timing is on. */
export function insideSendWindow(
  now: Date,
  timing: SendTiming,
  profile: TimingProfile,
  timeZone = OUTREACH_TIME_ZONE,
): boolean {
  const parts = zonedParts(now, timeZone);
  return minuteInside(parts.minutes, sendClock(parseSendTiming(timing), parseTimingProfile(profile)), parts.weekday);
}

/**
 * The next moment a chunk may leave. Inside the window, that moment is `now`.
 * Nights, Fridays, and weekends move to the next open morning.
 */
export function nextSendInstant(
  now: Date,
  timing: SendTiming,
  profile: TimingProfile,
  timeZone = OUTREACH_TIME_ZONE,
): Date {
  const clock = sendClock(parseSendTiming(timing), parseTimingProfile(profile));
  const parts = zonedParts(now, timeZone);
  if (minuteInside(parts.minutes, clock, parts.weekday)) return now;
  const ranges = [...clock.ranges].sort((a, b) => a.start - b.start);
  for (let add = 0; add < 8; add += 1) {
    const day = addCalendarDays(parts.year, parts.month, parts.day, add);
    if (!clock.days.has(day.weekday)) continue;
    for (const range of ranges) {
      if (add === 0 && parts.minutes >= range.start) continue;
      const instant = zonedDateTime(day.year, day.month, day.day, range.start, timeZone);
      if (instant.getTime() >= now.getTime() - 1_000) return instant;
    }
  }
  return now;
}

export function formatSendSlot(date: Date, timeZone = OUTREACH_TIME_ZONE): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone,
    weekday: "long",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  }).format(date);
}

/**
 * Same spacing as `planTrickleChunks`, with each slot snapped into the send window.
 * A chunk that would land after close waits until the next open morning.
 */
export function planWindowedChunks<T>(
  items: T[],
  options: {
    chunkSize: number;
    intervalSeconds: number;
    start: Date;
    timing: SendTiming;
    profile: TimingProfile;
    timeZone?: string;
  },
): TrickleChunk<T>[] {
  const size = Math.max(1, Math.floor(options.chunkSize));
  const intervalMs = Math.max(1, Math.floor(options.intervalSeconds)) * 1000;
  const timeZone = options.timeZone ?? OUTREACH_TIME_ZONE;
  const chunks: TrickleChunk<T>[] = [];
  let cursor = nextSendInstant(options.start, options.timing, options.profile, timeZone);
  for (let offset = 0; offset < items.length; offset += size) {
    chunks.push({
      index: chunks.length,
      items: items.slice(offset, offset + size),
      scheduledAt: cursor.toISOString(),
    });
    cursor = nextSendInstant(
      new Date(cursor.getTime() + intervalMs),
      options.timing,
      options.profile,
      timeZone,
    );
  }
  return chunks;
}

export type ProfiledChunk<T> = TrickleChunk<T> & { profile: TimingProfile };

/**
 * Immediate mode keeps one list on the weekday window.
 * Smart mode splits the list by trade so a salon lead does not ride an HVAC clock.
 */
export function planSmartChunks<T extends { tradeType?: string }>(
  items: T[],
  options: {
    chunkSize: number;
    intervalSeconds: number;
    start: Date;
    timing: SendTiming;
    timeZone?: string;
  },
): ProfiledChunk<T>[] {
  const timing = parseSendTiming(options.timing);
  const groups = new Map<TimingProfile, T[]>();
  for (const item of items) {
    const profile = timing === "smart" ? timingProfileFor(item.tradeType ?? "") : "general";
    const list = groups.get(profile) ?? [];
    list.push(item);
    groups.set(profile, list);
  }
  const planned: ProfiledChunk<T>[] = [];
  for (const [profile, group] of groups) {
    for (const chunk of planWindowedChunks(group, { ...options, timing, profile })) {
      planned.push({ ...chunk, profile });
    }
  }
  planned.sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt));
  return planned.map((chunk, index) => ({ ...chunk, index }));
}
