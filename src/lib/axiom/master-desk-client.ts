"use client";

import { authClient, getBearerToken } from "@/lib/auth/client";

/** Same-origin desk calls. Cookies ride along, and the Better Auth session token is sent as a bearer when one exists. */
export async function masterDeskFetch(input: string, init: RequestInit = {}): Promise<Response> {
  const headers = new Headers(init.headers);
  let token = getBearerToken();
  if (!token) {
    try {
      const session = await authClient.getSession();
      token = session.data?.session?.token ?? null;
    } catch {
      token = null;
    }
  }
  if (token) headers.set("Authorization", `Bearer ${token}`);
  return fetch(input, { ...init, credentials: "include", headers });
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
