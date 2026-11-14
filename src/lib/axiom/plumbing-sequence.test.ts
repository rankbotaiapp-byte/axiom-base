import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  PLUMBING_DRAIN_SRC,
  isPlumbingDrainFilm,
  plumbingBeatFromFilm,
  plumbingTelemetryForBeat,
} from "./plumbing-sequence.ts";

describe("plumbing drain telemetry state machine", () => {
  it("binds the catalog drain film", () => {
    assert.equal(PLUMBING_DRAIN_SRC, "/media/plumbers-outreach-hero-animation.mp4");
    assert.equal(isPlumbingDrainFilm(PLUMBING_DRAIN_SRC), true);
    assert.equal(isPlumbingDrainFilm("/media/axioms-heart.mp4"), false);
    assert.equal(isPlumbingDrainFilm("/media/axiom-greeting.mp4"), false);
  });

  it("walks locate → jet → clear → dispatch", () => {
    assert.equal(plumbingBeatFromFilm(0), "locate");
    assert.equal(plumbingBeatFromFilm(6.4), "jet");
    assert.equal(plumbingBeatFromFilm(13.2), "clear");
    assert.equal(plumbingBeatFromFilm(20), "dispatch");
  });

  it("emits distinct telemetry lines per beat", () => {
    const locate = plumbingTelemetryForBeat("locate");
    const dispatch = plumbingTelemetryForBeat("dispatch");
    assert.ok(locate[0]?.includes("CAM"));
    assert.ok(dispatch[0]?.includes("BOOKED"));
    assert.notEqual(locate[0], dispatch[0]);
  });
});
