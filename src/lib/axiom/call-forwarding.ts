import { nationalDigits } from "./axiom-business-number";
import { toE164 } from "./notify-target";

export type ForwardingCarrierCode = "*71" | "*92" | "*61";

export type ForwardingDialString = {
  code: ForwardingCarrierCode;
  label: string;
  when: string;
  dial: string;
};

/** US 10-digit national number for in-call star codes (no +1). */
export function forwardingNationalNumber(e164: string): string {
  return nationalDigits(e164);
}

/**
 * Conditional (missed / busy / no-answer) forwarding so the truck number stays
 * printed as-is. Unconditional *72 is omitted — that would take over every call.
 */
export function conditionalForwardingCodes(e164: string): ForwardingDialString[] {
  const national = forwardingNationalNumber(e164);
  if (national.length !== 10 || !toE164(e164)) return [];
  return [
    {
      code: "*71",
      label: "Busy / missed",
      when: "Verizon and many US lines — forward when you are on another call.",
      dial: `*71${national}`,
    },
    {
      code: "*92",
      label: "No answer",
      when: "Verizon — forward when the truck line rings out.",
      dial: `*92${national}`,
    },
    {
      code: "*61",
      label: "After-hours / no answer",
      when: "AT&T and GSM — forward unanswered and after-hours rings.",
      dial: `*61${national}`,
    },
  ];
}
