import { createHmac, timingSafeEqual } from "node:crypto";

/** Twilio signs the full webhook URL plus sorted POST fields with HMAC-SHA1. */
export function twilioSignaturePayload(url: string, params: Record<string, string>): string {
  const keys = Object.keys(params).sort();
  let data = url;
  for (const key of keys) data += key + params[key];
  return data;
}

export function twilioSignatureDigest(authToken: string, url: string, params: Record<string, string>): string {
  return createHmac("sha1", authToken).update(twilioSignaturePayload(url, params)).digest("base64");
}

export function verifyTwilioSignature(input: {
  authToken: string;
  signature: string;
  url: string;
  params: Record<string, string>;
}): boolean {
  const token = input.authToken.trim();
  const signature = input.signature.trim();
  if (!token || !signature) return false;
  const expected = twilioSignatureDigest(token, input.url, input.params);
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export function paramsFromUrlSearch(form: URLSearchParams): Record<string, string> {
  const params: Record<string, string> = {};
  for (const [key, value] of form.entries()) params[key] = value;
  return params;
}
