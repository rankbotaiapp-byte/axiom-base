import { toE164 } from "./notify-target";

export const AXIOM_VCF_NOTE =
  "Text finished job photos to this number to auto-update your storefront Proof of Work gallery.";

export type AxiomPhoneStatus =
  | "none"
  | "assigned"
  | "simulated"
  | "pending_pool"
  | "reserved";

export type AxiomBusinessNumberView = {
  slug: string;
  businessName: string;
  e164: string;
  display: string;
  status: AxiomPhoneStatus;
  assignedAt: string | null;
  welcomeSms: "sent" | "simulated" | "suppressed" | "skipped" | "auth_failed" | "pending" | "none";
};

export function nationalDigits(raw: string): string {
  return raw.replace(/\D/g, "").slice(-10);
}

export function formatAxiomPhoneDisplay(raw: string): string {
  const digits = nationalDigits(raw);
  if (digits.length !== 10) return raw.trim() || "Provisioning…";
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}

export function axiomDispatchFn(businessName: string): string {
  const name = businessName.replace(/\s+/g, " ").trim() || "Shop";
  return `Axiom — ${name} Dispatch`;
}

function vcardEscape(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/,/g, "\\,").replace(/;/g, "\\;");
}

export function buildAxiomVcard(input: { businessName: string; e164: string }): string {
  const fn = axiomDispatchFn(input.businessName);
  const tel = toE164(input.e164) || input.e164.trim();
  return [
    "BEGIN:VCARD",
    "VERSION:3.0",
    `FN:${vcardEscape(fn)}`,
    `N:Dispatch;${vcardEscape(`Axiom — ${input.businessName.replace(/\s+/g, " ").trim() || "Shop"}`)};;;`,
    "ORG:Axiom",
    `TEL;TYPE=WORK,VOICE:${tel}`,
    `NOTE:${vcardEscape(AXIOM_VCF_NOTE)}`,
    "END:VCARD",
  ].join("\r\n");
}

export function axiomWelcomeSmsBody(input: { businessName: string; e164: string }): string {
  const display = formatAxiomPhoneDisplay(input.e164);
  return [
    `Axiom locked your business number: ${display}.`,
    "Save this contact, then text finished job photos here to update Proof of Work on your live page.",
    "Reply STOP to opt out.",
  ].join(" ");
}

export function isTwilioAuthError(payload: { code?: unknown; message?: unknown; status?: unknown }): boolean {
  if (Number(payload.code) === 20003) return true;
  const message = String(payload.message || "").toLowerCase();
  return message.includes("authenticate") && (message.includes("20003") || Number(payload.status) === 401);
}

export function a2pOutboundLive(outreachMode: string | undefined, a2pFlag: string | undefined): boolean {
  return outreachMode?.trim().toLowerCase() === "live" && a2pFlag?.trim().toLowerCase() === "true";
}

export function resolveNumberAssignment(input: {
  existingE164?: string | null;
  poolE164?: string | null;
  inventoryE164?: string | null;
  fallbackE164?: string | null;
  liveA2P: boolean;
}): { e164: string; reused: boolean; source: "existing" | "pool" | "inventory" | "fallback" | "none"; status: AxiomPhoneStatus } {
  const existing = toE164(input.existingE164 || "") || "";
  if (existing) {
    return { e164: existing, reused: true, source: "existing", status: input.liveA2P ? "assigned" : "simulated" };
  }
  const pool = toE164(input.poolE164 || "") || "";
  if (pool) {
    return { e164: pool, reused: false, source: "pool", status: input.liveA2P ? "assigned" : "simulated" };
  }
  const inventory = toE164(input.inventoryE164 || "") || "";
  if (inventory) {
    return { e164: inventory, reused: false, source: "inventory", status: input.liveA2P ? "assigned" : "simulated" };
  }
  const fallback = toE164(input.fallbackE164 || "") || "";
  if (fallback) {
    return {
      e164: fallback,
      reused: false,
      source: "fallback",
      status: input.liveA2P ? "pending_pool" : "simulated",
    };
  }
  return { e164: "", reused: false, source: "none", status: "pending_pool" };
}

export function decideWelcomeSms(input: {
  alreadySent: boolean;
  ownerE164: string | null;
  fromE164: string;
  suppressed: boolean;
  liveA2P: boolean;
}): "already" | "skipped" | "suppressed" | "simulated" | "send_live" {
  if (input.alreadySent) return "already";
  if (!input.ownerE164 || !input.fromE164) return "skipped";
  if (input.suppressed) return "suppressed";
  if (!input.liveA2P) return "simulated";
  return "send_live";
}

export function parsePoolList(raw: string | undefined): string[] {
  if (!raw?.trim()) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const part of raw.split(/[,\s]+/)) {
    const e164 = toE164(part);
    if (!e164 || seen.has(e164)) continue;
    seen.add(e164);
    out.push(e164);
  }
  return out;
}
