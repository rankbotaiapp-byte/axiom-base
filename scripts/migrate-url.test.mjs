import assert from "node:assert/strict";
import test from "node:test";
import {
  collectDatabaseUrls,
  ipv4Preference,
  isIpv6OrUnreachableNetworkError,
  pgPoolOptions,
  preferIpv4DatabaseUrl,
  shouldSkipUnreachablePreview,
} from "./migrate-url.mjs";

test("prefers session pooler :5432 over direct db.*.supabase.co", () => {
  const pooler = "postgresql://postgres.ref:x@aws-0-us-east-1.pooler.supabase.com:5432/postgres";
  const direct = "postgresql://postgres:x@db.abcdefgh.supabase.co:5432/postgres";
  assert.equal(preferIpv4DatabaseUrl([direct, pooler]), pooler);
  assert.ok(ipv4Preference(pooler) < ipv4Preference(direct));
});

test("collects DATABASE_URL, POSTGRES_URL, and DIRECT_URL without duplicates", () => {
  const urls = collectDatabaseUrls({
    DATABASE_URL: "postgresql://a@pooler.supabase.com:5432/postgres",
    POSTGRES_URL: "postgresql://a@pooler.supabase.com:5432/postgres",
    DIRECT_URL: "postgresql://a@db.ref.supabase.co:5432/postgres",
  });
  assert.equal(urls.length, 2);
  assert.equal(preferIpv4DatabaseUrl(urls).includes("pooler.supabase.com"), true);
});

test("hosted pool uses TLS with rejectUnauthorized false", () => {
  const opts = pgPoolOptions("postgresql://u:p@aws-0-us-east-1.pooler.supabase.com:5432/postgres");
  assert.deepEqual(opts.ssl, { rejectUnauthorized: false });
  const local = pgPoolOptions("postgresql://postgres:postgres@localhost:5432/axiom");
  assert.equal(local.ssl, false);
});

test("preview ENETUNREACH skips; production stays fatal", () => {
  const err = Object.assign(new Error("connect ENETUNREACH"), { code: "ENETUNREACH" });
  assert.equal(isIpv6OrUnreachableNetworkError(err), true);
  assert.equal(
    shouldSkipUnreachablePreview(err, { VERCEL: "1", VERCEL_ENV: "preview" }),
    true,
  );
  assert.equal(
    shouldSkipUnreachablePreview(err, { VERCEL: "1", VERCEL_ENV: "production" }),
    false,
  );
  const sql = Object.assign(new Error('syntax error at or near "CREAT"'), { code: "42601" });
  assert.equal(shouldSkipUnreachablePreview(sql, { VERCEL: "1", VERCEL_ENV: "preview" }), false);
});
