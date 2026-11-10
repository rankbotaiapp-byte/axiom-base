import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  ELECTRICAL_METER_SRC,
  FOUNDER_GREETING_SRC,
  HEART_GEARS_SRC,
  HERO_FEED,
  LIQUID_WRENCH_SRC,
  PLUMBERS_DRAIN_SRC,
  SHOWCASE_TABS,
  heroFeedSources,
  isFounderGreetingFilm,
  showcaseSources,
} from "./storefront-films.ts";

describe("storefront film hierarchy", () => {
  it("keeps greeting out of the hero feed and showcase tabs", () => {
    assert.equal(isFounderGreetingFilm(FOUNDER_GREETING_SRC), true);
    for (const src of [...heroFeedSources(), ...showcaseSources()]) {
      assert.equal(isFounderGreetingFilm(src), false, src);
    }
  });

  it("keeps heart gears aliased from the brief and liquid/meter as distinct mechanics films", () => {
    assert.equal(HEART_GEARS_SRC, "/media/axioms-heart.mp4");
    assert.deepEqual(
      HERO_FEED.map((tab) => tab.src),
      [HEART_GEARS_SRC, LIQUID_WRENCH_SRC, ELECTRICAL_METER_SRC],
    );
  });

  it("keeps the public showcase on mechanical films only", () => {
    assert.equal(
      SHOWCASE_TABS.some((tab) => tab.src === PLUMBERS_DRAIN_SRC),
      false,
    );
    assert.ok(SHOWCASE_TABS.some((tab) => tab.src === HEART_GEARS_SRC));
    assert.ok(SHOWCASE_TABS.some((tab) => tab.src === LIQUID_WRENCH_SRC));
    assert.ok(SHOWCASE_TABS.some((tab) => tab.src === ELECTRICAL_METER_SRC));
  });
});
