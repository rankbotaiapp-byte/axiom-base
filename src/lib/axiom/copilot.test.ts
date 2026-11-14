import assert from "node:assert/strict";
import test from "node:test";
import { DEFAULT_HUD } from "./hud.ts";
import { readFileSync } from "node:fs";
import {
  applyStylePatch,
  capHistory,
  emptyPatch,
  heroGenerationPrompt,
  packBusinessMemory,
  parseCopilotJson,
  parseCopilotTurn,
  parseStylePatch,
  promoteStagedHero,
  publicHeroUrl,
  rememberPrompt,
  sanitizeAssetUrl,
  stageHero,
  stageLibraryHero,
  stagingFrame,
  styleDiff,
  unpackBusinessMemory,
} from "./copilot.ts";

test("style actions keep the closed set and drop css, html, and code", () => {
  const turn = parseCopilotTurn({
    reply: "More aggressive, matched to the blue accent.",
    style: {
      accent: "#24a",
      edgeFeather: 80,
      glow: 50,
      cardOpacity: 0.66,
      blur: 28,
      borderGlow: "on",
      headline: "Night <b>hunt</b>",
      displacement: 32,
      proximity: 220,
      springDamping: 14,
      css: "body { color: red; }",
      html: "<script>alert(1)</script>",
      code: "eval('alert(1)')",
      wash: "ember",
      scan: false,
    },
    hero: {
      medium: "image",
      prompt: "A tiger, more aggressive, blue accent #2244AA",
    },
    code: "document.body.style.cssText = 'color:red'",
  });
  assert.equal(turn.style.accent, "#2244AA");
  assert.equal(turn.style.edgeFeather, 76);
  assert.equal(turn.style.glow, 50);
  assert.equal(turn.style.cardOpacity, 2);
  assert.equal(turn.style.blur, 2);
  assert.equal(turn.style.borderGlow, true);
  assert.equal(turn.style.headline, "Night hunt");
  assert.equal("displacement" in turn.style, false);
  assert.equal("proximity" in turn.style, false);
  assert.equal("springDamping" in turn.style, false);
  assert.equal("css" in turn.style, false);
  assert.equal("wash" in turn.style, false);
  assert.equal(turn.hero?.medium, "image");
  assert.match(turn.hero?.prompt ?? "", /tiger/);
  assert.equal("code" in turn, false);
});

test("clamps out-of-range numbers onto the storefront steps", () => {
  const patch = parseStylePatch({
    edgeFeather: 100,
    glow: -4,
    cardOpacity: 90,
    blur: 100,
    displacement: 3,
    proximity: 10,
    springDamping: 100,
    borderGlow: "off",
  });
  assert.equal(patch.edgeFeather, 92);
  assert.equal(patch.glow, 0);
  assert.equal(patch.cardOpacity, 3);
  assert.equal(patch.blur, 3);
  assert.equal("displacement" in patch, false);
  assert.equal("proximity" in patch, false);
  assert.equal("springDamping" in patch, false);
  assert.equal(patch.borderGlow, false);
});

test("colors are hex only", () => {
  assert.equal(parseStylePatch({ accent: "red" }).accent, undefined);
  assert.equal(parseStylePatch({ accent: "expression(alert(1))" }).accent, undefined);
  assert.equal(parseStylePatch({ accent: "#12345" }).accent, undefined);
  assert.equal(parseStylePatch({ accent: "#abc" }).accent, "#AABBCC");
  assert.equal(parseStylePatch({ accent: "  #00ffcc " }).accent, "#00FFCC");
});

test("junk payloads and script prompts produce no actions", () => {
  assert.equal(emptyPatch(parseCopilotTurn("body { color: red }").style), true);
  assert.equal(parseCopilotTurn(null).hero, null);
  const blocked = parseCopilotTurn({
    hero: { medium: "video", prompt: "javascript:alert(1)" },
    style: { headline: "<img src=x onerror=alert(1)>" },
  });
  assert.equal(blocked.hero, null);
  assert.equal(blocked.style.headline, undefined);
  const fenced = parseCopilotJson('```json\n{"reply":"Hold","style":{"glow":25},"hero":{"medium":"film","prompt":"nope"}}\n```');
  assert.equal(fenced.reply, "Hold");
  assert.equal(fenced.style.glow, 25);
  assert.equal(fenced.hero, null);
});

