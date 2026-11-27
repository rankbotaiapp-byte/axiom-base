/** Pure Autopilot approval-queue state machine. Silence never auto-approves. */

import { GEAR_GUARDIAN_BPS } from "./merchant-pricing.ts";
import { DEFAULT_TREASURY_CAPS } from "./growth-engine.ts";

export const PROPOSAL_STATUSES = [
  "pending",
  "approved",
  "disapproved",
  "executed",
  "expired",
  "failed",
] as const;
export type ProposalStatus = (typeof PROPOSAL_STATUSES)[number];

export const PROPOSAL_CATEGORIES = [
  "self_heal_patch",
  "seasonal_campaign",
  "budget_cap_change",
  "public_creative",
] as const;
export type ProposalCategory = (typeof PROPOSAL_CATEGORIES)[number];

export const RISK_LEVELS = ["low", "medium", "high", "critical"] as const;
export type RiskLevel = (typeof RISK_LEVELS)[number];

export const HARD_TREASURY_CEILINGS = {
  twilioDailyCapCents: 8000,
  resendDailyCapCents: 2000,
  aiDailyCapCents: 5000,
  totalDailyCapCents: 12000,
} as const;

export const DEFAULT_PROPOSAL_TTL_MS = 24 * 60 * 60 * 1000;
export const MAX_CAMPAIGN_BATCH = 40;

export type SandboxChecks = {
  tsc: boolean;
  unitTests: boolean;
  verifyE2e: boolean;
};

export type ProposalPayload = Record<string, unknown>;

export type ProposalDraft = {
  category: ProposalCategory;
  title: string;
  summary: string;
  evidence: Record<string, unknown>;
  proposedPayload: ProposalPayload;
  estimatedCostCents: number;
  riskLevel: RiskLevel;
  sandboxChecks: SandboxChecks;
  expiresAt: string;
  fingerprint: string;
};

export type ProposalRecord = ProposalDraft & {
  id: string;
  status: ProposalStatus;
  sandboxChecksPassed: boolean;
  rejectionReason: string;
  executionLock: string | null;
  decidedBy: string;
};

export function parseProposalStatus(raw: unknown): ProposalStatus | null {
  const value = String(raw || "").trim();
  return (PROPOSAL_STATUSES as readonly string[]).includes(value) ? (value as ProposalStatus) : null;
}

export function parseProposalCategory(raw: unknown): ProposalCategory | null {
  const value = String(raw || "").trim();
  return (PROPOSAL_CATEGORIES as readonly string[]).includes(value) ? (value as ProposalCategory) : null;
}

export function parseRiskLevel(raw: unknown): RiskLevel {
  const value = String(raw || "").trim();
  return (RISK_LEVELS as readonly string[]).includes(value) ? (value as RiskLevel) : "medium";
}

export function sandboxChecksPassed(checks: SandboxChecks): boolean {
  return Boolean(checks.tsc && checks.unitTests && checks.verifyE2e);
}

export function executionSandboxOk(
  category: ProposalCategory,
  checks: SandboxChecks,
  payload: ProposalPayload,
): boolean {
  if (category !== "self_heal_patch") return true;
  if (String(payload.action || "") === "pause_outbound") return Boolean(checks.tsc && checks.unitTests);
  return sandboxChecksPassed(checks);
}

export function parseSandboxChecks(raw: unknown): SandboxChecks {
  const row = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  return {
    tsc: row.tsc === true,
    unitTests: row.unitTests === true || row.unit_tests === true,
    verifyE2e: row.verifyE2e === true || row.verify_e2e === true,
  };
}

export function proposalFingerprint(category: ProposalCategory, title: string, payload: ProposalPayload): string {
  return `${category}|${title.trim().toLowerCase()}|${stablePayload(payload)}`.slice(0, 240);
}

function stablePayload(payload: ProposalPayload): string {
  try {
    return JSON.stringify(payload, Object.keys(payload).sort());
  } catch {
    return "";
  }
}

export function emptySandbox(): SandboxChecks {
  return { tsc: false, unitTests: false, verifyE2e: false };
}

export type InvariantResult = { ok: true } | { ok: false; reason: string };

export function assertConnectFeeInvariant(payload: ProposalPayload): InvariantResult {
  if (payload.connectFeeBps == null && payload.gear_guardian_bps == null) return { ok: true };
  const bps = Number(payload.connectFeeBps ?? payload.gear_guardian_bps);
  if (bps !== GEAR_GUARDIAN_BPS) {
    return { ok: false, reason: "Connect fee must stay 1.5% (150 bps)" };
  }
  return { ok: true };
}

