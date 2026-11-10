import { createHmac, timingSafeEqual } from "node:crypto";
import { toE164 } from "./notify-target.ts";

export const VAPI_COMPLETION_TYPES = new Set(["end-of-call-report", "end-of-call", "call.ended"]);

export type VapiCallCompletion = {
  callId: string;
  callerName: string;
  callerPhone: string;
  requestedService: string;
  transcript: string;
  niche: string;
};

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : null;
}

function clip(value: unknown, max: number): string {
  if (typeof value !== "string" && typeof value !== "number") return "";
  return String(value)
    .replace(/[\u0000-\u001f]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
}

function pick(record: Record<string, unknown> | null, keys: readonly string[], max: number): string {
  if (!record) return "";
  for (const key of keys) {
    const next = clip(record[key], max);
    if (next) return next;
  }
  return "";
}

function transcriptFromArtifact(artifact: Record<string, unknown> | null): string {
  if (!artifact) return "";
  const direct = clip(artifact.transcript, 8000);
  if (direct) return direct;
  const messages = artifact.messages;
  if (!Array.isArray(messages)) return "";
  const lines: string[] = [];
  for (const row of messages) {
    const item = asRecord(row);
    if (!item) continue;
    const role = clip(item.role, 24) || "speaker";
    const text = clip(item.message ?? item.content, 500);
    if (text) lines.push(`${role}: ${text}`);
    if (lines.join("\n").length > 8000) break;
  }
  return lines.join("\n").slice(0, 8000);
}

function serviceFromTranscript(transcript: string): string {
  const match = transcript.match(/\b(?:book|need|want|schedule)\s+(?:an?\s+)?([a-z][a-z0-9 &-]{2,40})/i);
  return match?.[1]?.trim().slice(0, 80) ?? "";
}

function nameFromTranscript(transcript: string): string {
  const match = transcript.match(/\b(?:my name is|this is|i am)\s+([A-Za-z][A-Za-z' -]{1,60})/i);
  return match?.[1]?.trim().replace(/[.,].*$/, "").slice(0, 80) ?? "";
}

export function parseVapiCompletion(payload: unknown): VapiCallCompletion | null {
  const root = asRecord(payload);
  if (!root) return null;
  const message = asRecord(root.message) ?? root;
  const type = clip(message.type, 80).toLowerCase();
  if (!VAPI_COMPLETION_TYPES.has(type)) return null;

  const call = asRecord(message.call) ?? asRecord(root.call);
  const customer = asRecord(message.customer) ?? asRecord(call?.customer) ?? asRecord(root.customer);
  const analysis = asRecord(message.analysis) ?? asRecord(root.analysis);
  const structured = asRecord(analysis?.structuredData) ?? asRecord(analysis?.structured_data);
  const artifact = asRecord(message.artifact) ?? asRecord(root.artifact);
  const transcript = transcriptFromArtifact(artifact) || clip(message.transcript, 8000);

  const callId = pick(call, ["id", "callId"], 80) || pick(message, ["callId", "call_id"], 80);
  if (!callId) return null;

  const rawPhone =
    pick(customer, ["number", "phone", "phoneNumber"], 32) ||
    pick(structured, ["phone", "phoneNumber", "callerPhone"], 32);
  const callerPhone = toE164(rawPhone) ?? rawPhone.slice(0, 20);

  const callerName =
    pick(structured, ["name", "customerName", "callerName", "fullName"], 80) ||
    pick(customer, ["name"], 80) ||
    nameFromTranscript(transcript);

  const requestedService =
    pick(structured, ["service", "requestedService", "appointmentType"], 80) ||
    serviceFromTranscript(transcript);

  const niche = pick(structured, ["niche", "trade"], 80).toLowerCase().replace(/[^a-z0-9-]+/g, "-") || "voice";

  return {
    callId,
    callerName,
    callerPhone,
    requestedService,
    transcript,
    niche: niche.slice(0, 80) || "voice",
  };
}

function sameLength(left: string, right: string): boolean {
  return left.length === right.length && left.length > 0;
}

export function vapiSignatureMatches(rawBody: string, headerValue: string, secret: string): boolean {
  const header = headerValue.trim();
  const key = secret.trim();
  if (!header || !key) return false;
  if (sameLength(header, key)) {
    return timingSafeEqual(Buffer.from(header), Buffer.from(key));
  }
  const digest = createHmac("sha256", key).update(rawBody).digest("hex");
  const given = header.replace(/^sha256=/i, "").trim();
  if (!sameLength(given, digest)) return false;
  return timingSafeEqual(Buffer.from(given), Buffer.from(digest));
}

export function readVapiSignature(request: Request): string {
  return (
    request.headers.get("x-vapi-secret") ||
    request.headers.get("x-vapi-signature") ||
    request.headers.get("x-hmac-signature") ||
    ""
  );
}
