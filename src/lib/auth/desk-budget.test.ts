import assert from "node:assert/strict";
import { test } from "node:test";
import {
  DESK_CHECK_TIMEOUT_CODE,
  DB_UNAVAILABLE_CODE,
  SessionProbeError,
  isAbortTimeoutError,
  runWithAbortBudget,
} from "./desk-budget";

test("abort and timeout errors map to DESK_CHECK_TIMEOUT", () => {
  const abort = new Error("aborted");
  abort.name = "AbortError";
  const timeout = new Error("timeout");
  timeout.name = "TimeoutError";
  assert.equal(isAbortTimeoutError(abort), true);
  assert.equal(isAbortTimeoutError(timeout), true);
  assert.equal(isAbortTimeoutError(new SessionProbeError(DESK_CHECK_TIMEOUT_CODE, "Desk check timed out")), true);
  assert.equal(isAbortTimeoutError(new Error("ENOTFOUND")), false);
});

test("runWithAbortBudget surfaces DESK_CHECK_TIMEOUT instead of hanging", async () => {
  await assert.rejects(
    () =>
      runWithAbortBudget(async (signal) => {
        await new Promise((_, reject) => {
          signal.addEventListener("abort", () => {
            const err = new Error("aborted");
            err.name = "AbortError";
            reject(err);
          });
        });
      }, 20),
    (err: unknown) => {
      assert.ok(err instanceof SessionProbeError);
      assert.equal(err.code, DESK_CHECK_TIMEOUT_CODE);
      assert.equal(err.status, 503);
      return true;
    },
  );
});

test("DB_UNAVAILABLE stays distinct from desk timeout", () => {
  const db = new SessionProbeError(DB_UNAVAILABLE_CODE, "Database is unavailable");
  const desk = new SessionProbeError(DESK_CHECK_TIMEOUT_CODE, "Desk check timed out");
  assert.notEqual(db.code, desk.code);
  assert.equal(db.code, "DB_UNAVAILABLE");
  assert.equal(desk.code, "DESK_CHECK_TIMEOUT");
});
