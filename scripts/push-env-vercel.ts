/**
 * Upload .env to the linked Vercel project’s production environment.
 * Comment lines are skipped. Values are passed on stdin and never printed.
 * Secret-shaped names are stored as sensitive Vercel variables.
 */
import { spawn } from "node:child_process";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

type Entry = { key: string; value: string; sensitive: boolean };

const TARGET = "production";
const SECRET_NAME =
  /SECRET|TOKEN|PASSWORD|PRIVATE|DATABASE_URL|SERVICE_ROLE|API_KEY|ACCOUNT_SID|BYPASS_KEY|WEBHOOK/i;

function isSensitive(key: string): boolean {
  if (key.startsWith("NEXT_PUBLIC_") || key.startsWith("VITE_")) return false;
  return SECRET_NAME.test(key);
}

function unquote(value: string): string {
  if (value.length >= 2 && ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'")))) {
    return value.slice(1, -1);
  }
  const comment = value.search(/\s#/);
  return comment === -1 ? value : value.slice(0, comment).trim();
}

export function parseEnvFile(text: string): Entry[] {
  const byKey = new Map<string, Entry>();
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const body = line.startsWith("export ") ? line.slice(7).trim() : line;
    const eq = body.indexOf("=");
    if (eq <= 0) continue;
    const key = body.slice(0, eq).trim();
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(key)) continue;
    const value = unquote(body.slice(eq + 1).trim());
    if (!value) continue;
    byKey.set(key, { key, value, sensitive: isSensitive(key) });
  }
  return [...byKey.values()];
}

function redact(text: string, secrets: string[]): string {
  let safe = text;
  for (const secret of secrets) {
    if (secret.length < 4) continue;
    safe = safe.split(secret).join("[redacted]");
  }
  return safe
    .replace(/sk_(?:live|test)_[A-Za-z0-9]+/g, "sk_[redacted]")
    .replace(/whsec_[A-Za-z0-9]+/g, "whsec_[redacted]")
    .replace(/sb_[A-Za-z0-9_]+/g, "sb_[redacted]")
    .replace(/re_[A-Za-z0-9_]+/g, "re_[redacted]")
    .replace(/postgres(?:ql)?:\/\/\S+/gi, "postgres://[redacted]")
    .slice(0, 240);
}

function vercelBin(): string {
  return process.env.VERCEL_BIN?.trim() || "vercel";
}

function runVercel(args: string[], value: string, secrets: string[]): Promise<void> {
  return new Promise((resolveRun, reject) => {
    const child = spawn(vercelBin(), args, {
      stdio: ["pipe", "pipe", "pipe"],
      shell: process.platform === "win32",
      windowsHide: true,
    });
    let stderr = "";
    const timer = setTimeout(() => {
      child.kill();
      reject(new Error(`${args[2]} timed out. The Vercel CLI may be waiting for a prompt.`));
    }, 30_000);
    child.stderr.setEncoding("utf8");
    child.stdout.setEncoding("utf8");
    child.stderr.on("data", (chunk: string) => {
      stderr += chunk;
    });
    child.stdout.on("data", () => {});
    child.on("error", (err) => {
      clearTimeout(timer);
      reject(err);
    });
    child.on("close", (code) => {
      clearTimeout(timer);
      if (code === 0) {
        resolveRun();
        return;
      }
      const detail = redact(stderr, secrets).trim();
      reject(new Error(detail || `vercel env add exited ${code ?? "unknown"}`));
    });
    child.stdin.end(value);
  });
}

async function upload(entry: Entry, secrets: string[]): Promise<void> {
  const args = ["env", "add", entry.key, TARGET, "--yes", "--force"];
  if (entry.sensitive) args.push("--sensitive");
  try {
    await runVercel(args, entry.value, secrets);
  } catch (err) {
    const message = err instanceof Error ? err.message : "";
    const missingFlag = entry.sensitive && /unknown (?:option|argument)|unexpected argument.*sensitive/i.test(message);
    if (!missingFlag) throw err;
    await runVercel(["env", "add", entry.key, TARGET, "--yes", "--force"], entry.value, secrets);
  }
}

async function main(): Promise<void> {
  const dryRun = process.argv.includes("--dry-run");
  const text = readFileSync(resolve(process.cwd(), ".env"), "utf8");
  const entries = parseEnvFile(text);
  if (entries.length === 0) {
    console.error("[env] .env has no values to upload");
    process.exit(1);
  }
  const secrets = entries.map((entry) => entry.value);
  console.log(`[env] ${dryRun ? "dry run" : "uploading"} ${entries.length} names to ${TARGET}`);
  for (const entry of entries) {
    const kind = entry.sensitive ? "sensitive" : "plain";
    if (dryRun) {
      console.log(`[env] ${entry.key} · ${kind} · would upload`);
      continue;
    }
    try {
      await upload(entry, secrets);
      console.log(`[env] ${entry.key} · ${kind} · uploaded`);
    } catch (err) {
      const message = err instanceof Error ? redact(err.message, secrets) : "upload failed";
      if (err instanceof Error && "code" in err && err.code === "ENOENT") {
        console.error("[env] Vercel CLI was not found. Install it, run vercel link, then try again.");
        process.exit(1);
      }
      console.error(`[env] ${entry.key} · ${kind} · failed · ${message}`);
      process.exit(1);
    }
  }
  console.log(dryRun ? "[env] dry run complete · nothing uploaded" : "[env] production upload complete");
}

const isDirectRun = process.argv[1]?.replaceAll("\\", "/").endsWith("scripts/push-env-vercel.ts");
if (isDirectRun) {
  main().catch((err: unknown) => {
    const message = err instanceof Error ? err.message : "upload failed";
    console.error("[env]", /ENOENT/.test(message) ? "Vercel CLI was not found." : "upload failed");
    process.exit(1);
  });
}
