import { toE164 } from "./notify-target";

export type HelperIntent = "answer" | "need_contact" | "book";

export type HelperShopContext = {
  shopName: string;
  niche?: string;
  phone?: string;
  cities?: string[];
};

export type HelperTurnInput = HelperShopContext & {
  message: string;
  guestName?: string;
  guestPhone?: string;
};

export type HelperTurn = {
  intent: HelperIntent;
  reply: string;
  guestName: string;
  guestPhone: string;
  service: string;
};

function clean(value: string | undefined, max: number): string {
  return String(value ?? "")
    .replace(/[\u0000-\u001f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
}

export function extractGuestPhone(message: string): string {
  const match = message.match(/(?:\+?1[-.\s]*)?\(?\d{3}\)?[-.\s]*\d{3}[-.\s]*\d{4}/);
  return match ? toE164(match[0]) || "" : "";
}

export function extractGuestName(message: string): string {
  const intro = message.match(/\b(?:i(?:['’]?m| am)|my name is|this is)\s+([A-Za-z][A-Za-z' -]{1,40})/i);
  if (intro?.[1]) return clean(intro[1], 80);
  const booked = message.match(/\bbook(?:\s+me)?\s+([A-Za-z][A-Za-z']{1,40})\b/i);
  const token = booked?.[1] || "";
  if (/^(me|us|a|an|the|for|my)$/i.test(token)) return "";
  return clean(token, 80);
}

export function extractServiceHint(message: string): string {
  const lower = message.toLowerCase();
  if (/\b(panel|breaker|outage|wiring|electric)/i.test(lower)) return "Electrical visit";
  if (/\b(furnace|ac|hvac|heat|cool|air)/i.test(lower)) return "HVAC visit";
  if (/\b(leak|drain|pipe|plumb|water heater|toilet)/i.test(lower)) return "Plumbing visit";
  if (/\b(emergency|asap|right now)\b/i.test(lower)) return "Emergency dispatch";
  return "Booked visit";
}

export function wantsBooking(message: string): boolean {
  return /\b(book|schedule|appointment|dispatch|send (?:a )?tech|come out)\b/i.test(message);
}

export function answerStorefrontQuestion(input: HelperShopContext, message: string): string | null {
  const shop = clean(input.shopName, 80) || "the shop";
  const phone = clean(input.phone, 28);
  const cities = (input.cities ?? []).filter(Boolean).slice(0, 6).join(", ");
  const text = message.toLowerCase();
  if (/\b(hours?|open|when are you|after.?hours)\b/.test(text)) {
    return `${shop} takes bookings around the clock through this page. After-hours jobs go to dispatch${phone ? ` at ${phone}` : ""}.`;
  }
  if (/\b(price|cost|quote|how much)\b/.test(text)) {
    return `Pricing depends on the job. Share what you need and a callback number — ${shop} will confirm a window and a quote before any work starts.`;
  }
  if (/\b(area|cities?|travel|where do you)\b/.test(text)) {
    return cities
      ? `${shop} covers ${cities}. If you are close, book a visit and dispatch will confirm.`
      : `${shop} covers the local service area listed on this page.`;
  }
  if (/\b(licensed|insured|bonded|warranty)\b/.test(text)) {
    return `${shop} is set up as a licensed, insured trade desk on Axiom. Warranties follow the booked job — ask the dispatcher when they confirm.`;
  }
  if (/\b(emergency|flood|no heat|no power|gas)\b/.test(text)) {
    return `If this is urgent, book emergency dispatch now${phone ? ` or call ${phone}` : ""}. A real person confirms the window.`;
  }
  return null;
}

export function handleStorefrontHelperTurn(input: HelperTurnInput): HelperTurn {
  const message = clean(input.message, 500);
  const guestName = clean(input.guestName, 80) || extractGuestName(message);
  const guestPhone = clean(input.guestPhone, 28) || extractGuestPhone(message);
  const service = extractServiceHint(message);
  const faq = answerStorefrontQuestion(input, message);

  if (wantsBooking(message) || (guestPhone && /\b(need|help|come|fix|leak|outage)\b/i.test(message))) {
    if (!guestPhone || guestName.length < 2) {
      return {
        intent: "need_contact",
        reply: `I can lock a visit for ${service.toLowerCase()}. Reply with your name and a mobile number (example: Ada 541-555-0148).`,
        guestName,
        guestPhone,
        service,
      };
    }
    return {
      intent: "book",
      reply: `Locked a request for ${guestName} — ${service}. ${input.shopName || "The shop"} will text and email the owner desk now.`,
      guestName,
      guestPhone,
      service,
    };
  }

  if (faq) {
    return { intent: "answer", reply: faq, guestName, guestPhone, service };
  }

  return {
    intent: "answer",
    reply: `${input.shopName || "Dispatch"} can book a visit or answer hours, service area, and emergency questions. Tell me the job, or share a name and mobile to hold a window.`,
    guestName,
    guestPhone,
    service,
  };
}
