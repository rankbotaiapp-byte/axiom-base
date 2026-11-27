/** Pure 24/7 voice receptionist: grounding, caps, TwiML, slot confirmation. */

import type { ArrivalWindow } from "./slot-windows.ts";
import {
  catalogSpeechLine,
  matchServiceFromSpeech,
  quoteCentsFromBook,
  type PriceBookItem,
} from "./price-book.ts";

export const VOICE_TURN_CENTS = 35;
export const DEFAULT_VOICE_DAILY_CAP_CENTS = 2500;

export type VoiceAnswerMode = "immediate" | "ring_overflow";

export type VoiceSessionState = {
  stage: "greet" | "job" | "slots" | "confirm" | "booked";
  serviceId?: string;
  windowIndex?: 1 | 2;
  quoteCents?: number;
  depositCents?: number;
  spokenQuote?: string;
};

export function parseVoiceAnswerMode(raw: unknown): VoiceAnswerMode {
  return String(raw || "").trim() === "ring_overflow" ? "ring_overflow" : "immediate";
}

export function voiceSpendExceeded(spentCents: number, capCents: number): boolean {
  const cap = capCents > 0 ? capCents : DEFAULT_VOICE_DAILY_CAP_CENTS;
  return spentCents + VOICE_TURN_CENTS > cap;
}

export function escapeTwiml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function shouldFallbackToMissedCallSms(input: {
  booked: boolean;
  capped: boolean;
  disconnected: boolean;
  turns: number;
  maxTurns?: number;
}): boolean {
  if (input.booked) return false;
  if (input.capped || input.disconnected) return true;
  return input.turns >= (input.maxTurns ?? 8);
}

export function parseSlotChoice(speech: string): 1 | 2 | "yes" | "no" | null {
  const t = speech.trim().toLowerCase();
  if (!t) return null;
  if (/^(1|one|first|earliest|today)\b/.test(t) || /\b(first one|option one|window one)\b/.test(t)) return 1;
  if (/^(2|two|second|later|tomorrow)\b/.test(t) || /\b(second one|option two|window two)\b/.test(t)) return 2;
  if (/^(yes|yeah|yep|confirm|book it|lock it|that works|sounds good)\b/.test(t)) return "yes";
  if (/^(no|nope|cancel|stop|different)\b/.test(t)) return "no";
  if (/\b(1|one)\b/.test(t) && !/\b(2|two)\b/.test(t)) return 1;
  if (/\b(2|two)\b/.test(t)) return 2;
  return null;
}

export function matchWindowFromSpeech(windows: ArrivalWindow[], speech: string): ArrivalWindow | null {
  const choice = parseSlotChoice(speech);
  if (choice === 1) return windows[0] ?? null;
  if (choice === 2) return windows[1] ?? windows[0] ?? null;
  const hay = speech.toLowerCase();
  return windows.find((window) => hay.includes(window.label.toLowerCase().slice(0, 12))) ?? null;
}

export function receptionistSystemPrompt(input: {
  shopName: string;
  niche: string;
  catalog: PriceBookItem[];
  windows: ArrivalWindow[];
}): string {
  const slots =
    input.windows.length > 0
      ? input.windows.map((window) => `${window.index}: ${window.label}`).join("; ")
      : "No staff windows are open — take a message and we will text two slots.";
  return [
    `You are the live front desk for ${input.shopName}, a ${input.niche || "local trades"} shop.`,
    `Quote ONLY from this price book: ${catalogSpeechLine(input.catalog)}. Never invent a price.`,
    `Real open appointment windows (is_simulated=false): ${slots}.`,
    `When they confirm a window, say you are locking it and texting a deposit link if a deposit applies.`,
    `Keep replies under 35 words. Do not collect card numbers. If they say stop, end politely.`,
  ].join(" ");
}

