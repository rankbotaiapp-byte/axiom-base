import { isNotifyEmail, toE164 } from "./notify-target.ts";
import { outreachMayCallProviders, type OutreachMode } from "./outreach-queue.ts";

export function consumerOutreachCopy(input: {
  shopName: string;
  city: string;
  consumerName: string;
  bookingCta: string;
  bookUrl: string;
}): { subject: string; body: string } {
  const shop = input.shopName.trim() || "your local shop";
  const city = input.city.trim();
  const first = input.consumerName.trim().split(/\s+/)[0] || "there";
  const cta = input.bookingCta.trim() || "Book a time";
  const subject = city ? `${shop} in ${city}` : shop;
  const where = city ? ` in ${city}` : "";
  return {
    subject,
    body: `Hi ${first}, ${shop} has time${where}. ${cta}: ${input.bookUrl}`,
  };
}

/** Email when the contact looks like one. Otherwise a dialable phone. */
export function consumerLeadChannel(
  email: string,
  phone: string,
  contact: string,
): { channel: "email" | "sms"; to: string } | null {
  const mail = [email, contact].map((value) => value.trim()).find((value) => isNotifyEmail(value));
  if (mail) return { channel: "email", to: mail };
  const dial = [phone, contact].map((value) => toE164(value)).find((value): value is string => Boolean(value));
  if (dial) return { channel: "sms", to: dial };
  return null;
}

/**
 * Simulation counts every claimed lead as sent and leaves them contacted.
 * Live keeps contacted only when the provider accepted the message.
 */
export function campaignOutcome(
  mode: OutreachMode,
  rows: { id: string; delivered: boolean }[],
): { sent: number; retryIds: string[] } {
  if (!outreachMayCallProviders(mode)) return { sent: rows.length, retryIds: [] };
  const retryIds = rows.filter((row) => !row.delivered).map((row) => row.id);
  return { sent: rows.length - retryIds.length, retryIds };
}
