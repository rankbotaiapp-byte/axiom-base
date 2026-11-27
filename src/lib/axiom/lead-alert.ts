import { formatAxiomPhoneDisplay, nationalDigits } from "./axiom-business-number";

export type LeadAlertInput = {
  shopName: string;
  guestPhone: string;
  guestMessage: string;
  guestName?: string;
  guestEmail?: string;
  holdUntil?: string;
  city?: string;
  service?: string;
};

export type LeadAlertCopy = {
  subject: string;
  body: string;
};

function cleanLine(value: string | undefined, max: number): string {
  return String(value ?? "")
    .replace(/[\u0000-\u001f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
}

function formatWindow(holdUntil?: string): string {
  if (!holdUntil) return "ASAP";
  const date = new Date(holdUntil);
  if (Number.isNaN(date.getTime())) return "ASAP";
  return date.toLocaleString("en-US", { timeZone: "America/Los_Angeles" });
}

export function formatLeadPhone(raw: string): string {
  const digits = nationalDigits(raw);
  if (digits.length === 10) return formatAxiomPhoneDisplay(raw);
  const trimmed = raw.trim();
  return trimmed || "Unknown";
}

/** Owner-facing lead/booking alert: contact lines only when present, no empty slots. */
export function composeLeadAlertCopy(input: LeadAlertInput): LeadAlertCopy {
  const shopName = cleanLine(input.shopName, 80) || "Your shop";
  const phone = formatLeadPhone(input.guestPhone);
  const name = cleanLine(input.guestName, 80);
  const email = cleanLine(input.guestEmail, 120);
  const service = cleanLine(input.service, 80);
  const city = cleanLine(input.city, 80);
  const message = cleanLine(input.guestMessage, 800) || "(no message)";
  const subject = `Lead alert · ${shopName} · ${phone}`;
  const lines = [
    `New customer inquiry for ${shopName}.`,
    "",
    "Customer",
    name ? `Name: ${name}` : null,
    `Phone: ${phone}`,
    email ? `Email: ${email}` : null,
    service ? `Service: ${service}` : null,
    city ? `Area: ${city}` : null,
    `Hold / window: ${formatWindow(input.holdUntil)}`,
    "",
    "Message:",
    message,
    "",
    "Open your admin desk to confirm or reassign.",
    "",
    "— Axiom Dispatch",
  ].filter((line): line is string => line !== null);
  return { subject, body: lines.join("\n") };
}
