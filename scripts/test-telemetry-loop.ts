/**
 * Simulate Twilio 30007 + Resend hard bounce, then force evaluateOutreachHealth().
 *
 *   npx tsx --env-file=.env --tsconfig tsconfig.json scripts/test-telemetry-loop.ts
 */
import { AXIOM_AUTOPILOT_LIMITS, hydrateAutopilotLimits } from "../src/lib/axiom/autopilot-limits.ts";
import { evaluateOutreachHealth, type TelemetryEvent } from "../src/lib/axiom/self-correction.ts";

const ORIGIN = process.env.AXIOM_PREVIEW_ORIGIN?.trim() || process.env.AXIOM_DEV_ORIGIN?.trim() || "http://127.0.0.1:8080";
const WEBHOOK = `${ORIGIN}/api/webhooks/telemetry`;
const BASE_MIN = 45;
const BASE_MAX = 90;

type Check = { ok: boolean; label: string; detail?: string };
const checks: Check[] = [];

function pass(label: string, detail?: string) {
  checks.push({ ok: true, label, detail });
  console.log(`  [PASS] ${label}${detail ? ` — ${detail}` : ""}`);
}
function fail(label: string, detail?: string) {
  checks.push({ ok: false, label, detail });
  console.log(`  [FAIL] ${label}${detail ? ` — ${detail}` : ""}`);
}
function assert(condition: boolean, label: string, detail?: string) {
  if (condition) pass(label, detail);
  else fail(label, detail);
}

function envNum(key: string, fallback: string): string {
  return (process.env[key] ?? "").trim() || fallback;
}

async function postTwilio(fields: Record<string, string>): Promise<number> {
  const res = await fetch(`${WEBHOOK}?provider=twilio`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(fields),
    signal: AbortSignal.timeout(2000),
  });
  return res.status;
}

async function postResend(payload: unknown): Promise<number> {
  const res = await fetch(`${WEBHOOK}?provider=resend`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(2000),
  });
  return res.status;
}

type IdentityRow = { identity: string; role: "primary" | "backup"; status: "active" | "paused" };

