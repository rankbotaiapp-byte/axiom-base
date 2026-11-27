/**
 * Desk session smoke: GET + bad POST + optional good POST.
 * Never prints the bypass key or cookie value.
 */
import { config } from "dotenv";

config({ path: ".env.local" });
config({ path: ".env" });

const origin = process.argv[2] || "http://127.0.0.1:3001";

async function main() {
  const get = await fetch(`${origin}/api/master/session`, { credentials: "include" });
  const getBody = await get.json().catch(() => ({}));
  console.log(
    JSON.stringify({
      getStatus: get.status,
      attached: getBody.attached === true,
      configured: getBody.configured === true,
      access: getBody.access ?? "unknown",
    }),
  );

  const bad = await fetch(`${origin}/api/master/session`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ key: "not-a-valid-master-bypass" }),
  });
  const badBody = await bad.json().catch(() => ({}));
  console.log(
    JSON.stringify({
      badPostStatus: bad.status,
      badAttached: badBody.attached === true,
      hasError: typeof badBody.error === "string",
    }),
  );

  const key = process.env.MASTER_ADMIN_BYPASS_KEY?.trim() ?? "";
  if (key.length < 16) {
    console.log(JSON.stringify({ goodPost: "skipped", reason: "bypass key not configured in env" }));
    process.exit(bad.status === 401 || bad.status === 409 ? 0 : 1);
  }

  const jar = new Map();
  const good = await fetch(`${origin}/api/master/session`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ key }),
  });
  const setCookie = good.headers.getSetCookie?.() ?? [];
  for (const line of setCookie) {
    const pair = line.split(";")[0];
    const eq = pair.indexOf("=");
    if (eq > 0) jar.set(pair.slice(0, eq), "set");
  }
  const goodBody = await good.json().catch(() => ({}));
  console.log(
    JSON.stringify({
      goodPostStatus: good.status,
      goodAttached: goodBody.attached === true,
      cookieSet: jar.has("axiom_master") || [...jar.keys()].some((k) => /master/i.test(k)),
    }),
  );
  process.exit(good.ok && goodBody.attached === true ? 0 : 1);
}

main().catch((err) => {
  console.error("[verify-master-session] failed:", err instanceof Error ? err.message : "error");
  process.exit(1);
});