test("an action list maps a hero sentence onto a prompt plus style fields", () => {
  const turn = parseCopilotTurn({
    reply: "I would push the tiger and keep the blue.",
    actions: [
      { type: "css", css: ".hero{filter:blur(40px)}" },
      { type: "code", code: "fetch('/api')" },
      {
        type: "style",
        accent: "#3366FF",
        displacement: 32,
        edgeFeather: 44,
      },
      {
        type: "hero",
        medium: "image",
        prompt: "Make the tiger more aggressive and match accent #3366FF",
      },
    ],
  });
  assert.equal(turn.style.accent, "#3366FF");
  assert.equal("displacement" in turn.style, false);
  assert.equal(turn.style.edgeFeather, 44);
  assert.equal(turn.hero?.prompt, "Make the tiger more aggressive and match accent #3366FF");
  assert.equal(emptyPatch(parseStylePatch({ css: "a{color:red}" })), true);
});

test("apply and diff touch only the confirmed fields", () => {
  const patch = parseStylePatch({ accent: "#112233", borderGlow: false, blur: 40 });
  const next = applyStylePatch({ ...DEFAULT_HUD, wash: "tide", heroPick: "film", heroUrl: "/media/heroes/live.jpg" }, patch);
  assert.equal(next.wash, "tide");
  assert.equal(next.rim, false);
  assert.equal(next.blur, 3);
  assert.equal(next.fade, DEFAULT_HUD.fade);
  assert.equal(next.heroPick, "film");
  assert.equal(next.heroUrl, "/media/heroes/live.jpg");
  const lines = styleDiff({ accent: "#C8F54A", hud: DEFAULT_HUD }, patch);
  assert.deepEqual(
    lines.map((line) => line.field),
    ["accent", "blur", "borderGlow"],
  );
  assert.equal(sanitizeAssetUrl("javascript:alert(1)"), "");
  assert.equal(sanitizeAssetUrl("/media/heroes/leopard.mp4"), "/media/heroes/leopard.mp4");
  assert.equal(sanitizeAssetUrl("/media/heroes/charging-bear.mp4"), "/media/heroes/charging-bear.mp4");
  assert.equal(sanitizeAssetUrl("/media/../secret.png"), "");
  assert.equal(sanitizeAssetUrl("https://cdn.example/tiger.png"), "https://cdn.example/tiger.png");
});