export function assertStopHelpCompliance(text: string): InvariantResult {
  const body = text.trim();
  if (!body) return { ok: true };
  if (!/\bstop\b/i.test(body) || !/\bhelp\b/i.test(body)) {
    return { ok: false, reason: "SMS/ad copy must include STOP and HELP" };
  }
  return { ok: true };
}

export function assertHardCapCeilings(payload: ProposalPayload): InvariantResult {
  const twilio = Number(payload.twilioDailyCapCents ?? payload.twilio_daily_cap_cents);
  const resend = Number(payload.resendDailyCapCents ?? payload.resend_daily_cap_cents);
  const ai = Number(payload.aiDailyCapCents ?? payload.ai_daily_cap_cents);
  const total = Number(payload.totalDailyCapCents ?? payload.total_daily_cap_cents);
  if (Number.isFinite(twilio) && twilio > HARD_TREASURY_CEILINGS.twilioDailyCapCents) {
    return { ok: false, reason: "Twilio cap exceeds hard ceiling" };
  }
  if (Number.isFinite(resend) && resend > HARD_TREASURY_CEILINGS.resendDailyCapCents) {
    return { ok: false, reason: "Resend cap exceeds hard ceiling" };
  }
  if (Number.isFinite(ai) && ai > HARD_TREASURY_CEILINGS.aiDailyCapCents) {
    return { ok: false, reason: "AI cap exceeds hard ceiling" };
  }
  if (Number.isFinite(total) && total > HARD_TREASURY_CEILINGS.totalDailyCapCents) {
    return { ok: false, reason: "Total cap exceeds hard ceiling" };
  }
  return { ok: true };
}

export function validateProposalInvariants(category: ProposalCategory, payload: ProposalPayload): InvariantResult {
  const fee = assertConnectFeeInvariant(payload);
  if (!fee.ok) return fee;
  const copy = String(payload.body || payload.smsPreview || payload.diff || "");
  const notices = assertStopHelpCompliance(copy);
  if (!notices.ok) return notices;
  if (category === "budget_cap_change") {
    const caps = assertHardCapCeilings(payload);
    if (!caps.ok) return caps;
  }
  if (category === "seasonal_campaign") {
    const batch = Number(payload.batchSize ?? payload.batch_size) || 0;
    if (batch > MAX_CAMPAIGN_BATCH) return { ok: false, reason: "Batch size exceeds 40" };
  }
  if (category === "self_heal_patch") {
    const action = String(payload.action || "");
    if (action === "apply_diff" || action === "replace_file") {
      return { ok: false, reason: "Filesystem patches cannot execute from the queue" };
    }
    if (action && action !== "pause_outbound" && action !== "set_pitch_angle") {
      return { ok: false, reason: `Unknown self-heal action ${action}` };
    }
  }
  return { ok: true };
}

export function draftProposal(input: {
  category: ProposalCategory;
  title: string;
  summary: string;
  evidence?: Record<string, unknown>;
  proposedPayload: ProposalPayload;
  estimatedCostCents?: number;
  riskLevel?: RiskLevel;
  sandboxChecks?: SandboxChecks;
  now?: Date;
  ttlMs?: number;
}): ProposalDraft {
  const now = input.now ?? new Date();
  const ttl = input.ttlMs ?? DEFAULT_PROPOSAL_TTL_MS;
  const sandboxChecks = input.sandboxChecks ?? emptySandbox();
  return {
    category: input.category,
    title: input.title.slice(0, 160),
    summary: input.summary.slice(0, 800),
    evidence: input.evidence || {},
    proposedPayload: input.proposedPayload,
    estimatedCostCents: Math.max(0, Math.round(input.estimatedCostCents || 0)),
    riskLevel: input.riskLevel || "medium",
    sandboxChecks,
    expiresAt: new Date(now.getTime() + ttl).toISOString(),
    fingerprint: proposalFingerprint(input.category, input.title, input.proposedPayload),
  };
}

export function isExpired(expiresAt: string, now: Date): boolean {
  return new Date(expiresAt).getTime() <= now.getTime();
}

export type ClaimResult =
  | { ok: true; status: "approved" }
  | { ok: false; status: ProposalStatus; reason: string };

export function claimApprove(status: ProposalStatus, expiresAt: string, now: Date): ClaimResult {
  if (status === "executed" || status === "approved") {
    return { ok: false, status, reason: "already decided" };
  }
  if (status !== "pending") {
    return { ok: false, status, reason: `cannot approve from ${status}` };
  }
  if (isExpired(expiresAt, now)) {
    return { ok: false, status: "expired", reason: "proposal expired — silence does not approve" };
  }
  return { ok: true, status: "approved" };
}

export function claimDisapprove(status: ProposalStatus): ClaimResult {
  if (status === "disapproved") return { ok: false, status, reason: "already decided" };
  if (status !== "pending") return { ok: false, status, reason: `cannot disapprove from ${status}` };
  return { ok: true, status: "approved" };
}

