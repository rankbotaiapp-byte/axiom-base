/**
 * Niche-specific missed-call recovery demo copy for the interactive storefront sim.
 */
import { resolveCatalogNiche } from "../../config/catalog.ts";
import type { ShopNiche } from "./types.ts";

export type MissedCallScenario = {
  niche: ShopNiche;
  /** Button label. */
  cta: string;
  /** Inbound caller display. */
  caller: string;
  callerPhone: string;
  /** What the emergency inquiry says. */
  inquiry: string;
  /** Automated SMS Axiom would fire. */
  smsReply: string;
  /** Calendar booking confirmation line. */
  booking: string;
  /** Slot shown on the calendar card. */
  slotLabel: string;
};

const SCENARIOS: Partial<Record<ShopNiche, Omit<MissedCallScenario, "niche">>> = {
  plumbing: {
    cta: "Test Your Missed Call Recovery",
    caller: "Jordan Hale",
    callerPhone: "(541) 555-0142",
    inquiry: "Emergency — basement water leak at 214 Oak. Need someone tonight.",
    smsReply:
      "Got it — {business} received your leak call. Tap to book the next emergency slot: {bookUrl}",
    booking: "Emergency leak visit · confirmed",
    slotLabel: "Today · 6:30 PM",
  },
  "water-systems": {
    cta: "Test Your Missed Call Recovery",
    caller: "Sam Rivera",
    callerPhone: "(541) 555-0198",
    inquiry: "Well pressure dropped — no water at the house. Can you come out?",
    smsReply:
      "Axiom caught the call for {business}. Reserve a well/pressure visit here: {bookUrl}",
    booking: "Well pressure check · confirmed",
    slotLabel: "Today · 5:45 PM",
  },
  electrical: {
    cta: "Test Your Missed Call Recovery",
    caller: "Casey Nguyen",
    callerPhone: "(541) 555-0177",
    inquiry: "Partial outage — panel buzzing after the storm. Need help ASAP.",
    smsReply:
      "{business} got your outage request. Grab the next emergency electrical slot: {bookUrl}",
    booking: "Emergency panel check · confirmed",
    slotLabel: "Today · 7:00 PM",
  },
  hvac: {
    cta: "Test Your Missed Call Recovery",
    caller: "Alex Brooks",
    callerPhone: "(541) 555-0114",
    inquiry: "No heat — furnace clicking, house is cold. Same-day?",
    smsReply:
      "Missed-call catch for {business}. Book a same-day HVAC visit: {bookUrl}",
    booking: "Same-day furnace visit · confirmed",
    slotLabel: "Today · 4:15 PM",
  },
  auto: {
    cta: "Test Your Missed Call Recovery",
    caller: "Riley Chen",
    callerPhone: "(541) 555-0163",
    inquiry: "Car won't start in the grocery lot. Need a mobile jump / diagnostic.",
    smsReply:
      "{business} got your roadside request. Pick a mobile bay window: {bookUrl}",
    booking: "Mobile diagnostic · confirmed",
    slotLabel: "Today · 5:00 PM",
  },
  contractor: {
    cta: "Test Your Missed Call Recovery",
    caller: "Morgan Ellis",
    callerPhone: "(541) 555-0129",
    inquiry: "Fence blew down onto the driveway — need a site walk today.",
    smsReply:
      "Axiom booked the missed call for {business}. Claim a site-walk slot: {bookUrl}",
    booking: "Emergency site walk · confirmed",
    slotLabel: "Tomorrow · 8:30 AM",
  },
  roofing: {
    cta: "Test Your Missed Call Recovery",
    caller: "Taylor Quinn",
    callerPhone: "(541) 555-0181",
    inquiry: "Active roof leak into the hallway. Need tarping / inspection.",
    smsReply:
      "{business} caught your leak call. Book the next tarp/inspection window: {bookUrl}",
    booking: "Roof leak triage · confirmed",
    slotLabel: "Today · 3:45 PM",
  },
  security: {
    cta: "Test Your Missed Call Recovery",
    caller: "Jamie Ortiz",
    callerPhone: "(541) 555-0155",
    inquiry: "Locked out of the shop after hours. Need a rekey / entry.",
    smsReply:
      "Missed call recovered for {business}. Open an emergency entry slot: {bookUrl}",
    booking: "Emergency entry · confirmed",
    slotLabel: "Today · 9:15 PM",
  },
};

const DEFAULT: Omit<MissedCallScenario, "niche"> = {
  cta: "Test Your Missed Call Recovery",
  caller: "Chris Morgan",
  callerPhone: "(541) 555-0108",
  inquiry: "Need help today — can someone take this before close?",
  smsReply: "{business} got your request while the line was busy. Book a time: {bookUrl}",
  booking: "Priority visit · confirmed",
  slotLabel: "Today · 5:30 PM",
};

export function missedCallScenarioFor(niche: string, tradeLabel = ""): MissedCallScenario {
  const id = resolveCatalogNiche(niche || tradeLabel);
  if (/lock/i.test(`${tradeLabel} ${niche}`)) {
    return { niche: id, ...(SCENARIOS.security ?? DEFAULT) };
  }
  const base = SCENARIOS[id] ?? DEFAULT;
  return { niche: id, ...base };
}

export function renderMissedCallSms(
  template: string,
  vars: { business: string; bookUrl: string },
): string {
  return template
    .replaceAll("{business}", vars.business)
    .replaceAll("{bookUrl}", vars.bookUrl);
}

export type MissedCallSimStep = "idle" | "ringing" | "inquiry" | "sms" | "booked";

export function nextMissedCallStep(step: MissedCallSimStep): MissedCallSimStep {
  if (step === "idle") return "ringing";
  if (step === "ringing") return "inquiry";
  if (step === "inquiry") return "sms";
  if (step === "sms") return "booked";
  return "booked";
}
