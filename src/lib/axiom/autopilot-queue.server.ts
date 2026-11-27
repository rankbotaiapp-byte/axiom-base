import { getSql } from "@/lib/db";
import { newId } from "@/lib/utils";
import { AutopilotError, assertAutopilotDesk } from "./autopilot.server";
import {
  claimApprove,
  claimDisapprove,
  draftProposal,
  expireIfNeeded,
  parseProposalCategory,
  parseProposalStatus,
  parseRiskLevel,
  parseSandboxChecks,
  executionSandboxOk,
  sandboxChecksPassed,
  sortPending,
  validateProposalInvariants,
  type ProposalCategory,
  type ProposalDraft,
  type ProposalPayload,
  type ProposalStatus,
  type RiskLevel,
  type SandboxChecks,
} from "./autopilot-queue.ts";
import { DEFAULT_TREASURY_CAPS, parsePitchVariant, pickSeasonalNiche } from "./growth-engine.ts";
import { GEAR_GUARDIAN_BPS } from "./merchant-pricing.ts";
import { SMS_TCPA_FOOTER } from "./legal-notices.ts";

type Row = {
  id: string;
  category: string;
  status: string;
  title: string;
  summary: string;
  evidence: Record<string, unknown> | string;
  proposed_payload: Record<string, unknown> | string;
  estimated_cost_cents: number;
  risk_level: string;
  sandbox_checks: SandboxChecks | string;
  sandbox_checks_passed: boolean;
  expires_at: string;
  fingerprint: string;
  rejection_reason: string;
  execution_lock: string | null;
  execution_result: Record<string, unknown> | string;
  decided_at: string | null;
  decided_by: string;
  executed_at: string | null;
  created_at: string;
};

function jsonObj(value: unknown): Record<string, unknown> {
  if (value && typeof value === "object" && !Array.isArray(value)) return value as Record<string, unknown>;
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value) as unknown;
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) return parsed as Record<string, unknown>;
    } catch {
      return {};
    }
  }
  return {};
}

function publicRow(row: Row) {
  const sandbox = parseSandboxChecks(jsonObj(row.sandbox_checks));
  return {
    id: row.id,
    category: parseProposalCategory(row.category) || "self_heal_patch",
    status: parseProposalStatus(row.status) || "pending",
    title: row.title,
    summary: row.summary,
    evidence: jsonObj(row.evidence),
    proposedPayload: jsonObj(row.proposed_payload),
    estimatedCostCents: Number(row.estimated_cost_cents) || 0,
    riskLevel: parseRiskLevel(row.risk_level),
    sandboxChecks: sandbox,
    sandboxChecksPassed: Boolean(row.sandbox_checks_passed) || sandboxChecksPassed(sandbox),
    expiresAt: row.expires_at,
    fingerprint: row.fingerprint,
    rejectionReason: row.rejection_reason,
    executionLock: row.execution_lock,
    executionResult: jsonObj(row.execution_result),
    decidedAt: row.decided_at,
    decidedBy: row.decided_by,
    executedAt: row.executed_at,
    createdAt: row.created_at,
  };
}

export async function enqueueProposal(input: {
  category: ProposalCategory;
  title: string;
  summary: string;
  evidence?: Record<string, unknown>;
  proposedPayload: ProposalPayload;
  estimatedCostCents?: number;
  riskLevel?: RiskLevel;
  sandboxChecks?: SandboxChecks;
}): Promise<{ id: string; duplicate: boolean }> {
  const draft = draftProposal(input);
  const invariants = validateProposalInvariants(draft.category, draft.proposedPayload);
  if (!invariants.ok) throw new AutopilotError(400, invariants.reason);
  const sql = await getSql();
  const id = newId("apr");
  const checks = JSON.stringify(draft.sandboxChecks);
  try {
    await sql`
      insert into autopilot_proposals (
        id, category, status, title, summary, evidence, proposed_payload,
        estimated_cost_cents, risk_level, sandbox_checks, sandbox_checks_passed,
        expires_at, fingerprint
      ) values (
        ${id}, ${draft.category}, ${"pending"}, ${draft.title}, ${draft.summary},
        ${JSON.stringify(draft.evidence)}::jsonb, ${JSON.stringify(draft.proposedPayload)}::jsonb,
        ${draft.estimatedCostCents}, ${draft.riskLevel}, ${checks}::jsonb,
        ${sandboxChecksPassed(draft.sandboxChecks)}, ${draft.expiresAt}::timestamptz, ${draft.fingerprint}
      )
    `;
    return { id, duplicate: false };
  } catch (err) {
    const message = err instanceof Error ? err.message : "";
    if (/unique|duplicate/i.test(message)) {
      const existing = await sql<{ id: string }>`
        select id from autopilot_proposals
        where fingerprint = ${draft.fingerprint} and status = ${"pending"}
        limit 1
      `.catch(() => []);
      return { id: existing[0]?.id || id, duplicate: true };
    }
    throw err;
  }
}

