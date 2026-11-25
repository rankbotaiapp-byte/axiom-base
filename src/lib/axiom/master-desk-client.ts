"use client";

import { authClient, getBearerToken } from "@/lib/auth/client";
import { DESK_CHECK_BUDGET_MS } from "@/lib/auth/desk-budget";

const MASTER_BYPASS_STORAGE = "axiom_master_bypass";

export function rememberMasterBypassKey(key: string): void {
  const value = key.trim();
  if (value.length < 16 || typeof sessionStorage === "undefined") return;
  sessionStorage.setItem(MASTER_BYPASS_STORAGE, value);
}

export function readMasterBypassKey(): string {
  try {
    return sessionStorage.getItem(MASTER_BYPASS_STORAGE)?.trim() ?? "";
  } catch {
    return "";
  }
}

/** Same-origin desk calls. Cookies ride along; master bypass key or Better Auth token is sent as Bearer. */
export async function masterDeskFetch(input: string, init: RequestInit = {}): Promise<Response> {
  const headers = new Headers(init.headers);
  const bypass = readMasterBypassKey();
  let token = bypass || getBearerToken();
  if (!token) {
    try {
      const session = await authClient.getSession();
      token = session.data?.session?.token ?? null;
    } catch {
      token = null;
    }
  }
  if (token) headers.set("Authorization", `Bearer ${token}`);
  return fetch(input, {
    ...init,
    credentials: "include",
    headers,
    signal: init.signal ?? AbortSignal.timeout(DESK_CHECK_BUDGET_MS),
  });
}

export async function masterDeskError(res: Response): Promise<string> {
  try {
    const body = (await res.json()) as { error?: unknown };
    if (typeof body.error === "string" && body.error.trim()) return body.error.trim();
  } catch {
    /* non-JSON denial */
  }
  if (res.status === 401) return "Missing master session";
  if (res.status === 403) return "Email not in MASTER_ADMIN_EMAIL allowlist";
  return `Desk replied ${res.status}.`;
}
