/** Next open arrival windows from shop hours + staff availability + booked slots. */

export const SLOT_TIME_ZONE = "America/Los_Angeles";
export const SLOT_WINDOW_MINUTES = 120;

export type WeekdayKey = "sun" | "mon" | "tue" | "wed" | "thu" | "fri" | "sat";

export type OpenHoursSpan = { startMin: number; endMin: number } | null;

export type SlotStaff = {
  id: string;
  availability?: Partial<Record<WeekdayKey, boolean>>;
};

export type BusySlot = {
  employeeId: string;
  startsAt: string;
  durationMin?: number;
};

export type ArrivalWindow = {
  index: 1 | 2;
  employeeId: string;
  startsAt: string;
  endsAt: string;
  label: string;
};

const WEEKDAY_KEYS: WeekdayKey[] = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];

const DEFAULT_HOURS: Record<WeekdayKey, string> = {
  mon: "09:00-18:00",
  tue: "09:00-18:00",
  wed: "09:00-18:00",
  thu: "09:00-18:00",
  fri: "09:00-18:00",
  sat: "09:00-16:00",
  sun: "closed",
};

export function parseShopHoursJson(raw: string | Record<string, string> | null | undefined): Record<WeekdayKey, string> {
  let parsed: Record<string, string> = { ...DEFAULT_HOURS };
  if (raw && typeof raw === "object") {
    parsed = { ...DEFAULT_HOURS, ...raw };
  } else if (typeof raw === "string" && raw.trim()) {
    try {
      const json = JSON.parse(raw) as Record<string, string>;
      parsed = { ...DEFAULT_HOURS, ...json };
    } catch {
      /* keep defaults */
    }
  }
  const out = { ...DEFAULT_HOURS };
  for (const key of WEEKDAY_KEYS) {
    const value = parsed[key] ?? parsed[key.slice(0, 3)];
    if (typeof value === "string" && value.trim()) out[key] = value.trim();
  }
  return out;
}

export function parseHoursSpan(value: string): OpenHoursSpan {
  const text = value.trim().toLowerCase();
  if (!text || text === "closed" || text === "off" || text.includes("emergency")) return null;
  const match = text.match(/(\d{1,2})(?::(\d{2}))?\s*(a|p|am|pm)?\s*[-–to]+\s*(\d{1,2})(?::(\d{2}))?\s*(a|p|am|pm)?/i);
  if (!match) {
    const military = text.match(/^(\d{1,2}):(\d{2})\s*-\s*(\d{1,2}):(\d{2})$/);
    if (!military) return null;
    return {
      startMin: Number(military[1]) * 60 + Number(military[2]),
      endMin: Number(military[3]) * 60 + Number(military[4]),
    };
  }
  const startMin = clockToMinutes(Number(match[1]), Number(match[2] || 0), match[3], match[6]);
  const endMin = clockToMinutes(Number(match[4]), Number(match[5] || 0), match[6], match[3]);
  if (endMin <= startMin) return null;
  return { startMin, endMin };
}

function clockToMinutes(hour: number, minute: number, ownMeridiem?: string, otherMeridiem?: string): number {
  let h = hour;
  const mer = (ownMeridiem || otherMeridiem || "").toLowerCase();
  if (mer.startsWith("p") && h < 12) h += 12;
  if (mer.startsWith("a") && h === 12) h = 0;
  if (!mer && h <= 24) return h * 60 + minute;
  return h * 60 + minute;
}

export function parseAvailabilityJson(raw: string | null | undefined): Partial<Record<WeekdayKey, boolean>> {
  if (!raw?.trim()) return {};
  try {
    const json = JSON.parse(raw) as Record<string, unknown>;
    const out: Partial<Record<WeekdayKey, boolean>> = {};
    for (const key of WEEKDAY_KEYS) {
      if (typeof json[key] === "boolean") out[key] = json[key];
    }
    return out;
  } catch {
    return {};
  }
}

type ZonedParts = { year: number; month: number; day: number; weekday: number; minutes: number };

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
  const weekdayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const weekday = weekdayNames.indexOf(bag.weekday);
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
  return { year: utc.getUTCFullYear(), month: utc.getUTCMonth() + 1, day: utc.getUTCDate() };
}