export function expireIfNeeded(status: ProposalStatus, expiresAt: string, now: Date): ProposalStatus {
  if (status === "pending" && isExpired(expiresAt, now)) return "expired";
  return status;
}

const RISK_WEIGHT: Record<RiskLevel, number> = { critical: 40, high: 30, medium: 18, low: 8 };

export function proposalUrgency(row: {
  riskLevel: RiskLevel;
  estimatedCostCents: number;
  expiresAt: string;
  category: ProposalCategory;
}, now: Date): number {
  const hoursLeft = (new Date(row.expiresAt).getTime() - now.getTime()) / 3_600_000;
  const soon = hoursLeft < 6 ? 16 : hoursLeft < 12 ? 8 : 0;
  const cat = row.category === "self_heal_patch" ? 12 : row.category === "budget_cap_change" ? 8 : 4;
  return RISK_WEIGHT[row.riskLevel] + Math.min(24, row.estimatedCostCents / 250) + soon + cat;
}

export function sortPending<T extends { riskLevel: RiskLevel; estimatedCostCents: number; expiresAt: string; category: ProposalCategory }>(
  rows: T[],
  now: Date,
): T[] {
  return [...rows].sort((a, b) => proposalUrgency(b, now) - proposalUrgency(a, now));
}

export function requireDeskActor(attached: boolean): InvariantResult {
  if (!attached) return { ok: false, reason: "master desk authentication required" };
  return { ok: true };
}

export function capsIncreaseSpend(
  current: typeof DEFAULT_TREASURY_CAPS,
  next: Partial<typeof DEFAULT_TREASURY_CAPS>,
): boolean {
  return (
    (next.twilioDailyCapCents ?? current.twilioDailyCapCents) > current.twilioDailyCapCents ||
    (next.resendDailyCapCents ?? current.resendDailyCapCents) > current.resendDailyCapCents ||
    (next.aiDailyCapCents ?? current.aiDailyCapCents) > current.aiDailyCapCents ||
    (next.totalDailyCapCents ?? current.totalDailyCapCents) > current.totalDailyCapCents
  );
}

export type MemoryProposal = ProposalRecord;

/** In-memory queue for unit tests — same claim/idempotency rules as SQL. */
export class AutopilotProposalStore {
  rows = new Map<string, MemoryProposal>();
  rejectedFingerprints: string[] = [];

  insert(row: MemoryProposal): MemoryProposal {
    if (row.status === "pending") {
      for (const existing of this.rows.values()) {
        if (existing.status === "pending" && existing.fingerprint === row.fingerprint) {
          return existing;
        }
      }
    }
    this.rows.set(row.id, { ...row });
    return this.rows.get(row.id)!;
  }

  approve(id: string, now: Date, actor: { desk: boolean }): MemoryProposal {
    const auth = requireDeskActor(actor.desk);
    if (!auth.ok) throw new Error(auth.reason);
    const row = this.rows.get(id);
    if (!row) throw new Error("unknown proposal");
    const claim = claimApprove(row.status, row.expiresAt, now);
    if (!claim.ok) {
      if (row.status === "executed") return row;
      if (claim.status === "expired") {
        row.status = "expired";
        return row;
      }
      throw new Error(claim.reason);
    }
    if (row.executionLock) return row;
    const invariants = validateProposalInvariants(row.category, row.proposedPayload);
    if (!invariants.ok) {
      row.status = "failed";
      row.rejectionReason = invariants.reason;
      return row;
    }
    if (!executionSandboxOk(row.category, row.sandboxChecks, row.proposedPayload)) {
      row.status = "failed";
      row.rejectionReason = "sandbox checks (tsc, unit tests, verify:e2e) must pass";
      return row;
    }
    row.executionLock = `lock_${row.id}`;
    row.status = "executed";
    row.decidedBy = "master";
    return row;
  }

  disapprove(id: string, reason: string, actor: { desk: boolean }): MemoryProposal {
    const auth = requireDeskActor(actor.desk);
    if (!auth.ok) throw new Error(auth.reason);
    const row = this.rows.get(id);
    if (!row) throw new Error("unknown proposal");
    const claim = claimDisapprove(row.status);
    if (!claim.ok) {
      if (row.status === "disapproved") return row;
      throw new Error(claim.reason);
    }
    row.status = "disapproved";
    row.rejectionReason = reason.slice(0, 240);
    row.decidedBy = "master";
    this.rejectedFingerprints.push(row.fingerprint);
    return row;
  }

  sweepExpired(now: Date): void {
    for (const row of this.rows.values()) {
      row.status = expireIfNeeded(row.status, row.expiresAt, now);
    }
  }
}
