import {
  AUTOPILOT_EMAIL_DAILY_CAP,
  AUTOPILOT_SMS_DAILY_CAP,
  AUTOPILOT_WINDOW_END_MINUTES,
  AUTOPILOT_WINDOW_START_MINUTES,
  TRICKLE_DELAY_MAX_SECONDS,
  TRICKLE_DELAY_MIN_SECONDS,
} from "./autopilot-limits.ts";

export type OutreachMode = "simulation" | "live";

export const DEFAULT_TRICKLE_SECONDS = TRICKLE_DELAY_MIN_SECONDS;
export const DEFAULT_CHUNK_SIZE = 5;
/** Pacific wall-clock releases: 9:00 AM, 1:00 PM, 4:00 PM. */
export const DEFAULT_TRICKLE_SLOT_MINUTES = [9 * 60, 13 * 60, 16 * 60] as const;
export const DEFAULT_SMS_DAILY_CAP = AUTOPILOT_SMS_DAILY_CAP;
export const DEFAULT_EMAIL_DAILY_CAP = AUTOPILOT_EMAIL_DAILY_CAP;

/** Anything other than an explicit live value stays in simulation. */
export function parseOutreachMode(value: string | undefined | null): OutreachMode {
  return value?.trim().toLowerCase() === "live" ? "live" : "simulation";
}

/** Configurable gap between consecutive sends. Values outside 45–90 seconds clamp into that range. */
export function parseTrickleSeconds(value: string | undefined | null): number {
  const raw = String(value ?? "").trim();
  if (!raw) return DEFAULT_TRICKLE_SECONDS;
  const n = Number(raw);
  if (!Number.isFinite(n)) return DEFAULT_TRICKLE_SECONDS;
  return Math.min(TRICKLE_DELAY_MAX_SECONDS, Math.max(TRICKLE_DELAY_MIN_SECONDS, Math.round(n)));
}

/** Leads released together. Defaults to 5, and stays between 1 and 20. */
export function parseChunkSize(value: string | undefined | null): number {
  const raw = String(value ?? "").trim();
  if (!raw) return DEFAULT_CHUNK_SIZE;
  const n = Number(raw);
  if (!Number.isFinite(n)) return DEFAULT_CHUNK_SIZE;
  return Math.min(20, Math.max(1, Math.round(n)));
}

/** Minutes-from-midnight for trickle slots. Accepts `9:00,13:00,16:00` or `9,13,16`. */
export function parseTrickleSlots(value: string | undefined | null): number[] {
  const raw = String(value ?? "").trim();
  if (!raw) return [...DEFAULT_TRICKLE_SLOT_MINUTES];
  const parsed: number[] = [];
  for (const piece of raw.split(/[,|;]+/)) {
    const token = piece.trim();
    if (!token) continue;
    const hm = /^(\d{1,2})(?::(\d{2}))?$/.exec(token);
    if (!hm) continue;
    const hour = Number(hm[1]);
    const minute = Number(hm[2] ?? "0");
    if (!Number.isFinite(hour) || hour < 0 || hour > 23) continue;
    if (!Number.isFinite(minute) || minute < 0 || minute > 59) continue;
    parsed.push(hour * 60 + minute);
  }
  if (parsed.length === 0) return [...DEFAULT_TRICKLE_SLOT_MINUTES];
  return [...new Set(parsed)].sort((a, b) => a - b);
}

export function parseDailyCap(value: string | undefined | null, fallback: number): number {
  const raw = String(value ?? "").trim();
  if (!raw) return fallback;
  const n = Number(raw);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(500, Math.max(0, Math.round(n)));
}