async function sweepExpired(): Promise<void> {
  const sql = await getSql();
  await sql`
    update autopilot_proposals
    set status = ${"expired"}
    where status = ${"pending"} and expires_at <= now()
  `.catch(() => undefined);
}

async function recentlyQueued(fingerprint: string): Promise<boolean> {
  const sql = await getSql();
  const rows = await sql<{ id: string }>`
    select id from autopilot_proposals
    where fingerprint = ${fingerprint}
      and created_at > now() - interval '20 hours'
    limit 1
  `.catch(() => []);
  return Boolean(rows[0]);
}

export async function seedDiagnosticProposals(): Promise<void> {
  const sql = await getSql();
  const paused = await sql<{ paused: boolean; pause_reason: string }>`
    select paused, pause_reason from growth_treasury_settings where id = ${"platform"} limit 1
  `.catch(() => []);
  if (paused[0]?.paused) {
    const pauseDraft = draftProposal({
      category: "self_heal_patch",
      title: "Pause outbound after treasury trip",
      summary: "Treasury already tripped a spend cap. Confirm pausing Autopilot outreach until you raise a cap or resume.",
      proposedPayload: { kind: "self_heal_patch", action: "pause_outbound", connectFeeBps: GEAR_GUARDIAN_BPS },
    });
    if (!(await recentlyQueued(pauseDraft.fingerprint))) await enqueueProposal({
      category: "self_heal_patch",
      title: "Pause outbound after treasury trip",
      summary: "Treasury already tripped a spend cap. Confirm pausing Autopilot outreach until you raise a cap or resume.",
      evidence: { pauseReason: paused[0].pause_reason, stack: "treasuryDecision → enforceTreasuryCaps" },
      proposedPayload: {
        kind: "self_heal_patch",
        action: "pause_outbound",
        connectFeeBps: GEAR_GUARDIAN_BPS,
        reason: paused[0].pause_reason,
      },
      estimatedCostCents: 0,
      riskLevel: "high",
      sandboxChecks: { tsc: true, unitTests: true, verifyE2e: false },
    }).catch(() => undefined);
  }
  const niche = pickSeasonalNiche(new Date(), ["OR", "PA", "NY", "TX", "FL", "CA"]);
  const smsPreview = `Winter ${niche} batch for OR/PA/NY. Preview landing + $1 unlock. ${SMS_TCPA_FOOTER} Reply HELP for help.`;
  const seasonal = draftProposal({
    category: "seasonal_campaign",
    title: `Seasonal ${niche} outreach batch`,
    summary: `Calendar + climate selector recommends ${niche}.`,
    proposedPayload: { kind: "seasonal_campaign", niche, states: ["OR", "PA", "NY"], batchSize: 12, connectFeeBps: GEAR_GUARDIAN_BPS, smsPreview },
  });
  if (await recentlyQueued(seasonal.fingerprint)) return;
  await enqueueProposal({
    category: "seasonal_campaign",
    title: `Seasonal ${niche} outreach batch`,
    summary: `Calendar + climate selector recommends ${niche} for today's cold-state plumbing/heating vs warm-state HVAC split. Approve to pin the next Autopilot batch.`,
    evidence: { niche, states: ["OR", "PA", "NY"], trigger: "seasonalTrades(now, state)" },
    proposedPayload: {
      kind: "seasonal_campaign",
      niche,
      states: ["OR", "PA", "NY"],
      batchSize: 12,
      connectFeeBps: GEAR_GUARDIAN_BPS,
      smsPreview,
    },
    estimatedCostCents: 12,
    riskLevel: "medium",
    sandboxChecks: { tsc: true, unitTests: true, verifyE2e: false },
  }).catch(() => undefined);
}

