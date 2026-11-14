import assert from "node:assert/strict";
import test from "node:test";
import { defaultHeroHud, heroHudFromProfile, parseHeroHud, seedSeaPlates } from "./hero-hud.ts";

test("hud buttons keep a place, an icon, and an action", () => {
  const saved = parseHeroHud({
    title: "Night circuit",
    buttons: [
      { id: "hud_pay00001", label: "Instant checkout", icon: "zap", action: "checkout", x: 120, y: -4, phone: "(541) 555-0100", href: "javascript:alert(1)" },
      { id: "nope", label: "Skip", icon: "zap", action: "booking", x: 50, y: 50 },
      { id: "hud_pay00001", label: "Duplicate", icon: "zap", action: "booking", x: 40, y: 40 },
    ],
    plates: [
      {
        id: "plate_identity",
        x: 8,
        y: 92,
        lines: [{ id: "line_name", text: "Night Circuit", href: "/night-circuit/book" }],
      },
    ],
  });
  assert.equal(saved?.title, "Night circuit");
  assert.equal(saved?.buttons.length, 1);
  assert.equal(saved?.buttons[0]?.x, 92);
  assert.equal(saved?.buttons[0]?.y, 8);
  assert.equal(saved?.buttons[0]?.phone, "5415550100");
  assert.equal(saved?.buttons[0]?.href, "");
  assert.equal(saved?.plates[0]?.lines[0]?.text, "Night Circuit");
  assert.equal(saved?.plates[0]?.lines[0]?.href, "/night-circuit/book");
  const defaults = defaultHeroHud();
  assert.equal(defaults.buttons.length, 4);
  assert.equal(defaults.buttons[0]?.y, 20);
  const fromProfile = heroHudFromProfile(JSON.stringify({ heroHud: defaults }));
  assert.equal(fromProfile?.buttons[0]?.action, "help");
  assert.equal(heroHudFromProfile("{}"), null);
  const linked = parseHeroHud({
    buttons: [{ id: "hud_url00001", label: "Site", icon: "zap", action: "url", x: 12, y: 20, href: "https://example.com/book" }],
  });
  assert.equal(linked?.buttons[0]?.action, "url");
  assert.equal(linked?.buttons[0]?.href, "https://example.com/book");
  assert.equal(linked?.buttons[0]?.response, "externalUrl");
  assert.equal(saved?.buttons[0]?.response, "apiTrigger");
  assert.equal(saved?.buttons[0]?.variant, "neon-glass");
  const burst = parseHeroHud({
    buttons: [{
      id: "hud_burst001",
      label: "Go",
      icon: "zap",
      action: "booking",
      response: "scrollTo",
      variant: "liquid-metal",
      clickAnimation: "particle-burst",
      successMessage: "Booked",
      x: 20,
      y: 20,
      href: "#services",
    }],
  });
  assert.equal(burst?.buttons[0]?.clickAnimation, "particle-burst");
  assert.equal(burst?.buttons[0]?.variant, "liquid-metal");
  assert.equal(burst?.buttons[0]?.href, "#services");
  assert.equal(burst?.buttons[0]?.successMessage, "Booked");
  assert.equal(burst?.buttons[0]?.action, "booking");
  const sea = seedSeaPlates({ title: "", buttons: [], plates: [] }, {
    name: "Reef",
    tagline: "Quiet work",
    city: "Portland",
    badge: "",
    bookHref: "/reef/book",
    services: [],
  });
  assert.equal(sea.plates.some((plate) => plate.id === "plate_proof"), true);
  assert.equal(sea.plates.some((plate) => plate.id === "plate_reviews"), true);
});
