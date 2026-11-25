import { config } from "dotenv";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
config({ path: join(root, ".env") });
config({ path: join(root, ".env.local"), override: false });

function shape(parsed) {
  if (parsed == null) return { kind: "null" };
  if (typeof parsed !== "object") return { kind: typeof parsed };
  return {
    kind: "object",
    keys: Object.keys(parsed),
    session: parsed.session === null ? "null" : typeof parsed.session,
    user: parsed.user === null ? "null" : typeof parsed.user,
    code: typeof parsed.code === "string" ? parsed.code : typeof parsed.code,
    error: typeof parsed.error,
    attached: typeof parsed.attached,
    access: typeof parsed.access,
  };
}

async function probe(url, opts = {}) {
  const res = await fetch(url, { ...opts, signal: opts.signal ?? AbortSignal.timeout(20000) });
  const text = await res.text();
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch {
    parsed = undefined;
  }
  const setCookie = res.headers.getSetCookie?.() ?? [];
  console.log(
    JSON.stringify({
      path: new URL(url).pathname,
      method: opts.method || "GET",
      status: res.status,
      contentType: res.headers.get("content-type"),
      parseOk: parsed !== undefined,
      bytes: Buffer.byteLength(text),
      setCookieCount: setCookie.length,
      shape: parsed === undefined ? null : shape(parsed),
    }),
  );
  return { res, parsed, setCookie };
}

const base = "http://127.0.0.1:3000";
const bypassConfigured = Boolean(process.env.MASTER_ADMIN_BYPASS_KEY?.trim());

try {
  const first = await probe(`${base}/api/auth/get-session`);
  const chained = await probe(`${base}/api/master/session`);
  const concurrent = await Promise.all([
    probe(`${base}/api/auth/get-session`),
    probe(`${base}/api/master/session`),
  ]);
  const bad = await probe(`${base}/api/master/session`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ key: "not-the-bypass-key" }),
  });

  let good = { skipped: true };
  if (bypassConfigured) {
    const claimed = await probe(`${base}/api/master/session`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ key: process.env.MASTER_ADMIN_BYPASS_KEY }),
    });
    const cookie = claimed.setCookie.map((c) => c.split(";")[0]).join("; ");
    const after = await probe(`${base}/api/master/session`, {
      headers: cookie ? { cookie } : {},
    });
    good = {
      skipped: false,
      claimStatus: claimed.res.status,
      followGetStatus: after.res.status,
      attached: after.parsed?.attached === true,
    };
  }

  console.log(
    JSON.stringify({
      summary: {
        getSessionStatus: first.res.status,
        getSessionEmpty: first.parsed == null || first.parsed?.session == null,
        chainedMasterStatus: chained.res.status,
        chainedMasterEmpty:
          chained.parsed?.session === null && chained.parsed?.user === null && chained.parsed?.attached === false,
        concurrentStatuses: concurrent.map((item) => item.res.status),
        badBypassStatus: bad.res.status,
        bypassConfigured,
        validBypass: good,
      },
    }),
  );
} catch (err) {
  console.log(JSON.stringify({ liveServer: false, errorName: err?.name }));
  process.exitCode = 1;
}
