import { createServerFn } from "@tanstack/react-start";
import { parsePhoneLine } from "./funnel";

export const AXIOM_MASTER_CONFIG = {
  version: "2.5.0",
  mode: "production",
  defaultTenant: "accurate-plumbing",
  fees: { platform: 0.015 },
};

export function getMasterStatus() {
  return { status: "operational", activeNodes: 4 };
}

export const readOutreachDesk = createServerFn({ method: "GET" }).handler(async () => ({
  mode: "simulation",
  chunkSize: 1,
  intervalSeconds: 60,
  slotLabels: ["9:00 AM", "1:00 PM", "4:00 PM"],
  smsDailyCap: 40,
  emailDailyCap: 80,
}));

export const automateOutreachDesk = createServerFn({ method: "POST" }).handler(async () => ({
  queued: 0,
  sequences: 0,
  simulation: true,
  slots: ["9:00 AM", "1:00 PM", "4:00 PM"],
}));

export const masterGate = createServerFn({ method: "GET" }).handler(async () => {
  if (typeof fetch === "undefined") return { open: true, ok: true };
  const res = await fetch("/api/master/session", { credentials: "include" });
  const body = (await res.json().catch(() => ({}))) as { attached?: boolean };
  return { open: body.attached === true, ok: true };
});
export const masterEntry = createServerFn({ method: "GET" }).handler(async () => {
  if (typeof fetch === "undefined") return { access: "signed-out" as const, configured: false, ok: true };
  const res = await fetch("/api/master/session", { credentials: "include" });
  const body = (await res.json().catch(() => ({}))) as {
    access?: "bypass" | "session" | "signed-out";
    configured?: boolean;
    attached?: boolean;
  };
  return {
    ok: true,
    configured: body.configured === true,
    access: body.attached ? "bypass" : "signed-out",
  };
});
export const claimMasterBypass = createServerFn({ method: "POST" })
  .validator((d: { key?: string }) => d)
  .handler(async ({ data }: { data: { key?: string } }) => {
    const key = String(data?.key ?? "").trim();
    if (typeof fetch === "undefined") return { ok: true as const };
    const res = await fetch("/api/master/session", {
      method: "POST",
      credentials: "include",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ key }),
    });
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    if (!res.ok) throw new Error(typeof body.error === "string" ? body.error : "That key does not open the desk.");
    if (typeof sessionStorage !== "undefined" && key.length >= 16) {
      sessionStorage.setItem("axiom_master_bypass", key);
    }
    return { ok: true as const };
  });
export const getMasterDesk = createServerFn({ method: "GET" }).handler(async () => ({ ok: true }));

export const ensureFunnelSession = createServerFn({ method: "POST" })
  .validator((d: Record<string, unknown> = {}) => d)
  .handler(async ({ data }) => ({ ok: true, sessionId: "local", ...data }));

export const recordFunnelHit = createServerFn({ method: "POST" })
  .validator((d: Record<string, unknown> = {}) => d)
  .handler(async ({ data }) => ({ ok: true, ...data }));

export const beginTerritoryCheckout = createServerFn({ method: "POST" })
  .validator((d: Record<string, unknown>) => d)
  .handler(async ({ data }) => ({
    processor: "simulation" as const,
    url: "/onboard",
    checkoutId: "sim_checkout",
    ...data,
  }));

export const confirmTerritorySession = createServerFn({ method: "POST" })
  .validator((d: Record<string, unknown>) => d)
  .handler(async ({ data }) => ({ ok: true, ...data }));

export const finishTerritoryCheckout = createServerFn({ method: "POST" })
  .validator((d: Record<string, unknown>) => d)
  .handler(async ({ data }) => ({ ok: true, ...data }));

export const getLeadPreview = createServerFn({ method: "GET" })
  .validator((d: Record<string, unknown> = {}) => d)
  .handler(async () => ({ leads: [], count: 0 }));

/** Sync lead normalizer used by master.server (not a server fn). */
export function cleanLead(data: Record<string, any> = {}) {
  const businessName = String(data.businessName || "Business").trim();
  const tradeType = String(data.tradeType || "contractor").trim();
  const city = String(data.city || "").trim();
  const county = String(data.county || "").trim();
  const leadSlug = `${businessName}-${city || county || "local"}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 64);
  return {
    businessName,
    tradeType,
    tradeLabel: String(data.tradeLabel || tradeType),
    city,
    county,
    contactEmail: String(data.contactEmail || ""),
    contactPhone: String(data.contactPhone || ""),
    contactName: String(data.contactName || ""),
    reviewScore: Number(data.reviewScore || 0),
    reviewCount: Number(data.reviewCount || 0),
    hasWebsite: Boolean(data.hasWebsite),
    phoneLine: parsePhoneLine(data.phoneLine),
    leadSlug: leadSlug || "lead",
  };
}

export default AXIOM_MASTER_CONFIG;
