import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { MASTER_KEY_MIN } from "./master-owner.ts";

/** Hash both sides so a length mismatch cannot shortcut the compare. */
export function masterKeysMatch(provided: string, expected: string): boolean {
  const left = createHash("sha256").update(provided).digest();
  const right = createHash("sha256").update(expected).digest();
  return timingSafeEqual(left, right);
}

export function masterKeyUsable(key: string | undefined): key is string {
  return typeof key === "string" && key.length >= MASTER_KEY_MIN && key.length <= 200;
}

/** Signed pass. The raw owner key never goes into the cookie. */
export function signMasterPass(secret: string, expSeconds: number): string {
  const payload = `v1.${expSeconds}`;
  const mac = createHmac("sha256", secret).update(payload).digest("base64url");
  return `${payload}.${mac}`;
}

export function verifyMasterPass(secret: string, token: string, nowSeconds: number): boolean {
  const parts = token.split(".");
  if (parts.length !== 3) return false;
  const [version, expRaw, mac] = parts;
  if (version !== "v1" || !expRaw || !mac) return false;
  if (!/^\d+$/.test(expRaw)) return false;
  const exp = Number(expRaw);
  if (!Number.isSafeInteger(exp) || exp <= nowSeconds) return false;
  const expected = createHmac("sha256", secret).update(`v1.${expRaw}`).digest("base64url");
  const left = Buffer.from(mac);
  const right = Buffer.from(expected);
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}
