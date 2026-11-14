import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";
import {
  MEDIA_LIBRARY,
  isMediaLibraryUrl,
  mediaForNiche,
  mediaLibraryLoops,
  mediaStudioLoopOptions,
  pickMediaForNiche,
} from "./mediaLibrary.ts";

describe("media library index", () => {
  it("indexes loops and stills under public/media with themes", () => {
    const dir = fileURLToPath(new URL("../../public", import.meta.url));
    assert.ok(MEDIA_LIBRARY.length > 80);
    assert.ok(mediaLibraryLoops().length > 20);
    const urls = new Set<string>();
    for (const asset of MEDIA_LIBRARY) {
      assert.equal(urls.has(asset.url), false, asset.url);
      urls.add(asset.url);
      assert.equal(asset.url.startsWith("/media/"), true);
      assert.equal(existsSync(join(dir, asset.url.replace(/^\//, ""))), true, asset.url);
      assert.ok(asset.niches.length >= 1);
      assert.ok(asset.theme);
    }
    assert.equal(isMediaLibraryUrl("/media/heroes/axiom-landing.mp4"), true);
    assert.equal(isMediaLibraryUrl("/media/../secret.mp4"), false);
  });

  it("picks niche-matched loops for autopilot and studio", () => {
    const plumbing = mediaForNiche("plumbing", "loop");
    assert.ok(plumbing.some((asset) => /plumb/i.test(asset.url + asset.label)));
    const pick = pickMediaForNiche("auto", "loop", 2);
    assert.ok(pick?.url.endsWith(".mp4"));
    const studio = mediaStudioLoopOptions();
    assert.ok(studio.some((row) => row.url === "/media/heroes/axiom-landing.mp4"));
    assert.ok(studio.every((row) => row.url.startsWith("/media/") && row.url.endsWith(".mp4")));
  });
});
