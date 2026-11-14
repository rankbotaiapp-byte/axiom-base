import { getRequest, setCookie } from "@tanstack/react-start/server";
import { env } from "@/lib/env.server";
import { masterKeyUsable, masterKeysMatch, signMasterPass, verifyMasterPass } from "./master-bypass";
import { MASTER_COOKIE, MASTER_MAX_AGE_SECONDS } from "./master-owner";

export function bypassSecret(): string | undefined {
  const value = env("MASTER_ADMIN_BYPASS_KEY");
  return masterKeyUsable(value) ? value : undefined;
}

export function bypassConfigured(): boolean {
  return Boolean(bypassSecret());
}

function readCookie(request: Request): string {
  const raw = request.headers.get("cookie") ?? "";
  const part = raw
    .split(";")
    .map((piece) => piece.trim())
    .find((piece) => piece.startsWith(`${MASTER_COOKIE}=`));
  if (!part) return "";
  const value = part.slice(MASTER_COOKIE.length + 1);
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

export function hasValidMasterCookie(nowSeconds = Math.floor(Date.now() / 1000)): boolean {
  const secret = bypassSecret();
  if (!secret) return false;
  try {
    return verifyMasterPass(secret, readCookie(getRequest()), nowSeconds);
  } catch {
    return false;
  }
}

export function refreshMasterCookie(): void {
  const secret = bypassSecret();
  if (!secret) throw new Error("Master bypass is not configured");
  const request = getRequest();
  const forwarded = request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim();
  const secure = forwarded ? forwarded === "https" : new URL(request.url).protocol === "https:";
  const exp = Math.floor(Date.now() / 1000) + MASTER_MAX_AGE_SECONDS;
  setCookie(MASTER_COOKIE, signMasterPass(secret, exp), {
    path: "/",
    httpOnly: true,
    secure,
    sameSite: "lax",
    maxAge: MASTER_MAX_AGE_SECONDS,
  });
}

export function acceptMasterKey(key: string): boolean {
  const secret = bypassSecret();
  if (!secret || !masterKeyUsable(key)) return false;
  return masterKeysMatch(key, secret);
}

export function readMasterEntry(): { access: "bypass" | "signed-out"; configured: boolean } {
  const configured = bypassConfigured();
  if (configured && hasValidMasterCookie()) {
    refreshMasterCookie();
    return { access: "bypass", configured: true };
  }
  return { access: "signed-out", configured };
}