async function executePayload(
  category: ProposalCategory,
  payload: ProposalPayload,
): Promise<Record<string, unknown>> {
  const sql = await getSql();
  if (category === "budget_cap_change") {
    const twilio = Math.max(0, Number(payload.twilioDailyCapCents) || DEFAULT_TREASURY_CAPS.twilioDailyCapCents);
    const resend = Math.max(0, Number(payload.resendDailyCapCents) || DEFAULT_TREASURY_CAPS.resendDailyCapCents);
    const ai = Math.max(0, Number(payload.aiDailyCapCents) || DEFAULT_TREASURY_CAPS.aiDailyCapCents);
    const total = Math.max(0, Number(payload.totalDailyCapCents) || DEFAULT_TREASURY_CAPS.totalDailyCapCents);
    const { applyTreasuryCapsDirect } = await import("./growth-engine.server");
    await applyTreasuryCapsDirect({ twilioDailyCapCents: twilio, resendDailyCapCents: resend, aiDailyCapCents: ai, totalDailyCapCents: total });
    return { applied: "budget_cap_change", twilio, resend, ai, total };
  }
  if (category === "public_creative") {
    const creativeId = String(payload.creativeId || "");
    const body = String(payload.body || "");
    if (creativeId) {
      await sql`
        update growth_creatives set status = ${"approved"}
        where id = ${creativeId} and status = ${"pending_approval"}
      `.catch(() => undefined);
    }
    return { applied: "public_creative", creativeId, preview: body.slice(0, 120) };
  }
  if (category === "seasonal_campaign") {
    const niche = String(payload.niche || "plumbing").slice(0, 40);
    const states = Array.isArray(payload.states) ? payload.states.map((s) => String(s).slice(0, 2)).join(",") : "";
    const batch = Math.min(40, Math.max(0, Number(payload.batchSize) || 0));
    const pitch = parsePitchVariant(payload.pitchAngleId);
    await sql`
      insert into autopilot_runtime (id, seasonal_niche, campaign_states, batch_size, pitch_angle_id, updated_at)
      values (${"platform"}, ${niche}, ${states}, ${batch}, ${pitch}, now())
      on conflict (id) do update set
        seasonal_niche = excluded.seasonal_niche,
        campaign_states = excluded.campaign_states,
        batch_size = excluded.batch_size,
        pitch_angle_id = excluded.pitch_angle_id,
        updated_at = now()
    `;
    if (pitch) {
      await sql`
        update outbound_engine_state set pitch_angle_id = ${pitch}, updated_at = now() where id = ${"master"}
      `.catch(() => undefined);
    }
    return { applied: "seasonal_campaign", niche, states, batch };
  }
  const action = String(payload.action || "pause_outbound");
  if (action === "pause_outbound") {
    await sql`update outbound_engine_state set paused = true, updated_at = now() where id = ${"master"}`.catch(() => undefined);
    await sql`
      update growth_treasury_settings set paused = true, pause_reason = ${"owner-approved self-heal"}, updated_at = now()
      where id = ${"platform"}
    `.catch(() => undefined);
    return { applied: "pause_outbound" };
  }
  if (action === "set_pitch_angle") {
    const pitch = parsePitchVariant(payload.pitchAngleId);
    await sql`update outbound_engine_state set pitch_angle_id = ${pitch}, updated_at = now() where id = ${"master"}`.catch(() => undefined);
    return { applied: "set_pitch_angle", pitch };
  }
  throw new AutopilotError(400, "Unsupported self-heal action");
}

