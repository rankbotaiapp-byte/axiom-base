import { toE164 } from "./notify-target.ts";

/** North American 555-exchange numbers are placeholders, not contractor mobiles. */
export function isPlaceholderDispatchPhone(raw: string): boolean {
  const e164 = toE164(raw);
  if (!e164) return true;
  const digits = e164.replace(/\D/g, "");
  if (digits.length === 11 && digits.startsWith("1")) return digits.slice(4, 7) === "555";
  if (digits.length === 10) return digits.slice(3, 6) === "555";
  return false;
}

export function collectedDispatchPhone(raw: string | undefined | null): string {
  const value = (raw ?? "").trim();
  if (!value || isPlaceholderDispatchPhone(value)) return "";
  return toE164(value) ?? "";
}

export function needsDispatchPhoneLock(opts: {
  paid: boolean;
  dispatchPhone?: string;
  dispatchPhoneLocked?: boolean;
}): boolean {
  if (!opts.paid) return false;
  const phone = collectedDispatchPhone(opts.dispatchPhone);
  return !phone || opts.dispatchPhoneLocked !== true;
}

export function maskDispatchPhone(raw: string): string {
  const e164 = toE164(raw) || raw.trim();
  if (e164.length < 8) return "••••";
  return `${e164.slice(0, 5)}•••${e164.slice(-4)}`;
}

export function testDispatchCopy(shopName: string): string {
  const name = shopName.trim() || "your shop";
  return `Axiom live test for ${name}: after-hours jobs will text this phone. Reply STOP to opt out.`;
}
