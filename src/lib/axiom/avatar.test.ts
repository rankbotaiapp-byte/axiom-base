import assert from "node:assert/strict";
import test from "node:test";
import { askEricAvatarId, avatarMintAllowed, avatarSessionPayload, cityFromAddress, ericGreeting, ownerWelcome, placeFromCityLine } from "./avatar.ts";

test("Eric greets with the business, trade, and city", () => {
  assert.equal(
    ericGreeting({ businessName: "North Build", trade: "HVAC", city: "Medford" }),
    "Hi. I'm Eric. North Build already has a HVAC page in Medford.",
  );
  assert.match(ericGreeting({ businessName: "  ", trade: "", city: "" }), /your shop/);
  assert.equal(cityFromAddress("12 Oak St, Medford, OR"), "Medford");
  assert.equal(cityFromAddress("Ashland"), "Ashland");
  assert.equal(placeFromCityLine(cityFromAddress("New Era · we come to you")), "New Era");
  assert.equal(placeFromCityLine(cityFromAddress("12 Main Street, New Era")), "New Era");
});

test("the owner desk welcome names Eric and the overnight book", () => {
  const line = ownerWelcome({ businessName: "North Build", trade: "HVAC", city: "Medford" });
  assert.match(line, /I'm Eric, the creator of New Era, powered by Axiom/);
  assert.match(line, /North Build/);
  assert.match(line, /after hours/);
  assert.match(line, /all night/);
});

test("session payload keeps the API key out and fills the business variables", () => {
  assert.equal(askEricAvatarId(), "3cbdf8bc-b3b9-4c2a-8aae-11f03e0b5b96");
  const body = avatarSessionPayload(
    { businessName: "Shear Room", trade: "Hair salon", city: "Ashland" },
    { avatarId: askEricAvatarId(), voiceAgentId: "22222222-2222-2222-2222-222222222222" },
  );
  assert.equal(body.avatar_id, "3cbdf8bc-b3b9-4c2a-8aae-11f03e0b5b96");
  assert.equal(body.mode, "FULL");
  assert.equal(JSON.stringify(body).includes("api_key"), false);
  const agent = body.voice_agent as { dynamic_variables: Record<string, string> };
  assert.equal(agent.dynamic_variables.business, "Shear Room");
  assert.equal(agent.dynamic_variables.trade, "Hair salon");
  assert.equal(agent.dynamic_variables.city, "Ashland");
  assert.equal(body.dynamic_variables, undefined);
});

test("public token mints stay inside a small window", () => {
  const caller = `caller-${Date.now()}`;
  for (let i = 0; i < 8; i += 1) assert.equal(avatarMintAllowed(caller, 1_000), true);
  assert.equal(avatarMintAllowed(caller, 1_000), false);
  assert.equal(avatarMintAllowed(caller, 1_000 + 10 * 60 * 1000), true);
});
