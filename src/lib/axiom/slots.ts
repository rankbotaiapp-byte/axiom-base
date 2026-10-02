const DAY_KEYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"] as const;

export type DaySlot = {
  iso: string;
  label: string;
  dayLabel: string;
};

function parseRange(range: string): { start: number; end: number } | null {
  if (!range || range === "closed") return null;
  const [a, b] = range.split("-");
  if (!a || !b) return null;
  const [sh, sm] = a.split(":").map(Number);
  const [eh, em] = b.split(":").map(Number);
  return { start: sh * 60 + sm, end: eh * 60 + em };
}

export function buildSlots(opts: {
  hours: Record<string, string>;
  durationMin: number;
  bookedIsos: string[];
  days?: number;
}): { dayLabel: string; dateKey: string; slots: DaySlot[] }[] {
  const days = opts.days ?? 7;
  const booked = new Set(opts.bookedIsos.map((s) => new Date(s).getTime()));
  const groups: { dayLabel: string; dateKey: string; slots: DaySlot[] }[] = [];
  const now = Date.now() + 30 * 60 * 1000;

  for (let d = 0; d < days; d += 1) {
    const day = new Date();
    day.setHours(0, 0, 0, 0);
    day.setDate(day.getDate() + d);
    const key = DAY_KEYS[day.getDay()];
    const range = parseRange(opts.hours[key] ?? "closed");
    const dateKey = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, "0")}-${String(day.getDate()).padStart(2, "0")}`;
    const dayLabel = day.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
    const slots: DaySlot[] = [];
    if (range) {
      for (let m = range.start; m + opts.durationMin <= range.end; m += 30) {
        const dt = new Date(day);
        dt.setHours(Math.floor(m / 60), m % 60, 0, 0);
        if (dt.getTime() < now) continue;
        if (booked.has(dt.getTime())) continue;
        slots.push({
          iso: dt.toISOString(),
          label: dt.toLocaleTimeString("en-US", {
            hour: "numeric",
            minute: "2-digit",
          }),
          dayLabel,
        });
      }
    }
    groups.push({ dayLabel, dateKey, slots });
  }
  return groups;
}
