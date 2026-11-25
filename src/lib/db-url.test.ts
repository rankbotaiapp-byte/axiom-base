import assert from "node:assert/strict";
import test from "node:test";
import { inspectDatabaseUrl } from "./db-url.ts";

test("DATABASE_URL inspection never requires the password and flags placeholders", () => {
  assert.equal(inspectDatabaseUrl(undefined).set, false);
  const ok = inspectDatabaseUrl("postgresql://user:secret@db.neon.tech/neondb");
  assert.equal(ok.set, true);
  assert.equal(ok.protocolOk, true);
  assert.equal(ok.parseOk, true);
  assert.equal(ok.placeholderHost, false);
  assert.equal(inspectDatabaseUrl("postgres://u:p@db.example.com/app", { production: true }).placeholderHost, true);
  assert.equal(inspectDatabaseUrl("postgres://u:p@localhost:5432/app", { production: true }).cloudRisk, true);
  assert.equal(inspectDatabaseUrl("not-a-dsn").protocolOk, false);
  assert.doesNotMatch(JSON.stringify(ok), /secret/);
});