export async function decideProposal(
  request: Request,
  input: { id: string; action: "approve" | "disapprove"; reason?: string },
) {
  await assertAutopilotDesk(request);
  await sweepExpired();
  const sql = await getSql();
  const id = String(input.id || "").trim();
  if (!id) throw new AutopilotError(400, "proposal id required");
  const rows = await sql<Row>`select * from autopilot_proposals where id = ${id} limit 1`;
  const row = rows[0];
  if (!row) throw new AutopilotError(404, "unknown proposal");

  if (input.action === "disapprove") {
    const claim = claimDisapprove(parseProposalStatus(row.status) || "pending");
    if (!claim.ok) {
      if (row.status === "disapproved") return publicRow(row);
      throw new AutopilotError(409, claim.reason);
    }
    const reason = String(input.reason || "owner rejected").slice(0, 240);
    const updated = await sql<Row>`
      update autopilot_proposals
      set status = ${"disapproved"}, rejection_reason = ${reason}, decided_at = now(), decided_by = ${"master"}
      where id = ${id} and status = ${"pending"}
      returning *
    `;
    return publicRow(updated[0] || { ...row, status: "disapproved", rejection_reason: reason });
  }

  const now = new Date();
  const claim = claimApprove(parseProposalStatus(row.status) || "pending", String(row.expires_at), now);
  if (!claim.ok) {
    if (row.status === "executed" || row.status === "approved") return publicRow(row);
    if (claim.status === "expired") {
      await sql`update autopilot_proposals set status = ${"expired"} where id = ${id} and status = ${"pending"}`;
      throw new AutopilotError(409, claim.reason);
    }
    throw new AutopilotError(409, claim.reason);
  }

  const payload = jsonObj(row.proposed_payload);
  const category = parseProposalCategory(row.category) || "self_heal_patch";
  const invariants = validateProposalInvariants(category, payload);
  if (!invariants.ok) {
    await sql`
      update autopilot_proposals set status = ${"failed"}, rejection_reason = ${invariants.reason}, decided_at = now()
      where id = ${id} and status = ${"pending"}
    `;
    throw new AutopilotError(409, invariants.reason);
  }
  if (!executionSandboxOk(category, parseSandboxChecks(jsonObj(row.sandbox_checks)), payload)) {
    await sql`
      update autopilot_proposals
      set status = ${"failed"}, rejection_reason = ${"sandbox checks (tsc, unit tests, verify:e2e) must pass"}, decided_at = now()
      where id = ${id} and status = ${"pending"}
    `;
    throw new AutopilotError(409, "sandbox checks (tsc, unit tests, verify:e2e) must pass");
  }

  const lock = newId("lk");
  const claimed = await sql<Row>`
    update autopilot_proposals
    set status = ${"approved"}, execution_lock = ${lock}, decided_at = now(), decided_by = ${"master"}
    where id = ${id} and status = ${"pending"} and execution_lock is null
    returning *
  `;
  if (!claimed[0]) {
    const again = await sql<Row>`select * from autopilot_proposals where id = ${id} limit 1`;
    if (again[0]?.status === "executed" || again[0]?.execution_lock) return publicRow(again[0]!);
    throw new AutopilotError(409, "proposal already claimed");
  }

  try {
    const result = await executePayload(category, payload);
    const done = await sql<Row>`
      update autopilot_proposals
      set status = ${"executed"}, executed_at = now(), execution_result = ${JSON.stringify(result)}::jsonb
      where id = ${id} and execution_lock = ${lock}
      returning *
    `;
    return publicRow(done[0] || claimed[0]);
  } catch (err) {
    const message = err instanceof Error ? err.message : "execute failed";
    await sql`
      update autopilot_proposals
      set status = ${"failed"}, rejection_reason = ${message.slice(0, 240)}, execution_result = ${JSON.stringify({ error: message })}::jsonb
      where id = ${id} and execution_lock = ${lock}
    `;
    throw err;
  }
}

export async function readMasterProposals(request: Request) {
  await assertAutopilotDesk(request);
  await sweepExpired();
  await seedDiagnosticProposals().catch(() => undefined);
  const sql = await getSql();
  const rows = await sql<Row>`
    select * from autopilot_proposals
    order by created_at desc
    limit 80
  `.catch(() => [] as Row[]);
  const mapped = rows.map(publicRow);
  const now = new Date();
  const pending = sortPending(
    mapped.filter((row) => row.status === "pending"),
    now,
  );
  const audit = mapped.filter((row) => row.status === "executed" || row.status === "disapproved" || row.status === "failed" || row.status === "expired");
  return { pending, audit, connectFeeBps: GEAR_GUARDIAN_BPS };
}

export { draftProposal };
export type { ProposalDraft };
