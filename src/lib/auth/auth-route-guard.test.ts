import assert from "node:assert/strict";
import { test } from "node:test";
import { DatabaseConfigError } from "../db-url.ts";
import { handleAuthRequest } from "./auth-route-guard.ts";

test("get-session maps ENOTFOUND / getaddrinfo to 503 JSON with null session", async () => {
  const dns = Object.assign(new Error("getaddrinfo ENOTFOUND db.invalid"), { code: "ENOTFOUND" });
  const res = await handleAuthRequest(new Request("https://axiom.test/api/auth/get-session"), async () => {
    throw dns;
  });
  assert.equal(res.status, 503);
  const json = await res.json();
  assert.equal(json.session, null);
  assert.equal(json.user, null);
  assert.equal(json.code, "DB_UNAVAILABLE");
});

test("get-session maps malformed DATABASE_URL config errors to 503 JSON", async () => {
  const res = await handleAuthRequest(new Request("https://axiom.test/api/auth/get-session"), async () => {
    throw new DatabaseConfigError("DATABASE_URL is not a usable Postgres URL");
  });
  assert.equal(res.status, 503);
  const json = await res.json();
  assert.equal(json.session, null);
  assert.equal(json.code, "DB_UNAVAILABLE");
});

test("get-session unknown failures still return JSON instead of throwing", async () => {
  const res = await handleAuthRequest(new Request("https://axiom.test/api/auth/get-session"), async () => {
    throw new TypeError("Failed to fetch");
  });
  assert.equal(res.status, 503);
  const json = await res.json();
  assert.equal(json.session, null);
  assert.equal(typeof json.error, "string");
});
