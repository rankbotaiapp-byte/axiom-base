import { aeroPacks, currency, exhaustTones, paints, trims, wheels, type ConfigOption } from "./config";

export interface BuildSelection {
  trim: string;
  paint: string;
  wheel: string;
  exhaust: string;
  aero: string;
}

export const defaultBuild: BuildSelection = {
  trim: "apexr",
  paint: "obsidian",
  wheel: "forged-black",
  exhaust: "cyan",
  aero: "carbon",
};

function pick<T extends ConfigOption>(list: T[], id: string): T {
  const found = list.find((o) => o.id === id) ?? list[0];
  if (!found) throw new Error("Configurator option list is empty");
  return found;
}

export function resolveBuild(sel: BuildSelection) {
  const trim = pick(trims, sel.trim);
  const paint = pick(paints, sel.paint);
  const wheel = pick(wheels, sel.wheel);
  const exhaust = pick(exhaustTones, sel.exhaust);
  const aero = pick(aeroPacks, sel.aero);
  const lines = [
    { label: "Build", name: trim.name, price: trim.price },
    { label: "Paint", name: paint.name, price: paint.price },
    { label: "Wheels", name: wheel.name, price: wheel.price },
    { label: "Exhaust", name: exhaust.name, price: exhaust.price },
    { label: "Aero", name: aero.name, price: aero.price },
  ];
  const total = lines.reduce((sum, l) => sum + l.price, 0);
  const summary = `${trim.name}, ${paint.name}, ${wheel.name}, ${exhaust.name} exhaust, ${aero.name} — est. ${currency.format(total)}`;
  return { trim, paint, wheel, exhaust, aero, lines, total, summary };
}
