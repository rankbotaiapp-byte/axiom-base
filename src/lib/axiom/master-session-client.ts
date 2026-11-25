"use client";

import { masterDeskError, masterDeskFetch, rememberMasterBypassKey } from "./master-desk-client";

export type MasterSessionState = {
  attached: boolean;
  configured: boolean;
  access: "bypass" | "session" | "signed-out";
};

export async function fetchMasterSession(): Promise<MasterSessionState> {
  const res = await masterDeskFetch("/api/master/session");
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
  });
  if (!res.ok) throw new Error(await masterDeskError(res));
  rememberMasterBypassKey(key);
  return {
    attached: true,
    configured: true,
    access: "bypass",
  };
}