export function formatSlotLabel(minutes: number): string {
  const hour = Math.floor(minutes / 60) % 24;
  const minute = minutes % 60;
  const suffix = hour >= 12 ? "PM" : "AM";
  const twelve = hour % 12 === 0 ? 12 : hour % 12;
  return minute === 0 ? `${twelve}:00 ${suffix}` : `${twelve}:${String(minute).padStart(2, "0")} ${suffix}`;
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

/** Start is inclusive. End is exclusive, so 4:01 PM is the first closed minute. */
type MinuteRange = { start: number; end: number };

type SendClock = {
  days: ReadonlySet<number>;
  ranges: MinuteRange[];
};

/** Weekdays 9:00 AM–4:00 PM Pacific. Saturday and Sunday never open. */
const GUARDRAIL: SendClock = {
  days: new Set([1, 2, 3, 4, 5]),
  ranges: [{ start: AUTOPILOT_WINDOW_START_MINUTES, end: AUTOPILOT_WINDOW_END_MINUTES + 1 }],
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
    return "Monday–Friday, 9:00 AM–4:00 PM Pacific. Weekends stay queued. A launch outside that window waits until it opens.";
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
 * Nights and weekends move to the next weekday 9:00 AM.
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

/**
 * Next custom trickle release at or after `now`.
 * Slots are wall-clock minutes in Pacific (default 9:00 / 13:00 / 16:00).
 * Nights and weekends roll forward to the next weekday slot.
 */
export function nextTrickleSlotInstant(
  now: Date,
  slotMinutes: readonly number[],
  timeZone = OUTREACH_TIME_ZONE,
): Date {
  const slots = (slotMinutes.length > 0 ? [...slotMinutes] : [...DEFAULT_TRICKLE_SLOT_MINUTES]).sort((a, b) => a - b);
  const parts = zonedParts(now, timeZone);
  for (let add = 0; add < 14; add += 1) {
    const day = addCalendarDays(parts.year, parts.month, parts.day, add);
    // Weekdays only — Saturday and Sunday never release.
    if (day.weekday < 1 || day.weekday > 5) continue;
    for (const minutes of slots) {
      if (add === 0 && parts.minutes > minutes) continue;
      const instant = zonedDateTime(day.year, day.month, day.day, minutes, timeZone);
      if (instant.getTime() >= now.getTime() - 1_000) return instant;
    }
  }
  return now;
}

export type SlotChunkOptions = {
  chunkSize: number;
  start: Date;
  /** Minutes from midnight Pacific. */
  slots: readonly number[];
  /** Hard ceiling for leads released on any single Pacific day. */
  dailyCap: number;
  timeZone?: string;
};

/**
 * Preloads a channel queue onto the custom trickle clock.
 * Each slot can carry up to `chunkSize` leads, and the day never exceeds `dailyCap`.
 */
export function planSlotChunks<T>(items: T[], options: SlotChunkOptions): TrickleChunk<T>[] {
  const size = Math.max(1, Math.floor(options.chunkSize));
  const dailyCap = Math.max(0, Math.floor(options.dailyCap));
  if (items.length === 0 || dailyCap === 0) return [];
  const timeZone = options.timeZone ?? OUTREACH_TIME_ZONE;
  const slots = (options.slots.length > 0 ? [...options.slots] : [...DEFAULT_TRICKLE_SLOT_MINUTES]).sort(
    (a, b) => a - b,
  );
  const chunks: TrickleChunk<T>[] = [];
  let offset = 0;
  let cursor = nextTrickleSlotInstant(options.start, slots, timeZone);
  let dayKey = zonedParts(cursor, timeZone);
  let usedToday = 0;

  while (offset < items.length) {
    if (usedToday >= dailyCap) {
      const tomorrow = addCalendarDays(dayKey.year, dayKey.month, dayKey.day, 1);
      cursor = nextTrickleSlotInstant(
        zonedDateTime(tomorrow.year, tomorrow.month, tomorrow.day, 0, timeZone),
        slots,
        timeZone,
      );
      dayKey = zonedParts(cursor, timeZone);
      usedToday = 0;
      continue;
    }
    const room = Math.min(size, dailyCap - usedToday, items.length - offset);
    chunks.push({
      index: chunks.length,
      items: items.slice(offset, offset + room),
      scheduledAt: cursor.toISOString(),
    });
    offset += room;
    usedToday += room;
    if (offset >= items.length) break;
    const after = new Date(cursor.getTime() + 60_000);
    cursor = nextTrickleSlotInstant(after, slots, timeZone);
    const nextParts = zonedParts(cursor, timeZone);
    if (nextParts.year !== dayKey.year || nextParts.month !== dayKey.month || nextParts.day !== dayKey.day) {
      dayKey = nextParts;
      usedToday = 0;
    }
  }
  return chunks;
}

/**
 * Slot planner with the same niche split as `planSmartChunks`.
 * Prefer this for Automate preloads so SMS/email land on 9 / 1 / 4 Pacific.
 */
export function planSmartSlotChunks<T extends { tradeType?: string }>(
  items: T[],
  options: {
    chunkSize: number;
    start: Date;
    slots: readonly number[];
    dailyCap: number;
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
    for (const chunk of planSlotChunks(group, options)) {
      planned.push({ ...chunk, profile });
    }
  }
  planned.sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt));
  return planned.map((chunk, index) => ({ ...chunk, index }));
}
