import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { defaultUnit, moveRow, moveSection, nextSectionName, renameSection, sectionsOf, unitsForTemplate } from "./menu.ts";

describe("trade price units", () => {
  it("keeps a declared set, and defaults a new line to the first per-unit charge", () => {
    const guide = unitsForTemplate(["flat", "person", "boat"]);
    assert.deepEqual(guide, ["flat", "person", "boat"]);
    assert.equal(defaultUnit(guide), "person");
  });

  it("stays a flat fee when the trade declares nothing", () => {
    assert.deepEqual(unitsForTemplate(undefined), ["flat"]);
    assert.equal(defaultUnit(unitsForTemplate()), "flat");
  });
});

describe("menu sections", () => {
  const rows = [
    { name: "half", group: "Shared" },
    { name: "full", group: "Shared" },
    { name: "private", group: "Private" },
  ];

  it("groups consecutive lines that share a section name", () => {
    assert.deepEqual(sectionsOf(rows), [
      { label: "Shared", start: 0, count: 2 },
      { label: "Private", start: 2, count: 1 },
    ]);
  });

  it("renames every line in a section", () => {
    const renamed = renameSection(rows, 0, 2, "Seat");
    assert.deepEqual(
      renamed.map((row) => row.group),
      ["Seat", "Seat", "Private"],
    );
  });

  it("joins the neighboring section when a line crosses the boundary", () => {
    const moved = moveRow(rows, 2, -1);
    assert.deepEqual(
      moved.map((row) => `${row.group}:${row.name}`),
      ["Shared:half", "Shared:private", "Shared:full"],
    );
  });

  it("swaps whole sections without mixing their lines", () => {
    const moved = moveSection(rows, 1, -1);
    assert.deepEqual(
      moved.map((row) => row.name),
      ["private", "half", "full"],
    );
    assert.equal(moved[0].group, "Private");
  });

  it("names a fresh section without colliding", () => {
    assert.equal(nextSectionName(["Shared"]), "New section");
    assert.equal(nextSectionName(["New section"]), "New section 2");
  });
});
