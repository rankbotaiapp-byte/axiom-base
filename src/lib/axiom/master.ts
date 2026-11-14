import { createServerFn } from "@tanstack/react-start";

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

export const masterGate = createServerFn({ method: "GET" }).handler(async () => ({ ok: true }));
export const masterEntry = createServerFn({ method: "GET" }).handler(async () => ({ ok: true }));
export const claimMasterBypass = createServerFn({ method: "POST" })
  .validator((d: { key?: string }) => d)
  .handler(async () => ({ ok: true }));
export const getMasterDesk = createServerFn({ method: "GET" }).handler(async () => ({ ok: true }));

export default AXIOM_MASTER_CONFIG;
