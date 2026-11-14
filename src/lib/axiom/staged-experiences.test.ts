import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, it } from "node:test";
import { STAGED_EXPERIENCES, isStagedExperienceSlug, stagedExperience } from "./staged-experiences.ts";

describe("staged experiences", () => {
  it("registers every migrated cinematic shop", () => {
    const slugs = STAGED_EXPERIENCES.map((row) => row.slug);
    for (const need of [
      "abyssal-sanctuary",
      "aether",
      "apex-moto-gt3",
      "cyber-augment",
      "drone-hub",
      "land-clearing",
      "otter-adventures",
    ]) {
      assert.ok(slugs.includes(need), need);
    }
    assert.equal(new Set(slugs).size, slugs.length);
  });

  it("maps media under public/media without relative path breakage", () => {
    for (const row of STAGED_EXPERIENCES) {
      assert.equal(stagedExperience(row.slug)?.path, row.path);
      assert.equal(isStagedExperienceSlug(row.slug), true);
      for (const asset of row.media) {
        assert.ok(asset.startsWith("/media/"), asset);
        const disk = join(process.cwd(), "public", asset.replace(/^\//, ""));
        if (asset.endsWith(".mp4")) {
          assert.ok(existsSync(disk), `missing ${asset}`);
        }
      }
    }
  });
});
