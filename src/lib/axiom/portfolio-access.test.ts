import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";
import {
  canModeratePortfolio,
  canStaffWritePortfolio,
  defaultUploadStatus,
  isPublicPortfolioStatus,
  parsePortfolioStatus,
  parsePortfolioTags,
  publicCanViewPortfolio,
} from "./portfolio-access.ts";

const repo = join(dirname(fileURLToPath(import.meta.url)), "../../..");

describe("portfolio RBAC", () => {
  it("keeps customers on approved work and staff on their own profile", () => {
    const owner = { userId: "o1", role: "owner" as const };
    const stylist = { userId: "e1", role: "employee" as const, employeeId: "emp_1" };
    const other = { userId: "e2", role: "employee" as const, employeeId: "emp_2" };
    const guest = { userId: "c1", role: "customer" as const };
    assert.equal(canStaffWritePortfolio(stylist, "emp_1"), true);
    assert.equal(canStaffWritePortfolio(stylist, "emp_2"), false);
    assert.equal(canStaffWritePortfolio(guest, "emp_1"), false);
    assert.equal(canStaffWritePortfolio(owner, "emp_2"), true);
    assert.equal(canModeratePortfolio(owner), true);
    assert.equal(canModeratePortfolio(stylist), false);
    assert.equal(publicCanViewPortfolio("pending", guest, "emp_1"), false);
    assert.equal(publicCanViewPortfolio("pending", stylist, "emp_1"), true);
    assert.equal(publicCanViewPortfolio("pending", other, "emp_1"), false);
    assert.equal(publicCanViewPortfolio("approved", guest, "emp_1"), true);
    assert.equal(defaultUploadStatus(stylist), "pending");
    assert.equal(defaultUploadStatus(owner), "approved");
    assert.equal(parsePortfolioStatus(""), "pending");
    assert.equal(parsePortfolioStatus(null), "pending");
    assert.equal(isPublicPortfolioStatus("pending"), false);
    assert.equal(isPublicPortfolioStatus("approved"), true);
    assert.deepEqual(parsePortfolioTags("Fade, Color, sleeve!!"), ["fade", "color", "sleeve"]);
  });

  it("locks SQL writes to the staff profile id and lets owners override", () => {
    const sql = readFileSync(join(repo, "migrations/0077_portfolio_oversight.sql"), "utf8");
    const server = readFileSync(join(repo, "src/lib/axiom/shop-server.server.ts"), "utf8");
    assert.match(sql, /is_staff_profile/);
    assert.match(sql, /claimed_user_id = app_current_user_id/);
    assert.match(sql, /portfolio_staff_write/);
    assert.match(sql, /portfolio_owner_write/);
    assert.match(sql, /status = 'approved'/);
    assert.match(server, /canStaffWritePortfolio/);
    assert.match(server, /canModeratePortfolio/);
    assert.match(server, /employee_id = \$\{actor\.employeeId\}/);
  });
});
