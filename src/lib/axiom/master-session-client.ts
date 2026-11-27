"use client";

import { DESK_CHECK_BUDGET_MS } from "@/lib/auth/desk-budget";
import { masterDeskError, readMasterBypassKey, rememberMasterBypassKey } from "./master-desk-client";

export type MasterSessionState = {
  attached: boolean;
  configured: boolean;
  access: "bypass" | "session" | "signed-out";
};

function budgetAbort(): AbortController {
  const controller = new AbortController();
  window.setTimeout(() => controller.abort(), DESK_CHECK_BUDGET_MS);
  return controller;
}

export async function fetchMasterSession(): Promise<MasterSessionState> {
  const headers = new Headers();
  const bypass = readMasterBypassKey();
  if (bypass) headers.set("Authorization", `Bearer ${bypass}`);
  const controller = budgetAbort();
  const res = await fetch("/api/master/session", {
    credentials: "include",
    headers,
    signal: controller.signal,
  });
  const body = (await res.json().catch(() => ({}))) as Partial<MasterSessionState> & { error?: string };
  return {
    attached: body.attached === true,
    configured: body.configured === true,
    access: body.access === "bypass" || body.access === "session" ? body.access : "signed-out",
  };
}

export async function claimMasterSession(key: string): Promise<MasterSessionState> {
  const res = await fetch("/api/master/session", {
    method: "POST",
    credentials: "include",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ key }),
    signal: AbortSignal.timeout(DESK_CHECK_BUDGET_MS),
  });
  if (!res.ok) throw new Error(await masterDeskError(res));
  rememberMasterBypassKey(key);
  return {
    attached: true,
    configured: true,
    access: "bypass",
  };
}