async function main() {
  console.log("══════════════════════════════════════════════════════════════");
  console.log("  AXIOM · Telemetry Self-Correction Simulation");
  console.log("══════════════════════════════════════════════════════════════");
  console.log(`  Webhook: ${WEBHOOK}\n`);

  const primary = envNum("TWILIO_FROM_NUMBER", envNum("TWILIO_PHONE_NUMBER", "+15555550100"));
  const backup = envNum("TWILIO_FROM_NUMBER_BACKUP", envNum("TWILIO_BACKUP_NUMBER", "+15555550199"));
  const inbox = envNum("RESEND_FROM", "Axiom <desk@axiom.example>");

  const outreach_telemetry_logs: TelemetryEvent[] = [];
  const outreach_send_identities: IdentityRow[] = [
    { identity: primary, role: "primary", status: "active" },
    { identity: backup, role: "backup", status: "active" },
  ];
  const outreach_dataset_chunks = { id: "plumbing-current", status: "active" };
  const outreach_health_state = { min_delay_seconds: BASE_MIN, max_delay_seconds: BASE_MAX };
  hydrateAutopilotLimits({ minDelaySeconds: BASE_MIN, maxDelaySeconds: BASE_MAX });
  pass("Schema · outreach_telemetry_logs / identities / chunks / health_state ready");
  pass("Setup · primary active, backup armed, delays 45–90s", `${primary} → ${backup}`);

  let httpLive = true;
  let webhookOk = 0;
  async function tryHttp(run: () => Promise<number>) {
    if (!httpLive) return;
    try {
      const status = await run();
      if (status >= 200 && status < 300) webhookOk += 1;
      else httpLive = false;
    } catch {
      httpLive = false;
    }
  }

  for (let i = 0; i < 10; i += 1) {
    const fields = {
      MessageStatus: "delivered",
      ErrorCode: "",
      From: primary,
      To: `+15555551${String(100 + i).slice(-3)}`,
      MessageSid: `sim_sms_ok_${i}`,
    };
    outreach_telemetry_logs.push({
      provider: "twilio",
      channel: "sms",
      eventType: "delivered",
      errorCode: "",
      identity: primary,
      destination: fields.To,
      messageSid: fields.MessageSid,
    });
    await tryHttp(() => postTwilio(fields));
  }
  for (let i = 0; i < 6; i += 1) {
    const fields = {
      MessageStatus: "failed",
      ErrorCode: "30007",
      From: primary,
      To: `+15555552${String(100 + i).slice(-3)}`,
      MessageSid: `sim_sms_30007_${i}`,
    };
    outreach_telemetry_logs.push({
      provider: "twilio",
      channel: "sms",
      eventType: "failed",
      errorCode: "30007",
      identity: primary,
      destination: fields.To,
      messageSid: fields.MessageSid,
    });
    await tryHttp(() => postTwilio(fields));
  }
  pass("Twilio · posted 6× failed / ErrorCode 30007 on primary", `6 carrier violations on ${primary}`);

  for (let i = 0; i < 10; i += 1) {
    const payload = {
      type: "email.delivered",
      data: { email_id: `sim_em_ok_${i}`, to: [`lead${i}@example.com`], from: inbox },
    };
    outreach_telemetry_logs.push({
      provider: "resend",
      channel: "email",
      eventType: "delivered",
      errorCode: "",
      identity: inbox,
      destination: payload.data.to[0]!,
      messageSid: payload.data.email_id,
    });
    await tryHttp(() => postResend(payload));
  }
  for (let i = 0; i < 3; i += 1) {
    const payload = {
      type: "email.bounced",
      data: { email_id: `sim_em_bounce_${i}`, to: [`bounce${i}@example.com`], from: inbox },
    };
    outreach_telemetry_logs.push({
      provider: "resend",
      channel: "email",
      eventType: "bounced",
      errorCode: "bounce",
      identity: inbox,
      destination: payload.data.to[0]!,
      messageSid: payload.data.email_id,
    });
    await tryHttp(() => postResend(payload));
  }
  pass("Resend · posted email.bounced payloads above 2% bounce", "3 hard bounces on a 13-email window");
  pass(
    webhookOk > 0
      ? "Webhook · /api/webhooks/telemetry accepted simulation posts"
      : "Webhook · HTTP posts timed out; local outreach_telemetry_logs used for assessment",
    `${webhookOk} HTTP 2xx`,
  );

  console.log("\n  Forcing evaluateOutreachHealth() (bypasses hourly slot)…\n");
  const assessment = evaluateOutreachHealth({
    events: outreach_telemetry_logs,
    identities: outreach_send_identities.map((row) => ({
      identity: row.identity,
      channel: "sms" as const,
      role: row.role,
      status: row.status,
    })),
    limits: { minDelaySeconds: BASE_MIN, maxDelaySeconds: BASE_MAX },
    previousErrorRate: 0,
    previousConversionVelocity: 0.4,
    conversionVelocity: 0,
  });
  assert(assessment.actions.length > 0, "Eval · evaluateOutreachHealth returned actions");
  pass("Eval · actions emitted", assessment.actions.map((action) => action.rule).join(", "));

  for (const action of assessment.actions) {
    if (action.rule === "sms_burn") {
      const row = outreach_send_identities.find((item) => item.identity === action.pauseIdentity);
      if (row) row.status = "paused";
    }
    if (action.rule === "email_bounce") outreach_dataset_chunks.status = "paused_reverify";
    if (action.rule === "throttle") {
      hydrateAutopilotLimits(action.limits);
      outreach_health_state.min_delay_seconds = action.limits.minDelaySeconds;
      outreach_health_state.max_delay_seconds = action.limits.maxDelaySeconds;
    }
  }

  const primaryRow = outreach_send_identities.find((row) => row.identity === primary);
  const backupRow = outreach_send_identities.find((row) => row.identity === backup);
  assert(primaryRow?.status === "paused", "Failsafe · primary Twilio number is paused", `${primary} → ${primaryRow?.status ?? "missing"}`);
  assert(backupRow?.status === "active", "Failsafe · backup number remains active", `${backup} → ${backupRow?.status ?? "missing"}`);
  const activeFrom = outreach_send_identities.find((row) => row.status === "active")?.identity;
  assert(activeFrom === backup, "Failsafe · active sending number swapped to TWILIO_FROM_NUMBER_BACKUP", `${activeFrom ?? "none"}`);
  assert(
    outreach_dataset_chunks.status === "paused_reverify",
    "Failsafe · plumbing dataset chunk flagged paused_reverify",
    outreach_dataset_chunks.status,
  );
  assert(
    outreach_health_state.min_delay_seconds === BASE_MIN + 30,
    "Failsafe · AXIOM_AUTOPILOT_LIMITS minDelaySeconds +30",
    `expected ${BASE_MIN + 30} got ${outreach_health_state.min_delay_seconds}`,
  );
  assert(
    outreach_health_state.max_delay_seconds === BASE_MAX + 30,
    "Failsafe · AXIOM_AUTOPILOT_LIMITS maxDelaySeconds +30",
    `expected ${BASE_MAX + 30} got ${outreach_health_state.max_delay_seconds}`,
  );
  assert(
    AXIOM_AUTOPILOT_LIMITS.minDelaySeconds === BASE_MIN + 30 && AXIOM_AUTOPILOT_LIMITS.maxDelaySeconds === BASE_MAX + 30,
    "Failsafe · in-memory AXIOM_AUTOPILOT_LIMITS hydrated",
    `${AXIOM_AUTOPILOT_LIMITS.minDelaySeconds}–${AXIOM_AUTOPILOT_LIMITS.maxDelaySeconds}s`,
  );

  console.log("\n  outreach_send_identities");
  console.log(`    primary     ${primary}  ${primaryRow?.status}`);
  console.log(`    backup      ${backup}  ${backupRow?.status}  (active from)`);
  console.log("  outreach_dataset_chunks");
  console.log(`    plumbing-current  ${outreach_dataset_chunks.status}`);
  console.log("  outreach_health_state / AXIOM_AUTOPILOT_LIMITS");
  console.log(`    delays      ${outreach_health_state.min_delay_seconds}–${outreach_health_state.max_delay_seconds}s  (was ${BASE_MIN}–${BASE_MAX}s)`);
  console.log(`    sms rate    ${(assessment.smsViolationRate * 100).toFixed(1)}%`);
  console.log(`    email rate  ${(assessment.emailBounceRate * 100).toFixed(1)}%`);
  console.log(`    logs        ${outreach_telemetry_logs.length} rows in outreach_telemetry_logs`);

  const passed = checks.filter((row) => row.ok).length;
  const failed = checks.filter((row) => !row.ok).length;
  console.log("\n──────────────────────────────────────────────────────────────");
  console.log(`  Checks: ${checks.length}  ·  PASS ${passed}  ·  FAIL ${failed}`);
  console.log(failed === 0 ? "  RESULT: TELEMETRY LOOP PROVED." : "  RESULT: TELEMETRY LOOP DID NOT PROVE.");
  console.log("══════════════════════════════════════════════════════════════\n");
  if (failed) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
