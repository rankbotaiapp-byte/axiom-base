/** Short hooks layered onto saved templates — does not reset active drip bodies. */

export const OUTREACH_PITCH_ANGLE_IDS = [
  "missed_call",
  "after_hours",
  "founder_video",
  "trial_autopilot",
] as const;

export type OutreachPitchAngleId = (typeof OUTREACH_PITCH_ANGLE_IDS)[number];

export type OutreachPitchAngle = {
  id: OutreachPitchAngleId;
  label: string;
  smsHook: string;
  emailOpener: string;
};

export const OUTREACH_PITCH_ANGLES: OutreachPitchAngle[] = [
  {
    id: "missed_call",
    label: "Missed call → booked job",
    smsHook: "Missed calls in {county} still book elsewhere. Your page answers first:",
    emailOpener: "While you're on a callout, homeowners still ring — and walk if nobody texts back.",
  },
  {
    id: "after_hours",
    label: "After-hours dispatch",
    smsHook: "After-hours jobs in {city} need a live booker. Preview your 24/7 desk:",
    emailOpener: "Your shop can stay open nights without you on the phone.",
  },
  {
    id: "founder_video",
    label: "Eric welcome film",
    smsHook: "Eric recorded a 60s brief on why we built Axiom for trades. Watch, then claim:",
    emailOpener: "Face-to-camera first — then your trade film and live booking:",
  },
  {
    id: "trial_autopilot",
    label: "$1 trial + autopilot",
    smsHook: "$1 trial · AI books while you work · $150/mo autopilot. Your preview:",
    emailOpener: "$1 trial. Instant AI booking. Autopilot fills the pipeline at $150/mo after day 14.",
  },
];

export const DEFAULT_PITCH_ANGLE_ID: OutreachPitchAngleId = "founder_video";

export function parsePitchAngleId(raw: unknown): OutreachPitchAngleId {
  const id = String(raw ?? "").trim();
  return OUTREACH_PITCH_ANGLE_IDS.includes(id as OutreachPitchAngleId)
    ? (id as OutreachPitchAngleId)
    : DEFAULT_PITCH_ANGLE_ID;
}

export function pitchAngleById(id: OutreachPitchAngleId): OutreachPitchAngle {
  return OUTREACH_PITCH_ANGLES.find((row) => row.id === id) ?? OUTREACH_PITCH_ANGLES[0]!;
}

export function applyPitchAngleToSms(
  body: string,
  angleId: OutreachPitchAngleId | undefined,
  tokens: { city?: string; county?: string },
): string {
  const angle = pitchAngleById(parsePitchAngleId(angleId));
  const hook = angle.smsHook
    .replace(/\{city\}/g, tokens.city || "your area")
    .replace(/\{county\}/g, tokens.county || tokens.city || "the county");
  if (body.startsWith(hook.slice(0, 24))) return body.slice(0, 480);
  return `${hook}\n${body}`.slice(0, 480);
}

export function applyPitchAngleToEmail(
  body: string,
  angleId: OutreachPitchAngleId | undefined,
  tokens: { city?: string; county?: string },
): string {
  const angle = pitchAngleById(parsePitchAngleId(angleId));
  const opener = angle.emailOpener
    .replace(/\{city\}/g, tokens.city || "your area")
    .replace(/\{county\}/g, tokens.county || tokens.city || "the county");
  if (body.includes(opener.slice(0, 28))) return body.slice(0, 4000);
  return `${opener}\n\n${body}`.slice(0, 4000);
}