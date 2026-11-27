/**
 * Names-only sync: pipes values from local env files into Vercel Preview.
 * Never prints values.
 */
import { spawn } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { config } from "dotenv";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
config({ path: join(root, ".env") });
config({ path: join(root, ".env.local"), override: false });

const KEYS = [
  "DATABASE_URL",
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "SUPABASE_URL",
  "TWILIO_ACCOUNT_SID",
  "TWILIO_AUTH_TOKEN",
  "STRIPE_SECRET_KEY",
  "STRIPE_WEBHOOK_SECRET",
  "RESEND_API_KEY",
  "REPLICATE_API_TOKEN",
  "OUTREACH_MODE",
];

function addPreview(name, value) {
  return new Promise((resolve) => {
    const child = spawn(
      "npx",
      [
        "vercel",
        "env",
        "add",
        name,
        "--environment",
        "preview",
        "--project",
        "axiom-base",
        "--scope",
        "newera1",
        "--sensitive",
        "--yes",
      ],
      { cwd: root, stdio: ["pipe", "pipe", "pipe"], shell: true },
    );
    child.stdin.write(value);
    child.stdin.end();
    child.on("close", (code) => resolve(code === 0 ? "ok" : `exit_${code}`));
  });
}

const results = [];
for (const name of KEYS) {
  const value = process.env[name]?.trim();
  if (!value) {
    results.push({ name, result: "missing_locally" });
    continue;
  }
  results.push({ name, result: await addPreview(name, value) });
}
console.log(JSON.stringify({ project: "axiom-base", environment: "preview", results }));
