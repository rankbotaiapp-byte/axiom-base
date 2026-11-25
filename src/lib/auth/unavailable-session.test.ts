import assert from "node:assert/strict";
import { test } from "node:test";
import {
  AUTH_SESSION_UNAVAILABLE_CODE,
  isAuthGetSessionPath,
  unavailableAuthSessionBody,
  unavailableAuthSessionResponse,
} from "./unavailable-session";

test("get-session fail-closed payload is JSON with null session", () => {
  const body = unavailableAuthSessionBody();
  assert.equal(body.session, null);
  assert.equal(body.user, null);
  assert.equal(body.code, AUTH_SESSION_UNAVAILABLE_CODE);
  assert.equal(typeof body.error, "string");
});

test("get-session unavailable response is 503 JSON", async () => {
  const res = unavailableAuthSessionResponse();
  assert.equal(res.status, 503);
  const json = await res.json();
  assert.equal(json.session, null);
  assert.equal(json.user, null);
  assert.equal(json.code, "DB_UNAVAILABLE");
});

test("get-session path matcher", () => {
  assert.equal(isAuthGetSessionPath("/api/auth/get-session"), true);
  assert.equal(isAuthGetSessionPath("/api/auth/sign-in"), false);
});
