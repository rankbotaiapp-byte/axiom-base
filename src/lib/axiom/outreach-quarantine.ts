/** Pure helpers for Autopilot lead quarantine (STOP / bounce / complaint). */

export type QuarantineChannel = "sms" | "email" | "any";

export type QuarantineReason =
  | "opt_out"
  | "bounce"
  | "complaint"
  | "undelivered"
  | "failed";

export type QuarantineSource = "twilio" | "resend" | "inbound" | "system";

export function normalizeQuarantineDestination(channel: QuarantineChannel, raw: string): string {
  const value = raw.trim();
  if (!value) return "";
  if (channel === "email" || value.includes("@")) return value.toLowerCase().slice(0, 160);
  const digits = value.replace(/\D/g, "");
  if (digits.length >= 10) return digits.slice(-10);
  return value.slice(0, 40);
}

export function quarantineReasonFromTelemetry(eventType: string, errorCode = ""): QuarantineReason | null {
  const type = eventType.trim().toLowerCase().replace(/^email\./, "");
  const code = errorCode.trim().toLowerCase();
  if (type === "bounced" || type === "bounce") return "bounce";
  if (type === "complained" || type === "complaint") return "complaint";
  if (type === "undelivered") return "undelivered";
  if (type === "failed" && (code === "30007" || code === "30003" || code === "30005" || code === "30006")) {
    return "failed";
  }
  return null;
}

export function shouldQuarantineTelemetry(eventType: string, errorCode = ""): boolean {
  return quarantineReasonFromTelemetry(eventType, errorCode) != null;
}
