import assert from "node:assert/strict";
import test from "node:test";
import { buildAutopilotDryRun, homeCountyName } from "./autopilot-dry-run.ts";

test("dry-run formats the three home counties and never names a provider", () => {
  const run = buildAutopilotDryRun({
    origin: "http://127.0.0.1:8080",
    shops: [
      { id: "shop_a", slug: "night-circuit", name: "Night Circuit", niche: "auto", billing: "active" },
      { id: "shop_b", slug: "paused", name: "Paused", niche: "barber", billing: "canceled" },
    ],
    cues: [
      { kind: "social", id: "soc_1", shopSlug: "night-circuit", county: "", status: "draft", detail: "New loop" },
      { kind: "outreach", id: "dsp_1", shopSlug: "", county: "Josephine County", status: "queued", detail: "pending batch" },
    ],
    leads: [
      lead("Jackson County", "Medford", "lead-j", "ada@example.test", "5415551001"),
      lead("Josephine", "Grants Pass", "lead-jo", "bea@example.test", ""),
      lead("DOUGLAS COUNTY", "Roseburg", "lead-d", "", "5415551003"),
      lead("Lane County", "Eugene", "lead-no", "nope@example.test", "5415551004"),
    ],
  });

  assert.equal(run.mode, "simulation");
  assert.equal(run.providers, "none");
  assert.deepEqual(run.shops.map((shop) => shop.slug), ["night-circuit"]);
  assert.deepEqual(
    run.payloads.map((row) => row.county),
    ["Jackson County", "Josephine County", "Douglas County"],
  );
  assert.equal(run.payloads.some((row) => row.county === "Jackson County" && row.cue === "social"), true);
  assert.equal(run.payloads.some((row) => row.leadSlug === "lead-no"), false);
  assert.match(run.payloads[0]?.body ?? "", /Jackson County/);
  assert.match(run.payloads[0]?.body ?? "", /127\.0\.0\.1:8080/);
  assert.equal(run.logs.length, 3);
  assert.equal(run.logs.every((row) => row.status === "simulated" && row.summary.includes("providers none")), true);
  assert.equal(homeCountyName("josephine county"), "Josephine County");
});

function lead(county: string, city: string, slug: string, email: string, phone: string) {
  return {
    id: slug,
    leadSlug: slug,
    businessName: slug,
    city,
    county,
    tradeType: "auto",
    email,
    phone,
  };
}
