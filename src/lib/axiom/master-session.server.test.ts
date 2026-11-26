import assert from "node:assert/strict";
import { test } from "node:test";
import { failClosedMasterSession, masterSessionUnavailable } from "./master-session-response";
import { DB_UNAVAILABLE_CODE, DESK_CHECK_TIMEOUT_CODE, SessionProbeError } from "@/lib/auth/desk-budget";

test("503 JSON distinguishes DB_UNAVAILABLE from DESK_CHECK_TIMEOUT", async () => {
  const db = await masterSessionUnavailable(DB_UNAVAILABLE_CODE).json();
  const desk = await masterSessionUnavailable(DESK_CHECK_TIMEOUT_CODE).json();
  assert.equal(db.code, "DB_UNAVAILABLE");
  assert.equal(desk.code, "DESK_CHECK_TIMEOUT");
  assert.notEqual(db.error, desk.error);
  assert.equal(db.session, null);
  assert.equal(desk.user, null);
});

test("fail-closed maps abort and probe errors without throwing", async () => {
  const abort = new Error("aborted");
  abort.name = "AbortError";
  const timeoutRes = failClosedMasterSession(abort);
  assert.equal(timeoutRes.status, 503);
  assert.equal((await timeoutRes.json()).code, "DESK_CHECK_TIMEOUT");

  const db = failClosedMasterSession(new SessionProbeError(DB_UNAVAILABLE_CODE, "Database is unavailable"));
  assert.equal(db.status, 503);
  assert.equal((await db.json()).code, "DB_UNAVAILABLE");

  const typed = failClosedMasterSession(new TypeError("Failed to fetch"));
  assert.equal(typed.status, 500);
  const typedBody = await typed.json();
  assert.equal(typedBody.session, null);
  assert.equal(typedBody.error, "Master session failed.");

  const missing = failClosedMasterSession(Object.assign(new Error("Missing master session"), { status: 401 }));
  assert.equal(missing.status, 401);
});
