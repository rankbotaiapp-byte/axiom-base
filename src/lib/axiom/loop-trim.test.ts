import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { LOOP_TAIL_TRIM_SEC, applyLoopTailTrim, loopTailCutTime } from "./loop-trim.ts";

function fakeVideo(partial: Partial<HTMLVideoElement> & { currentTime: number; duration: number }): HTMLVideoElement {
  const pauses: number[] = [];
  const video = {
    seeking: false,
    pause() {
      pauses.push(video.currentTime);
    },
    ...partial,
  };
  return video as HTMLVideoElement;
}

describe("loop tail trim", () => {
  it("cuts 1.75s before the true end", () => {
    assert.equal(LOOP_TAIL_TRIM_SEC, 1.75);
    assert.equal(loopTailCutTime(10), 8.25);
    assert.equal(loopTailCutTime(2), null);
    assert.equal(loopTailCutTime(Number.NaN), null);
  });

  it("rewinds a looping film before the outro", () => {
    const video = fakeVideo({ currentTime: 8.3, duration: 10 });
    assert.equal(applyLoopTailTrim(video), true);
    assert.equal(video.currentTime, 0);
  });

  it("leaves the body of the clip alone", () => {
    const video = fakeVideo({ currentTime: 4, duration: 10 });
    assert.equal(applyLoopTailTrim(video), false);
    assert.equal(video.currentTime, 4);
  });

  it("holds a one-shot at the cut instead of flashing the tail", () => {
    const video = fakeVideo({ currentTime: 9.5, duration: 10 });
    assert.equal(applyLoopTailTrim(video, { loop: false }), true);
    assert.equal(video.currentTime, 8.25);
  });
});
