import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import {
  allCompanionArchetypes,
  companionAnnouncement,
  companionArchetype,
  companionPulseFromNotice,
  companionStorageKey,
  companionTradeTool,
  pairCompanionArchetype,
} from "./companion-archetypes.ts";

const root = join(dirname(fileURLToPath(import.meta.url)), "../../..");

test("pairs plumbing, electrical, HVAC, and auto to the four companion archetypes", () => {
  assert.equal(pairCompanionArchetype("rogue-rapid", "plumbing"), "cyber-female");
  assert.equal(pairCompanionArchetype("volt-shop", "electrical"), "cyber-male");
  assert.equal(pairCompanionArchetype("ridge-air", "hvac"), "animatronic");
  assert.equal(pairCompanionArchetype("axiom-auto", "auto"), "predator-mech");
  assert.equal(allCompanionArchetypes().length, 4);
  assert.equal(companionTradeTool("plumbing"), "pipe wrench + camera reel");
  assert.equal(companionStorageKey("Apex Moto"), "axiom-companion-archetype:apex moto");
  const female = companionArchetype("cyber-female");
  assert.equal(female.still, "/assets/avatars/cyber-female-ref.jpg");
  assert.equal(female.loop, "/assets/avatars/cyber-female-intro.mp4");
  assert.equal(companionArchetype("cyber-male").loop, "/assets/avatars/cyber-male-intro.mp4");
  assert.equal(companionArchetype("animatronic").still, "/assets/avatars/animatronic-ref.jpg");
  assert.equal(companionArchetype("predator-mech").loop, "/assets/avatars/predator-intro.mp4");
  for (const row of allCompanionArchetypes()) {
    assert.ok(existsSync(join(root, "public", row.still.replace(/^\//, ""))), row.still);
    assert.ok(existsSync(join(root, "public", row.loop.replace(/^\//, ""))), row.loop);
  }
});

test("voice lines announce emergency calls, one-dollar trials, and autopilot ticks", () => {
  assert.match(
    companionAnnouncement("emergency", { shopName: "Rogue Rapid", city: "Medford", niche: "plumbing" }),
    /24\/7 emergency plumber in Medford/,
  );
  assert.match(
    companionAnnouncement("trial", { shopName: "Rogue Rapid", city: "Medford" }),
    /One dollar trial booking/,
  );
  assert.match(
    companionAnnouncement("autopilot", { shopName: "Apex", city: "Ashland", niche: "auto" }),
    /24\/7 emergency auto repair shop in Ashland/,
  );
});

test("Twilio and inbox notices map onto companion speaker pulses", () => {
  assert.equal(
    companionPulseFromNotice({ id: "1", kind: "booking_request", subject: "Emergency dispatch" }),
    "emergency",
  );
  assert.equal(companionPulseFromNotice({ id: "2", kind: "booking_paid", body: "$1 trial" }), "trial");
  assert.equal(companionPulseFromNotice({ id: "3", channel: "sms", subject: "twilio delivered" }), "autopilot");
});

test("companion HUD modal and chrome are wired on storefront and admin", () => {
  const modal = readFileSync(join(root, "src/components/admin/CompanionHUDModal.tsx"), "utf8");
  const hud = readFileSync(join(root, "src/components/CyberCompanionHud.tsx"), "utf8");
  const storefront = readFileSync(join(root, "src/components/storefront/immutable-storefront.tsx"), "utf8");
  const admin = readFileSync(join(root, "src/routes/$shopSlug/admin.tsx"), "utf8");
  const comms = readFileSync(join(root, "src/lib/axiom/companion-comms.ts"), "utf8");
  const feed = readFileSync(join(root, "src/components/admin/useCompanionLiveFeed.ts"), "utf8");
  assert.match(modal, /companion-hud-layer--bg/);
  assert.match(modal, /companion-hud-layer--avatar/);
  assert.match(modal, /companion-hud-layer--ui/);
  assert.match(comms, /speechSynthesis/);
  assert.match(comms, /navigator\.vibrate/);
  assert.match(comms, /createBiquadFilter/);
  assert.match(hud, /CompanionHUDModal/);
  assert.match(hud, /useCompanionLiveFeed/);
  assert.match(feed, /getOperatorData/);
  assert.match(storefront, /FunnelLayout/);
  const funnel = readFileSync(join(root, "src/components/funnel/FunnelLayout.tsx"), "utf8");
  assert.match(funnel, /ObsidianHudChrome/);
  assert.match(admin, /ObsidianHudChrome/);
  assert.match(admin, /CyberCompanionHud/);
});