export function formatArrivalWindowLabel(startsAt: string, endsAt: string, now = new Date(), timeZone = SLOT_TIME_ZONE): string {
  const start = new Date(startsAt);
  const end = new Date(endsAt);
  const startParts = zonedParts(start, timeZone);
  const nowParts = zonedParts(now, timeZone);
  const sameDay =
    startParts.year === nowParts.year && startParts.month === nowParts.month && startParts.day === nowParts.day;
  const tomorrow = addCalendarDays(nowParts.year, nowParts.month, nowParts.day, 1);
  const isTomorrow =
    startParts.year === tomorrow.year && startParts.month === tomorrow.month && startParts.day === tomorrow.day;
  const dayLabel = sameDay
    ? "Today"
    : isTomorrow
      ? "Tomorrow"
      : start.toLocaleString("en-US", { weekday: "short", month: "short", day: "numeric", timeZone });
  const timeFmt = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone,
  });
  return `${dayLabel} ${timeFmt.format(start)}–${timeFmt.format(end)}`;
}

function staffWorks(staff: SlotStaff, weekday: WeekdayKey): boolean {
  const flag = staff.availability?.[weekday];
  return flag !== false;
}

function overlaps(busy: BusySlot, employeeId: string, startMs: number, endMs: number): boolean {
  if (busy.employeeId !== employeeId) return false;
  const busyStart = Date.parse(busy.startsAt);
  if (!Number.isFinite(busyStart)) return false;
  const busyEnd = busyStart + Math.max(30, busy.durationMin ?? SLOT_WINDOW_MINUTES) * 60_000;
  return busyStart < endMs && busyEnd > startMs;
}

export function nextOpenArrivalWindows(input: {
  now?: Date;
  timeZone?: string;
  hours: Record<WeekdayKey, string> | string;
  staff: SlotStaff[];
  busy?: BusySlot[];
  serviceDurationMin?: number;
  count?: number;
  lookAheadDays?: number;
}): ArrivalWindow[] {
  const now = input.now ?? new Date();
  const timeZone = input.timeZone ?? SLOT_TIME_ZONE;
  const hours = typeof input.hours === "string" ? parseShopHoursJson(input.hours) : input.hours;
  const staff = input.staff.length ? input.staff : [{ id: "owner", availability: {} }];
  const busy = input.busy ?? [];
  const duration = Math.max(30, input.serviceDurationMin ?? SLOT_WINDOW_MINUTES);
  const want = input.count === 1 ? 1 : 2;
  const lookAhead = Math.max(2, input.lookAheadDays ?? 14);
  const found: ArrivalWindow[] = [];
  const startParts = zonedParts(now, timeZone);

  for (let dayOffset = 0; dayOffset < lookAhead && found.length < want; dayOffset += 1) {
    const day = addCalendarDays(startParts.year, startParts.month, startParts.day, dayOffset);
    const weekday = WEEKDAY_KEYS[new Date(Date.UTC(day.year, day.month - 1, day.day)).getUTCDay()];
    const span = parseHoursSpan(hours[weekday]);
    if (!span) continue;
    const earliest = dayOffset === 0 ? startParts.minutes + 15 : span.startMin;
    const aligned = Math.ceil(Math.max(span.startMin, earliest) / 60) * 60;
    for (let cursor = aligned; cursor + duration <= span.endMin && found.length < want; cursor += 60) {
      const start = zonedDateTime(day.year, day.month, day.day, cursor, timeZone);
      const end = zonedDateTime(day.year, day.month, day.day, cursor + duration, timeZone);
      if (start.getTime() <= now.getTime()) continue;
      const worker = staff.find(
        (row) => staffWorks(row, weekday) && !busy.some((slot) => overlaps(slot, row.id, start.getTime(), end.getTime())),
      );
      if (!worker) continue;
      const startsAt = start.toISOString();
      const endsAt = end.toISOString();
      found.push({
        index: (found.length + 1) as 1 | 2,
        employeeId: worker.id,
        startsAt,
        endsAt,
        label: formatArrivalWindowLabel(startsAt, endsAt, now, timeZone),
      });
    }
  }
  return found;
}
