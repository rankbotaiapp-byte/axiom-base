type ChargeUnit = "flat" | "person" | "boat";

/** Charge units declared on a trade. Trades that declare none stay a flat fee. */
export function unitsForTemplate(declared?: readonly ChargeUnit[]): ChargeUnit[] {
  if (declared?.length) return [...declared];
  return ["flat"];
}

export function defaultUnit(units: readonly ChargeUnit[]): ChargeUnit {
  return units.find((unit) => unit !== "flat") ?? units[0] ?? "flat";
}

export type SectionSpan = {
  label: string;
  start: number;
  count: number;
};

/** Consecutive rows that share a section name. Matches the customer menu. */
export function sectionsOf<T extends { group: string }>(rows: T[]): SectionSpan[] {
  const sections: SectionSpan[] = [];
  rows.forEach((row, index) => {
    const last = sections[sections.length - 1];
    if (last && last.label === row.group) last.count += 1;
    else sections.push({ label: row.group, start: index, count: 1 });
  });
  return sections;
}

export function renameSection<T extends { group: string }>(
  rows: T[],
  start: number,
  count: number,
  name: string,
): T[] {
  const end = start + count;
  return rows.map((row, index) => (index >= start && index < end ? { ...row, group: name } : row));
}

/**
 * Swap a line with its neighbor. Crossing a section boundary adopts that section,
 * so the line joins it instead of splitting the menu into a one-line island.
 */
export function moveRow<T extends { group: string }>(rows: T[], index: number, direction: -1 | 1): T[] {
  const next = index + direction;
  if (index < 0 || next < 0 || next >= rows.length) return rows;
  const moving = rows[index];
  const neighbor = rows[next];
  const relocated = moving.group === neighbor.group ? moving : { ...moving, group: neighbor.group };
  const copy = rows.slice();
  copy[index] = neighbor;
  copy[next] = relocated;
  return copy;
}

export function moveSection<T extends { group: string }>(
  rows: T[],
  sectionIndex: number,
  direction: -1 | 1,
): T[] {
  const sections = sectionsOf(rows);
  const current = sections[sectionIndex];
  const otherIndex = sectionIndex + direction;
  const other = sections[otherIndex];
  if (!current || !other) return rows;
  const currentRows = rows.slice(current.start, current.start + current.count);
  const otherRows = rows.slice(other.start, other.start + other.count);
  const [first, second] = direction < 0 ? [currentRows, otherRows] : [otherRows, currentRows];
  const start = Math.min(current.start, other.start);
  const end = Math.max(current.start + current.count, other.start + other.count);
  return [...rows.slice(0, start), ...first, ...second, ...rows.slice(end)];
}

export function insertRow<T>(rows: T[], index: number, row: T): T[] {
  const at = Math.max(0, Math.min(index, rows.length));
  return [...rows.slice(0, at), row, ...rows.slice(at)];
}

export function nextSectionName(labels: string[]): string {
  const base = "New section";
  if (!labels.includes(base)) return base;
  let n = 2;
  while (labels.includes(`${base} ${n}`)) n += 1;
  return `${base} ${n}`;
}
