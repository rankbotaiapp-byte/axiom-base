import assert from "node:assert/strict";
import test from "node:test";
import { orbAnswerMessages, parseOrbQuestion } from "./orb-answer.ts";

test("a spoken question is trimmed and too-short audio is ignored", () => {
  assert.equal(parseOrbQuestion({ question: "  When can you come by?  " }), "When can you come by?");
  assert.equal(parseOrbQuestion({ question: " " }), null);
  assert.equal(parseOrbQuestion(null), null);
  assert.match(orbAnswerMessages("When can you come by?")[1].content, /come by/);
});