export function nextVoiceReply(input: {
  speech: string;
  shopName: string;
  catalog: PriceBookItem[];
  windows: ArrivalWindow[];
  state: VoiceSessionState;
}): { say: string; state: VoiceSessionState; action: "continue" | "book" | "fallback" } {
  const speech = input.speech.trim();
  const state = { ...input.state };
  if (/^(stop|goodbye|hang up)\b/i.test(speech)) {
    return { say: `Thanks for calling ${input.shopName}. We'll text you if a window opens.`, state, action: "fallback" };
  }

  if (state.stage === "greet" || state.stage === "job" || !state.serviceId) {
    const service = matchServiceFromSpeech(input.catalog, speech || "service call");
    if (!service) {
      return {
        say: `This is ${input.shopName}. What's going on — leak, drain, water heater, or something else?`,
        state: { ...state, stage: "job" },
        action: "continue",
      };
    }
    const quote = quoteCentsFromBook(service);
    const slots = input.windows.map((window) => `say ${window.index} for ${window.label}`).join(", or ");
    const slotLine = slots || "I will text you the next two arrival windows";
    return {
      say: `${quote.spoken}. I can lock ${slotLine}. Which works?`,
      state: {
        stage: "slots",
        serviceId: service.id,
        quoteCents: quote.quoteCents,
        depositCents: quote.depositCents,
        spokenQuote: quote.spoken,
      },
      action: "continue",
    };
  }

  if (state.stage === "slots" || state.stage === "confirm") {
    const window = matchWindowFromSpeech(input.windows, speech);
    const yes = parseSlotChoice(speech) === "yes";
    const picked = window || (yes && state.windowIndex ? input.windows[(state.windowIndex || 1) - 1] : null);
    if (!picked) {
      const slots = input.windows.map((row) => `${row.index} ${row.label}`).join(", or ");
      return {
        say: `Please say 1 or 2. Open windows: ${slots || "none until we text you"}.`,
        state: { ...state, stage: "slots" },
        action: "continue",
      };
    }
    return {
      say: `Locking ${picked.label}. I'll text the confirmation${state.depositCents ? " and deposit link" : ""} now.`,
      state: { ...state, stage: "booked", windowIndex: picked.index },
      action: "book",
    };
  }

  return {
    say: `You're booked. Watch your texts from ${input.shopName}.`,
    state: { ...state, stage: "booked" },
    action: "continue",
  };
}

export function buildGatherTwiml(input: {
  say: string;
  actionPath: string;
  hangup?: boolean;
}): string {
  if (input.hangup) {
    return `<?xml version="1.0" encoding="UTF-8"?><Response><Say voice="Polly.Joanna">${escapeTwiml(input.say)}</Say><Hangup/></Response>`;
  }
  return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Gather input="speech dtmf" numDigits="1" speechTimeout="auto" timeout="6" action="${escapeTwiml(input.actionPath)}" method="POST" hints="book,one,two,today,tomorrow,leak,drain,heater,yes,no">
    <Say voice="Polly.Joanna">${escapeTwiml(input.say)}</Say>
  </Gather>
  <Redirect method="POST">${escapeTwiml(input.actionPath)}&amp;empty=1</Redirect>
</Response>`;
}

export function buildConversationRelayTwiml(input: {
  wssUrl: string;
  welcome: string;
  shopId: string;
  callSid: string;
  actionPath: string;
}): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Connect action="${escapeTwiml(input.actionPath)}" method="POST">
    <ConversationRelay url="${escapeTwiml(input.wssUrl)}" welcomeGreeting="${escapeTwiml(input.welcome)}" dtmfDetection="true" interruptible="true" voice="en-US-Journey-D">
      <Parameter name="shopId" value="${escapeTwiml(input.shopId)}" />
      <Parameter name="callSid" value="${escapeTwiml(input.callSid)}" />
    </ConversationRelay>
  </Connect>
</Response>`;
}

export function voiceGreeting(shopName: string): string {
  return `Thanks for calling ${shopName}. This is the live front desk. What's going on today?`;
}
