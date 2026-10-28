import { isEmailReady } from "./funnel.ts";

export type AutopilotMode = "simulation" | "live";

export type AutopilotLead = {
  id: string;
  leadSlug: string;
  businessName: string;
  city: string;
  county: string;
  tradeType: string;
  email: string;
  phone: string;
};

export type AutopilotProposal = {
  mode: AutopilotMode;
  totalLeads: number;
  dailySent: number;
  remainingQueue: number;
  county: string;
  tradeType: string;
  tradeLabel: string;
  emailCount: number;
  smsCount: number;
  summary: string;
};

/** A listed phone can take the SMS side of a simulated batch. */
export function hasListedPhone(phone: string): boolean {
  return phone.replace(/\D/g, "").length >= 10;
}

/**
 * Email-only and SMS-only leads stay on their channel.
 * Leads with both go to whichever side is smaller, so the batch stays balanced.
 */
export function balanceChannels<T extends { email: string; phone: string }>(leads: readonly T[]): {
  email: T[];
  sms: T[];
} {
  const email: T[] = [];
  const sms: T[] = [];
  const both: T[] = [];
  for (const lead of leads) {
    const emailReady = isEmailReady(lead.email);
    const smsReady = hasListedPhone(lead.phone);
    if (emailReady && smsReady) both.push(lead);
    else if (emailReady) email.push(lead);
    else if (smsReady) sms.push(lead);
  }
  for (const lead of both) {
    if (email.length <= sms.length) email.push(lead);
    else sms.push(lead);
  }
  return { email, sms };
}

export function formulateProposal(input: {
  mode: AutopilotMode;
  totalLeads: number;
  dailySent: number;
  remainingQueue: number;
  county: string;
  tradeLabel: string;
  emailCount: number;
  smsCount: number;
}): string {
  const hold =
    input.mode === "live"
      ? "Live mode is on. Approving places the batch on the queue."
      : "Simulation is on. Approving places the batch on the queue and does not send email or SMS.";
  if (!input.county || input.emailCount + input.smsCount === 0) {
    return `No contactable unclaimed leads are waiting in the local counties. ${input.totalLeads.toLocaleString("en-US")} leads are on file, ${input.dailySent.toLocaleString("en-US")} went out today, and ${input.remainingQueue.toLocaleString("en-US")} remain unclaimed. ${hold}`;
  }
  return `${input.county} ${input.tradeLabel}: ${input.emailCount.toLocaleString("en-US")} email and ${input.smsCount.toLocaleString("en-US")} SMS. ${input.totalLeads.toLocaleString("en-US")} leads are on file, ${input.dailySent.toLocaleString("en-US")} went out today, and ${input.remainingQueue.toLocaleString("en-US")} remain unclaimed. ${hold}`;
}
