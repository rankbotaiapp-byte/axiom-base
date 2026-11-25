import { createHmac, timingSafeEqual } from "node:crypto";

function secret(): string {
  return (
    process.env.OUTREACH_UNSUBSCRIBE_SECRET?.trim() ||
    process.env.BETTER_AUTH_SECRET?.trim() ||
    ""
  );
}

export function unsubscribeSecretConfigured(): boolean {
  return secret().length >= 8;
}

export function signUnsubscribeToken(email: string): string {
  const key = secret();
  if (!key) return "";
  return createHmac("sha256", key).update(email.trim().toLowerCase()).digest("hex").slice(0, 32);
}

export function verifyUnsubscribeToken(email: string, token: string): boolean {
  const expected = signUnsubscribeToken(email);
  if (!expected || !token || expected.length !== token.length) return false;
  try {
    return timingSafeEqual(Buffer.from(expected), Buffer.from(token));
  } catch {
    return false;
  }
}
