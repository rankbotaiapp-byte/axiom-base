import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, it } from "node:test";
import { catalogByFilm } from "../config/catalog.ts";

describe("Apex Launch Control film", () => {
  it("ships the GT3 loop on Auto and on the public media path", () => {
    const disk = join(process.cwd(), "public", "media", "apex-launch-hero-animation.mp4");
    assert.equal(existsSync(disk), true);
    assert.equal(catalogByFilm("apex-launch-hero-animation.mp4")?.id, "auto");
    assert.equal(catalogByFilm("apex-launch-control-hero-animation.mp4")?.id, "auto");
  });
});
