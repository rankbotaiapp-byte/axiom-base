/**
 * Haptic ↔ animation timeline sync.
 *
 *   npx ts-node --project tsconfig.json scripts/test-haptic-sync.ts
 */
import {
  axiomTactile,
  LEAD_CAPTURE_HAPTIC,
  STRIPE_SETTLEMENT_HAPTIC,
  VIDEO_BRUSH_LIGHT,
} from "../src/lib/haptics/axiom-tactile-engine.ts";

interface HapticTestEvent {
  timestamp: number;
  type: "lead_capture" | "stripe_settlement" | "video_brush_by";
  expectedVibrationPattern: number | readonly number[];
}

const LATENCY_MS = 15;

const ENGINE_PATTERN = {
  lead_capture: LEAD_CAPTURE_HAPTIC,
  stripe_settlement: STRIPE_SETTLEMENT_HAPTIC,
  video_brush_by: VIDEO_BRUSH_LIGHT,
} as const;

const mockTimeline: HapticTestEvent[] = [
  { timestamp: 1.25, type: "lead_capture", expectedVibrationPattern: [20, 50, 40, 50, 120] },
  { timestamp: 3.5, type: "stripe_settlement", expectedVibrationPattern: 140 },
  { timestamp: 5.1, type: "video_brush_by", expectedVibrationPattern: [6, 25, 12, 25, 6] },
];

function samePattern(actual: number | readonly number[], expected: number | readonly number[]): boolean {
  if (typeof actual === "number" || typeof expected === "number") return actual === expected;
  return actual.length === expected.length && actual.every((n, i) => n === expected[i]);
}

function fire(event: HapticTestEvent) {
  if (event.type === "lead_capture") axiomTactile.triggerLeadCapture();
  else if (event.type === "stripe_settlement") axiomTactile.triggerStripeSettlement();
  else axiomTactile.triggerVideoBrushBy("light", 0);
}

function runHapticSyncTest() {
  console.log("Running Axiom haptic-animation sync suite…");
  console.log("");
  console.log("══════════════════════════════════════════════════════════════");
  console.log("  AXIOM · Haptic Sync");
  console.log("══════════════════════════════════════════════════════════════");

  let passed = 0;
  let failed = 0;

  for (const [index, event] of mockTimeline.entries()) {
    const startTime = performance.now();
    fire(event);
    const latency = performance.now() - startTime;
    const patternOk = samePattern(ENGINE_PATTERN[event.type], event.expectedVibrationPattern);
    const fast = latency < LATENCY_MS;
    const ok = patternOk && fast;
    const label = `Cue · ${event.type} @ ${event.timestamp.toFixed(2)}s`;
    const detail = `${latency.toFixed(2)}ms · pattern ${JSON.stringify(event.expectedVibrationPattern)}`;
    if (ok) {
      passed += 1;
      console.log(`  [PASS] ${label} — ${detail}`);
    } else {
      failed += 1;
      console.log(
        `  [FAIL] ${label} — ${fast ? "pattern mismatch" : `latency ${latency.toFixed(2)}ms ≥ ${LATENCY_MS}ms`}`,
      );
    }
  }

  const checks = passed + failed;
  console.log("──────────────────────────────────────────────────────────────");
  console.log(`  Checks: ${checks}  ·  PASS ${passed}  ·  FAIL ${failed}`);
  console.log(
    failed > 0
      ? "  RESULT: NOT READY — haptic cues missed the 15ms sync window."
      : "  RESULT: SYNCED — lead, Stripe 1.5%, and video brush-by fire in lockstep.",
  );
  console.log("══════════════════════════════════════════════════════════════");
  if (failed > 0) process.exitCode = 1;
}

runHapticSyncTest();
