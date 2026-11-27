import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { GEAR_GUARDIAN_BPS } from "./merchant-pricing.ts";
import {
  AutopilotProposalStore,
  claimApprove,
  draftProposal,
  expireIfNeeded,
  HARD_TREASURY_CEILINGS,
  requireDeskActor,
  sandboxChecksPassed,
  sortPending,
  validateProposalInvariants,
  type MemoryProposal,
} from "./autopilot-queue.ts";

const root = join(dirname(fileURLToPath(import.meta.url)), "../..");

function row(partial: Partial<MemoryProposal> & Pick<MemoryProposal, "id">): MemoryProposal {
  const draft = draftProposal({
    category: partial.category || "budget_cap_change",
    title: partial.title || "Raise Twilio cap",
    summary: partial.summary || "Spend is near the daily Twilio ceiling.",
    proposedPayload: partial.proposedPayload || {
      kind: "budget_cap_change",
      twilioDailyCapCents: 5000,
      connectFeeBps: GEAR_GUARDIAN_BPS,
    },
    estimatedCostCents: partial.estimatedCostCents ?? 500,
    riskLevel: partial.riskLevel || "high",
    sandboxChecks: partial.sandboxChecks || { tsc: true, unitTests: true, verifyE2e: true },
    now: new Date("2026-01-15T12:00:00Z"),
  });
  return {
    id: partial.id,
    status: partial.status || "pending",
    sandboxChecksPassed: sandboxChecksPassed(draft.sandboxChecks),
    rejectionReason: partial.rejectionReason || "",
    executionLock: partial.executionLock ?? null,
    decidedBy: partial.decidedBy || "",
    ...draft,
    ...partial,
    sandboxChecks: partial.sandboxChecks || draft.sandboxChecks,
  };
}

test("proposal creation stores category, evidence, payload, sandbox, and expiry", () => {
  const draft = draftProposal({
    category: "seasonal_campaign",
    title: "Winter plumbing OR",
    summary: "Freeze-risk plumbing in Oregon this week.",
    evidence: { conversion: 0.12, trigger: "Jan climate=cold" },
    proposedPayload: {
      niche: "plumbing",
      states: ["OR"],
      batchSize: 12,
      connectFeeBps: 150,
      smsPreview: "Reply STOP to opt out. Reply HELP for help.",
    },
    estimatedCostCents: 12,
    now: new Date("2026-01-15T00:00:00Z"),
  });
  assert.equal(draft.category, "seasonal_campaign");
  assert.match(draft.evidence.trigger as string, /climate/);
  assert.equal(draft.proposedPayload.batchSize, 12);
  assert.equal(draft.sandboxChecks.tsc, false);
  assert.ok(Date.parse(draft.expiresAt) > Date.parse("2026-01-15T00:00:00Z"));
  const sql = readFileSync(join(root, "../migrations/0117_autopilot_proposals.sql"), "utf8");
  assert.match(sql, /autopilot_proposals/);
  assert.match(sql, /pending_approval|pending/);
  assert.match(sql, /self_heal_patch/);
});

test("Approve executes once; double-click is idempotent", () => {
  const store = new AutopilotProposalStore();
  store.insert(row({ id: "apr_1", sandboxChecks: { tsc: true, unitTests: true, verifyE2e: true } }));
  const now = new Date("2026-01-15T12:00:00Z");
  const first = store.approve("apr_1", now, { desk: true });
  assert.equal(first.status, "executed");
  assert.ok(first.executionLock);
  const second = store.approve("apr_1", now, { desk: true });
  assert.equal(second.status, "executed");
  assert.equal(second.executionLock, first.executionLock);
});

test("Disapprove cancels immediately and records a rejection fingerprint", () => {
  const store = new AutopilotProposalStore();
  store.insert(row({ id: "apr_2", title: "Bad ad" }));
  const denied = store.disapprove("apr_2", "off-brand", { desk: true });
  assert.equal(denied.status, "disapproved");
  assert.equal(denied.rejectionReason, "off-brand");
  assert.equal(store.rejectedFingerprints.length, 1);
  assert.throws(() => store.approve("apr_2", new Date("2026-01-15T12:00:00Z"), { desk: true }));
});

test("expiration timeout never auto-approves", () => {
  const now = new Date("2026-01-16T12:00:00Z");
  const claim = claimApprove("pending", "2026-01-16T00:00:00Z", now);
  assert.equal(claim.ok, false);
  assert.equal(claim.status, "expired");
  assert.match(claim.reason, /silence does not approve/);
  assert.equal(expireIfNeeded("pending", "2026-01-16T00:00:00Z", now), "expired");
});

test("unauthorized actors cannot approve or disapprove", () => {
  assert.equal(requireDeskActor(false).ok, false);
  const store = new AutopilotProposalStore();
  store.insert(row({ id: "apr_3" }));
  assert.throws(() => store.approve("apr_3", new Date("2026-01-15T12:00:00Z"), { desk: false }), /authentication/);
  assert.throws(() => store.disapprove("apr_3", "nope", { desk: false }), /authentication/);
});

test("invariants keep 1.5% Connect, STOP/HELP, and hard cap ceilings", () => {
  assert.equal(
    validateProposalInvariants("public_creative", {
      connectFeeBps: 200,
      body: "Reply STOP to opt out. HELP for help.",
    }).ok,
    false,
  );
  assert.equal(
    validateProposalInvariants("public_creative", {
      connectFeeBps: 150,
      body: "Great rates this week only",
    }).ok,
    false,
  );
  assert.equal(
    validateProposalInvariants("budget_cap_change", {
      twilioDailyCapCents: HARD_TREASURY_CEILINGS.twilioDailyCapCents + 1,
      connectFeeBps: 150,
    }).ok,
    false,
  );
  assert.equal(
    validateProposalInvariants("self_heal_patch", { action: "apply_diff", diff: "rm -rf" }).ok,
    false,
  );
  const pending = sortPending(
    [
      row({ id: "a", riskLevel: "low", estimatedCostCents: 1, category: "public_creative" }),
      row({ id: "b", riskLevel: "critical", estimatedCostCents: 4000, category: "self_heal_patch" }),
    ],
    new Date("2026-01-15T12:00:00Z"),
  );
  assert.equal(pending[0]?.id, "b");
});
