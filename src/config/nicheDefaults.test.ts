import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";
import { CATALOG } from "./catalog.ts";
import {
  DEFAULT_PROOF_SVG,
  LOCAL_PROOF_PLATES,
  nicheProofPlates,
  proofSrcCandidates,
  resolveProofSrc,
} from "./nicheDefaults.ts";

const root = join(import.meta.dirname, "../..");

test("shipped SVG proof plates exist on disk", () => {
  for (const rel of LOCAL_PROOF_PLATES) {
    const file = join(root, "public", rel.slice(1));
    assert.equal(existsSync(file), true, rel);
  }
});

test("every catalog niche resolves a non-empty proof cascade", () => {
  for (const row of CATALOG) {
    const plates = nicheProofPlates(row.id);
    assert.equal(plates.length, 3, row.id);
    for (const plate of plates) {
      const src = resolveProofSrc(plate);
      assert.ok(src, row.id);
      assert.ok(src.startsWith("/media/") || src.startsWith("https://"), `${row.id} → ${src}`);
      const candidates = proofSrcCandidates(plate);
      assert.ok(candidates.includes(DEFAULT_PROOF_SVG) || candidates.some((c) => c.endsWith(".svg")));
      assert.ok(candidates.some((c) => c.startsWith("https://images.unsplash.com/")));
    }
  }
});
