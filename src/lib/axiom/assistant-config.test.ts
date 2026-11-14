import assert from "node:assert/strict";
import test from "node:test";
import {
  customizeAssistant,
  executiveConfig,
  minimalistConfig,
  parseAssistantConfig,
  planAssistantStorage,
} from "./assistant-config.ts";

test("archetype bundles keep only the assistant fields", () => {
  const executive = executiveConfig("Female Human");
  assert.equal(executive.baseType, "Female Human");
  assert.equal(executive.outfit, "Corporate");
  assert.equal(executive.voice, "Professional");
  assert.equal(executive.personality, "Polished");
  assert.equal(executive.selectedArchetype, "The Executive");
  assert.deepEqual(Object.keys(executive).sort(), ["baseType", "hairColor", "outfit", "personality", "selectedArchetype", "voice"]);

  const orb = minimalistConfig();
  assert.equal(orb.baseType, "Colored Orb");
  assert.equal(orb.hairColor, "");
  assert.equal(orb.voice, "Neutral");
});

test("old biometric payloads do not restore", () => {
  assert.equal(
    parseAssistantConfig({
      partnerId: "nyx-vale",
      biometrics: { chest: 88, glutes: 92, lips: 75, jaw: 70, shoulders: 76 },
      enhancementIndex: 55,
    }),
    null,
  );
  const mixed = parseAssistantConfig({
    ...executiveConfig("Male Human"),
    biometrics: { chest: 90, glutes: 80, lips: 70, jaw: 60, shoulders: 50 },
    chest: 90,
    glutes: 80,
    lips: 70,
    jaw: 60,
    shoulders: 50,
  });
  assert.equal(mixed?.voice, "Professional");
  assert.equal(mixed && "biometrics" in mixed, false);
  assert.equal(mixed && "chest" in mixed, false);

  const dirty = JSON.stringify({
    ...executiveConfig("Female Human"),
    chest: 88,
    glutes: 92,
    lips: 75,
    jaw: 70,
    shoulders: 76,
  });
  const rewrite = planAssistantStorage(dirty);
  assert.equal(rewrite.action, "rewrite");
  assert.equal(rewrite.config?.selectedArchetype, "The Executive");
  assert.equal(rewrite.config && "chest" in rewrite.config, false);

  const onlyBody = planAssistantStorage(JSON.stringify({
    biometrics: { chest: 88, glutes: 92, lips: 75, jaw: 70, shoulders: 76 },
  }));
  assert.equal(onlyBody.action, "remove");
  assert.equal(onlyBody.config, null);

  const buried = planAssistantStorage(JSON.stringify({
    ...executiveConfig("Male Human"),
    studio: { morph: { traits: { chest: 40, lips: 12, jaw: 8 } } },
  }));
  assert.equal(buried.action, "rewrite");
  assert.equal(buried.config?.outfit, "Corporate");
  assert.deepEqual(Object.keys(buried.config ?? {}).sort(), ["baseType", "hairColor", "outfit", "personality", "selectedArchetype", "voice"]);

  const nestedOnly = planAssistantStorage(JSON.stringify({
    archive: { v1: { biometrics: { shoulders: 4, jaw: 2, glutes: 9 } } },
  }));
  assert.equal(nestedOnly.action, "remove");
  assert.equal(nestedOnly.config, null);
  assert.equal(planAssistantStorage("{}").action, "remove");
});

test("a saved assistant round-trips and edits become Custom", () => {
  const saved = parseAssistantConfig(executiveConfig("Male Human"));
  assert.equal(saved?.baseType, "Male Human");
  assert.ok(saved);
  const custom = customizeAssistant(saved, { outfit: "Clean" });
  assert.equal(custom.outfit, "Clean");
  assert.equal(custom.selectedArchetype, "Custom");
  assert.equal(custom.voice, "Professional");
});
