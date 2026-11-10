import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, it } from "node:test";
import { STAGED_EXPERIENCES, isStagedExperienceSlug, stagedExperience } from "./staged-experiences";

describe("staged experiences", () => {
  it("registers every migrated cinematic shop", () => {
    const slugs = STAGED_EXPERIENCES.map((row) => row.slug);
    assert.deepEqual(slugs.sort(), [
      "abyssal-sanctuary",
      "aether",
      "apex-moto-gt3",
      "cyber-augment",
      "drone-hub",
      "land-clearing",
      "otter-adventures",
    ]);
  });

  it("maps media under public/media without relative path breakage", () => {
    for (const row of STAGED_EXPERIENCES) {
      assert.equal(stagedExperience(row.slug)?.path, row.path);
      assert.equal(isStagedExperienceSlug(row.slug), true);
      for (const asset of row.media) {
        assert.ok(asset.startsWith("/media/"), asset);
        const disk = join(process.cwd(), "public", asset.replace(/^\//, ""));
        assert.ok(existsSync(disk), `missing ${asset}`);
      }
    }
  });
});
