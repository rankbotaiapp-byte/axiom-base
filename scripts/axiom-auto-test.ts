/**
 * Local Axiom release test runner — all modules, aggregated verification.
 *
 *   AXIOM_LOCAL_AUTH=true npx tsx --env-file=.env scripts/axiom-auto-test.ts
 */
import { spawn } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

type ModuleResult = {
  id: string;
  label: string;
  exitCode: number;
  checks: number;
  passed: number;
  failed: number;
  durationMs: number;
};

const MODULES: {
  id: string;
  label: string;
  script: string;
  envFile?: boolean;
  optional?: boolean;
}[] = [
  { id: "dataset", label: "Dataset → niche pairing", script: "scripts/test-dataset-pairing.ts" },
  {
    id: "hero-studio",
    label: "Admin Hero Studio",
    script: "scripts/test-admin-hero-studio.ts",
    envFile: true,
  },
  {
    id: "release",
    label: "Release readiness",
    script: "scripts/test-axiom-release-readiness.ts",
    envFile: true,
  },
  { id: "seed", label: "Seed axiom-auto tenant", script: "scripts/seed-test-shop.ts", envFile: true },
  { id: "local-auth", label: "Local-dev auth smoke", script: "scripts/test-local-dev-auth.ts", optional: true },
  {
    id: "telemetry-loop",
    label: "Telemetry self-correction simulation",
    script: "scripts/test-telemetry-loop.ts",
    envFile: true,
  },
  { id: "haptic-sync", label: "Haptic-animation sync", script: "scripts/test-haptic-sync.ts" },
];

function parseCheckLine(text: string): { checks: number; passed: number; failed: number } | null {
  const m = text.match(/Checks:\s*(\d+)\s*[·.]*\s*PASS\s*(\d+)\s*[·.]*\s*FAIL\s*(\d+)/i);
  if (m) return { checks: Number(m[1]), passed: Number(m[2]), failed: Number(m[3]) };
  const passMarks = (text.match(/\[PASS\]/g) ?? []).length;
  const failMarks = (text.match(/\[FAIL\]/g) ?? []).length;
  if (passMarks + failMarks > 0) {
    return { checks: passMarks + failMarks, passed: passMarks, failed: failMarks };
  }
  const ticks = (text.match(/^\s*(?:✓|PASS|ok)\b/gim) ?? []).length;
  const crosses = (text.match(/^\s*(?:✗|✕|FAIL)\b/gim) ?? []).length;
  if (ticks + crosses > 0) return { checks: ticks + crosses, passed: ticks, failed: crosses };
  return null;
}

function runModule(mod: (typeof MODULES)[number]): Promise<ModuleResult> {
  const started = Date.now();
  const args = ["tsx"];
  if (mod.envFile) args.push("--env-file=.env");
  args.push(mod.script);

  return new Promise((resolve) => {
    const child = spawn("npx", args, {
      cwd: ROOT,
      env: {
        ...process.env,
        AXIOM_LOCAL_AUTH: "true",
        VITE_AXIOM_LOCAL_AUTH: "true",
        NODE_ENV: process.env.NODE_ENV || "development",
      },
      shell: true,
      windowsHide: true,
    });

    let output = "";
    child.stdout?.on("data", (chunk: Buffer) => {
      const text = chunk.toString();
      output += text;
      process.stdout.write(text);
    });
    child.stderr?.on("data", (chunk: Buffer) => {
      const text = chunk.toString();
      output += text;
      process.stderr.write(text);
    });
    child.on("close", (code) => {
      const parsed = parseCheckLine(output) ?? {
        checks: 1,
        passed: code === 0 ? 1 : 0,
        failed: code === 0 ? 0 : 1,
      };
      resolve({
        id: mod.id,
        label: mod.label,
        exitCode: code ?? 1,
        checks: parsed.checks,
        passed: parsed.passed,
        failed: parsed.failed,
        durationMs: Date.now() - started,
      });
    });
  });
}

async function main() {
  process.env.AXIOM_LOCAL_AUTH = "true";
  process.env.VITE_AXIOM_LOCAL_AUTH = "true";

  console.log("══════════════════════════════════════════════════════════════");
  console.log("  AXIOM · Automated Release Suite");
  console.log("══════════════════════════════════════════════════════════════");
  console.log(`  AXIOM_LOCAL_AUTH=${process.env.AXIOM_LOCAL_AUTH}`);
  console.log(`  Modules: ${MODULES.map((m) => m.id).join(", ")}`);
  console.log("──────────────────────────────────────────────────────────────\n");

  const results: ModuleResult[] = [];
  for (const mod of MODULES) {
    console.log(`\n▶ ${mod.label}  (${mod.script})\n`);
    const result = await runModule(mod);
    results.push(result);
    const status = result.exitCode === 0 && result.failed === 0 ? "PASS" : mod.optional ? "SOFT" : "FAIL";
    console.log(
      `\n◀ ${mod.id} → ${status} · ${result.passed}/${result.checks} pass · ${result.durationMs}ms · exit ${result.exitCode}\n`,
    );
  }

  const totalChecks = results.reduce((n, r) => n + r.checks, 0);
  const totalPass = results.reduce((n, r) => n + r.passed, 0);
  const totalFail = results.reduce((n, r) => n + r.failed, 0);
  const hardFails = results.filter((r) => {
    const mod = MODULES.find((m) => m.id === r.id);
    return !mod?.optional && (r.exitCode !== 0 || r.failed > 0);
  });

  console.log("\n══════════════════════════════════════════════════════════════");
  console.log("  AXIOM · Verification Results");
  console.log("══════════════════════════════════════════════════════════════");
  console.log(`  Checks: ${totalChecks}  ·  PASS ${totalPass}  ·  FAIL ${totalFail}`);
  for (const r of results) {
    const optional = MODULES.find((m) => m.id === r.id)?.optional;
    const mark = r.exitCode === 0 && r.failed === 0 ? "PASS" : optional ? "SOFT" : "FAIL";
    console.log(
      `  [${mark}] ${r.label.padEnd(40)} ${String(r.passed).padStart(3)}/${String(r.checks).padStart(3)}  (${r.durationMs}ms)`,
    );
  }
  console.log("──────────────────────────────────────────────────────────────");
  if (hardFails.length === 0) {
    console.log("  RESULT: RELEASE READY — all required modules green.");
  } else {
    console.log(
      `  RESULT: NOT READY — ${hardFails.length} module(s) failed: ${hardFails.map((r) => r.id).join(", ")}`,
    );
  }
  console.log(
    `  Target reference: release readiness billing uses Choose Your Price ($1 / $150/mo / $1,500 lifetime); suite checks this run: ${totalChecks}.`,
  );
  console.log("══════════════════════════════════════════════════════════════\n");

  if (hardFails.length) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
