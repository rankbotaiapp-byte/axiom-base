import assert from "node:assert/strict";
import test from "node:test";
import { createGoop, restPoint, stepGoop, type GoopField } from "./goopy-orb.ts";

const field = (time: number, cursor: GoopField["cursor"], calm = false): GoopField => ({
  cx: 100,
  cy: 100,
  radius: 40,
  time,
  calm,
  cursor,
});

test("an idle orb keeps flowing and a pulled point snaps back", () => {
  const start = restPoint(3, 24, field(0, { active: false, down: false, x: 0, y: 0 }));
  const later = restPoint(3, 24, field(2.4, { active: false, down: false, x: 0, y: 0 }));
  assert.ok(Math.hypot(start.x - later.x, start.y - later.y) > 1);

  const calm = field(0, { active: false, down: false, x: 0, y: 0 }, true);
  const nodes = createGoop(24, calm);
  nodes[0]!.x += 36;
  for (let i = 0; i < 120; i += 1) stepGoop(nodes, calm, 1 / 60);
  const home = restPoint(0, 24, calm);
  assert.ok(Math.hypot(nodes[0]!.x - home.x, nodes[0]!.y - home.y) < 6);
});

test("a held cursor pulls a filament out of the skin", () => {
  const calm = field(0, { active: true, down: true, x: 190, y: 100 }, true);
  const nodes = createGoop(24, calm);
  const before = nodes[0]!.x;
  for (let i = 0; i < 20; i += 1) stepGoop(nodes, calm, 1 / 60);
  assert.ok(nodes[0]!.x > before + 8);
});