test("an unconfirmed staged hero is not the public hero", () => {
  const staged = stageHero("https://cdn.example/tiger.png", "image", "A tiger on obsidian");
  assert.ok(staged);
  const live = { ...DEFAULT_HUD, heroPick: "film" as const, heroUrl: "/media/heroes/live.jpg" };
  assert.equal(publicHeroUrl(live, staged.url), "");
  assert.notEqual(publicHeroUrl(live, staged.url), staged.url);
  assert.equal(stageHero("javascript:alert(1)", "image", "tiger"), null);
  assert.equal(stageHero("http://cdn.example/tiger.png", "image", "tiger"), null);
  assert.equal(promoteStagedHero(live, stageHero("/media/../secret.png", "image", "tiger")).heroPick, "film");
  const promoted = promoteStagedHero(live, staged);
  assert.equal(promoted.heroPick, "url");
  assert.equal(promoted.heroUrl, staged.url);
  assert.equal(publicHeroUrl(promoted, staged.url), staged.url);
  const prompt = heroGenerationPrompt("Make the tiger more aggressive", "red");
  assert.match(prompt, /#050507/);
  assert.match(prompt, /Soft alpha-edge feathering/);
  assert.match(prompt, /no hard rectangular frame/);
  assert.doesNotMatch(prompt, /\bred\b/);
  assert.match(heroGenerationPrompt("tiger", "#36f"), /#3366FF/);
});

test("history and prompts stay short", () => {
  const history = capHistory(
    Array.from({ length: 10 }, (_, index) => ({ role: index % 2 ? "assistant" : "user", content: `m${index}` })),
  );
  assert.equal(history.length, 6);
  assert.equal(history[0]?.content, "m4");
  assert.deepEqual(rememberPrompt(["one", "<b>two</b>"], "three", 2), ["two", "three"]);
});

test("an unconfirmed local film is not the public hero", () => {
  const leopard = stageLibraryHero("leopard");
  const bear = stageLibraryHero("bear");
  const kayak = stageLibraryHero("kayak");
  assert.equal(leopard?.url, "/media/heroes/leopard.mp4");
  assert.equal(bear?.url, "/media/heroes/charging-bear.mp4");
  const confirmedBear = { ...DEFAULT_HUD, heroPick: "url" as const, heroUrl: "/media/heroes/charging-bear.mp4" };
  assert.equal(publicHeroUrl(confirmedBear, leopard?.url ?? ""), "/media/heroes/charging-bear.mp4");
  assert.notEqual(publicHeroUrl(confirmedBear, leopard?.url ?? ""), leopard?.url);
  assert.equal(kayak?.url, "/media/heroes/white-water-rafting.mp4");
  assert.equal(stageLibraryHero("javascript:alert(1)"), null);
  const live = { ...DEFAULT_HUD, heroPick: "film" as const, heroUrl: "" };
  const frame = stagingFrame(live, "#C8F54A", { accent: "#3366FF", glow: 75, blur: 28, edgeFeather: 44 }, leopard);
  assert.equal(frame.previewUrl, leopard?.url);
  assert.equal(frame.hud.heroPick, "film");
  assert.equal(frame.hud.heroUrl, "");
  assert.equal(frame.hud.glow, 75);
  assert.equal(frame.hud.fade, 44);
  assert.equal(frame.accent, "#3366FF");
  assert.equal(live.glow, DEFAULT_HUD.glow);
  assert.equal(publicHeroUrl(live, frame.previewUrl), "");
  assert.notEqual(publicHeroUrl(live, frame.previewUrl), frame.previewUrl);
  const confirmed = promoteStagedHero(live, leopard);
  assert.equal(publicHeroUrl(confirmed, leopard?.url ?? ""), leopard?.url);
});

test("memory payload round-trips brand notes, style tokens, aesthetic, and prompts", () => {
  const packed = packBusinessMemory({
    brandNotes: "Night <b>hunts</b>",
    styleTokens: {
      accent: "#36f",
      glow: 50,
      blur: 28,
      edgeFeather: 76,
      css: "body{color:red}",
    },
    aesthetic: "soft feather, obsidian",
    pastPrompts: ["aggressive subject", "match accent"],
  });
  const again = unpackBusinessMemory(JSON.stringify(packed));
  assert.equal(again.brandNotes, "Night hunts");
  assert.equal(again.styleTokens.accent, "#3366FF");
  assert.equal(again.styleTokens.glow, 50);
  assert.equal(again.styleTokens.blur, 2);
  assert.equal(again.styleTokens.edgeFeather, 76);
  assert.equal("css" in again.styleTokens, false);
  assert.equal(again.aesthetic, "soft feather, obsidian");
  assert.deepEqual(again.pastPrompts, ["aggressive subject", "match accent"]);
  const sql = readFileSync(new URL("../../../migrations/0057_business_memories.sql", import.meta.url), "utf8");
  assert.match(sql, /create table if not exists business_memories/i);
  assert.match(sql, /shop_id\s+text primary key references shops/i);
  assert.match(sql, /brand_notes/);
  assert.match(sql, /style_tokens/);
  assert.match(sql, /aesthetic_preferences/);
  assert.match(sql, /past_prompts/);
  assert.match(sql, /shop_copilot_memory/);
  assert.doesNotMatch(sql, /drop table/i);
});
