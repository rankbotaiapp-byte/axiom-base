import assert from "node:assert/strict";
import test from "node:test";
import { isDatabaseUnavailable } from "./db-availability.mjs";

test("hosted pooler outage is an unavailable database", () => {
  const err = new Error("(EAUTHQUERY) authentication query failed: connection to database not available");
  err.code = "XX000";
  assert.equal(isDatabaseUnavailable(err), true);
  assert.equal(isDatabaseUnavailable({ code: "57P03", message: "the database system is not accepting connections" }), true);
  assert.equal(
    isDatabaseUnavailable(new Error("Hosted Postgres is not accepting connections. Local development is running without it.")),
    true,
  );
});

test("a wrapped connection error is still unavailable", () => {
  const cause = new Error("connect ECONNREFUSED 127.0.0.1:5432");
  cause.code = "ECONNREFUSED";
  assert.equal(isDatabaseUnavailable(new Error("query failed", { cause })), true);
});

test("schema and query failures stay fatal", () => {
  const err = new Error('relation "shops" does not exist');
  err.code = "42P01";
  assert.equal(isDatabaseUnavailable(err), false);
  const internal = new Error("cache lookup failed");
  internal.code = "XX000";
  assert.equal(isDatabaseUnavailable(internal), false);
});
