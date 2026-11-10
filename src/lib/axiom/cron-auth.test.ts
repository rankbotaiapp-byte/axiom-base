import assert from "node:assert/strict";
import test from "node:test";
import { cronTokenValid, extractCronToken, requireCronSecret } from "./cron-auth.server.ts";

test("extractCronToken reads Bearer, headers, and query", () => {
  assert.equal(
    extractCronToken(
      new Request("http://localhost/api/outreach/cron", {
        headers: { authorization: "Bearer secret-one" },
      }),
    ),
    "secret-one",
  );
  assert.equal(
    extractCronToken(
      new Request("http://localhost/api/outreach/cron", {
        headers: { "x-cron-secret": "secret-two" },
      }),
    ),
    "secret-two",
  );
  assert.equal(
    extractCronToken(new Request("http://localhost/api/outreach/cron?cron_secret=secret-three")),
    "secret-three",
  );
});

test("requireCronSecret returns 401 when no secret is configured", () => {
  const prevCron = process.env.CRON_SECRET;
  const prevOutreach = process.env.OUTREACH_CRON_SECRET;
  try {
    delete process.env.CRON_SECRET;
    delete process.env.OUTREACH_CRON_SECRET;
    const denied = requireCronSecret(new Request("http://localhost/api/outreach/cron"));
    assert.ok(denied);
    assert.equal(denied!.status, 401);
  } finally {
    if (prevCron === undefined) delete process.env.CRON_SECRET;
    else process.env.CRON_SECRET = prevCron;
    if (prevOutreach === undefined) delete process.env.OUTREACH_CRON_SECRET;
    else process.env.OUTREACH_CRON_SECRET = prevOutreach;
  }
});

test("cronTokenValid accepts CRON_SECRET via Authorization bearer", () => {
  const prev = process.env.CRON_SECRET;
  try {
    process.env.CRON_SECRET = "preflight-cron-token-32chars-min!!";
    delete process.env.OUTREACH_CRON_SECRET;
    const ok = new Request("http://localhost/api/outreach/cron", {
      headers: { authorization: "Bearer preflight-cron-token-32chars-min!!" },
    });
    assert.equal(cronTokenValid(ok), true);
    assert.equal(
      cronTokenValid(new Request("http://localhost/api/outreach/cron", {
        headers: { authorization: "Bearer wrong" },
      })),
      false,
    );
  } finally {
    if (prev === undefined) delete process.env.CRON_SECRET;
    else process.env.CRON_SECRET = prev;
  }
});
