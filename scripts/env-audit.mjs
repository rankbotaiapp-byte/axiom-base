/**
 * Names-only env audit. Never prints values, hosts, or connection strings.
 */
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const KEYS = [
  "DATABASE_URL",
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "MASTER_ADMIN_BYPASS_KEY",
  "TWILIO_ACCOUNT_SID",
  "TWILIO_AUTH_TOKEN",
  "TWILIO_API_KEY",
  "TWILIO_API_SECRET",
  "STRIPE_SECRET_KEY",
  "STRIPE_WEBHOOK_SECRET",
  "RESEND_API_KEY",
  "REPLICATE_API_TOKEN",
];

function namesInFile(file) {
  if (!existsSync(file)) return new Set();
  const text = readFileSync(file, "utf8");
  const names = new Set();
  for (const match of text.matchAll(/^\s*(?:export\s+)?([A-Z][A-Z0-9_]+)=/gm)) {
    names.add(match[1]);
  }
  return names;
}

function nameSetInValue(text) {
  const names = new Set();
  for (const key of KEYS) {
    if (new RegExp(`\\b${key}\\b`).test(text)) names.add(key);
  }
  return names;
}

function walkSrc(dir, acc = new Set()) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === "node_modules" || entry.name.startsWith(".")) continue;
    const path = join(dir, entry.name);
    if (entry.isDirectory()) walkSrc(path, acc);
    else if (/\.(ts|tsx|js|mjs|md)$/.test(entry.name)) {
      const text = readFileSync(path, "utf8");
      for (const key of nameSetInValue(text)) acc.add(key);
    }
  }
  return acc;
}

function inspectDatabaseUrlShape(raw) {
  const value = String(raw ?? "").trim();
  if (!value) return { set: false, protocolOk: false, parseOk: false, placeholderHost: false, loopbackHost: false };
  const protocolOk = /^postgres(ql)?:\/\//i.test(value);
  let hostname = "";
  let parseOk = false;
  try {
    hostname = new URL(value.replace(/^postgres:\/\//i, "postgresql://")).hostname.toLowerCase();
    parseOk = hostname.length > 0;
  } catch {
    parseOk = false;
  }
  return {
    set: true,
    protocolOk,
    parseOk,
    placeholderHost: hostname === "db.example.com" || hostname === "example.com",
    loopbackHost: hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1",
  };
}

const example = namesInFile(join(root, "env.example"));
const localFiles = [".env", ".env.local", ".env.development", ".env.production"]
  .map((name) => ({ name, names: namesInFile(join(root, name)), exists: existsSync(join(root, name)) }));
const referenced = walkSrc(join(root, "src"));

function present(key) {
  return localFiles.some((file) => file.exists && file.names.has(key));
}

function rawNamedValue(file, key) {
  if (!existsSync(file)) return "";
  const text = readFileSync(file, "utf8");
  const match = text.match(new RegExp(`^\\s*${key}=(.*)$`, "m"));
  if (!match) return "";
  return match[1].trim().replace(/^['"]|['"]$/g, "");
}

const dbRaw =
  process.env.DATABASE_URL ||
  rawNamedValue(join(root, ".env.local"), "DATABASE_URL") ||
  rawNamedValue(join(root, ".env"), "DATABASE_URL");
const dbShape = inspectDatabaseUrlShape(dbRaw);

console.log("Axiom env audit (names only — no values)");
console.log("local env files:", localFiles.filter((f) => f.exists).map((f) => f.name).join(", ") || "(none readable)");
console.log("DATABASE_URL shape:", JSON.stringify(dbShape));
console.log("");
console.log("key\treferenced_in_src\tin_env.example\tpresent_locally\tnotes");
for (const key of KEYS) {
  const notes = [];
  if (key === "TWILIO_API_KEY" || key === "TWILIO_API_SECRET") notes.push("optional; Lookup v2 uses SID+AUTH_TOKEN");
  if (key === "NEXT_PUBLIC_SUPABASE_ANON_KEY" && referenced.has(key) && !example.has(key)) notes.push("was missing from env.example");
  if (key === "DATABASE_URL" && dbShape.set && !dbShape.protocolOk) notes.push("protocol is not postgres(ql)://");
  if (key === "DATABASE_URL" && dbShape.placeholderHost) notes.push("placeholder host");
  if (key === "DATABASE_URL" && dbShape.loopbackHost) notes.push("loopback host — flag for cloud deploys");
  console.log(
    [
      key,
      referenced.has(key) ? "yes" : "no",
      example.has(key) ? "yes" : "no",
      present(key) ? "yes" : "no",
      notes.join("; ") || "",
    ].join("\t"),
  );
}
