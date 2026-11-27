import { toE164 } from "./notify-target";
import { isStorefrontUnlockPayment } from "./hydrate-storefront";

export type UnlockWelcomeDecision = "send" | "already" | "suppressed" | "no_phone";

export function unlockWelcomeSms(shopName: string): string {
  const name = shopName.replace(/\s+/g, " ").trim() || "your shop";
  return [
    `Axiom is live for ${name} — your $1 desk is unlocked (this text is proof of life).`,
    "Try a test command: QUOTE 350 8126 Water heater flush or OMW 8126.",
    "Reply STOP to opt out. Reply HELP for help.",
  ].join(" ");
}

export function ownerNotifyPhone(
  ...candidates: Array<string | null | undefined>
): string | null {
  for (const raw of candidates) {
    const phone = toE164(String(raw || ""));
    if (phone) return phone;
  }
  return null;
}

export function decideUnlockWelcomeSms(input: {
  alreadySent: boolean;
  ownerE164: string | null;
  suppressed: boolean;
}): UnlockWelcomeDecision {
  if (input.alreadySent) return "already";
  if (!input.ownerE164) return "no_phone";
  if (input.suppressed) return "suppressed";
  return "send";
}

export function isPaidStorefrontUnlockSession(object: {
  amount_total?: number;
  payment_status?: string;
  metadata?: Record<string, string> | null;
} | null | undefined): boolean {
  if (!object) return false;
  return isStorefrontUnlockPayment({
    kind: object.metadata?.kind || "",
    amountCents: Number(object.amount_total) || 0,
    paymentStatus: object.payment_status || "",
  });
}

export async function deliverUnlockWelcomeSms(input: {
  alreadySent: boolean;
  ownerE164: string | null;
  suppressed: boolean;
  shopName: string;
  claim: () => Promise<boolean>;
  send: (body: string) => Promise<boolean>;
}): Promise<{ sent: boolean; reason: UnlockWelcomeDecision | "send_failed" }> {
  const decision = decideUnlockWelcomeSms(input);
  if (decision === "already" || decision === "no_phone") {
    return { sent: false, reason: decision };
  }
  const claimed = await input.claim();
  if (!claimed) return { sent: false, reason: "already" };
  if (decision === "suppressed") return { sent: false, reason: "suppressed" };
  const ok = await input.send(unlockWelcomeSms(input.shopName));
  if (!ok) return { sent: false, reason: "send_failed" };
  return { sent: true, reason: "send" };
}
