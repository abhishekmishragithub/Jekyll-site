import test from "node:test";
import assert from "node:assert/strict";
import { stateAt, point, DURATION } from "../assets/coffee/motion.mjs";
const near = (a, b, tol = 0.01) =>
  assert(Math.abs(a - b) < tol, `${a} != ${b}`);
test("all rigid props remain continuous through every phase boundary", () => {
  for (let t = 0.001; t < DURATION; t += 0.025) {
    const a = stateAt(t - 0.001),
      b = stateAt(t + 0.001);
    for (const key of [
      "brewer",
      "cap",
      "plunger",
      "dose",
      "kettle",
      "server",
      "catchCup",
      "scoop",
      "spoon",
      "filter",
      "lid",
    ])
      for (let j = 0; j < 3; j++)
        assert(Math.abs(a[key][j] - b[key][j]) < 2, `${key} jumps at ${t}`);
  }
});
test("every pouring lip aligns over its destination before any flow", () => {
  for (const [from, to, key, local, target] of [
    [7.8, 9, "dose", [22, -24], [338, 367]],
    [23.3, 24.7, "catchCup", [20, -35], [485, 265]],
    [28.5, 31, "kettle", [-85, -83], [485, 265]],
    [50.5, 53.5, "server", [34, -77], [790, 412]],
  ])
    for (let t = from; t <= to; t += 0.05) {
      const outlet = point(stateAt(t)[key], ...local);
      near(outlet[0], target[0]);
      assert(outlet[1] < target[1]);
    }
});
test("coffee transfers continuously between chamber, server and mug", () => {
  for (let t = 31.4; t <= 56; t += 0.03) {
    const s = stateAt(t);
    near(s.brewFill + s.serverFill + s.mugFill + s.inFlight, 1);
    for (const key of ["brewFill", "serverFill", "mugFill"])
      assert(s[key] >= 0 && s[key] <= 1);
  }
});
test("seal follows the coffee surface while pressing and stays locked during removal", () => {
  for (let t = 39; t <= 45; t += 0.02) {
    const s = stateAt(t);
    near(s.plunger[1], s.brewer[1] - 21 - 87 * s.brewFill);
  }
  for (let t = 45; t <= 56; t += 0.02) {
    const s = stateAt(t);
    near(s.plunger[0], s.brewer[0]);
    near(s.plunger[1], s.brewer[1] - 21);
    near(s.cap[0], s.brewer[0]);
    near(s.cap[1], s.brewer[1]);
  }
  assert(stateAt(49).brewer[0] < stateAt(49).server[0] - 100);
});
test("initial and replay states are empty; the final cup is full", () => {
  const start = stateAt(0),
    end = stateAt(56);
  near(start.serverFill, 0);
  near(start.mugFill, 0);
  near(start.brewFill, 0);
  near(end.mugFill, 1);
  near(end.serverFill, 0);
});

test("sealed assembly turns together before pressing", () => {
  for (let t = 36.2; t < 39; t += 0.02) {
    const s = stateAt(t),
      seal = point(s.brewer, 0, -108);
    near(s.plunger[0], seal[0]);
    near(s.plunger[1], seal[1]);
    assert.deepEqual(s.cap, s.brewer);
    near(s.press, 0);
  }
  near(stateAt(36.2).brewer[2], 180);
  near(stateAt(39).brewer[2], 0);
});

import {
  beansAt,
  beanCount,
  gristAt,
  freeSurface,
  serverInterior,
  serverCapacity,
} from "../assets/coffee/physics.mjs";
test("one batch of beans lands in the dose bowl and then in the open grinder", () => {
  const holders = (t) => beansAt(stateAt(t)).map((b) => b.holder);
  for (const [t, holder] of [
    [1, "scoop"],
    [4, "dose"],
    [9, "grinder"],
  ]) {
    assert.deepEqual(holders(t), Array(beanCount).fill(holder));
  }
  for (const t of [2.65, 8.05]) assert(holders(t).includes("air"));
  let previous = beansAt(stateAt(2));
  for (let t = 2.005; t < 9; t += 0.005) {
    const next = beansAt(stateAt(t));
    for (let i = 0; i < beanCount; i++)
      assert(
        Math.hypot(next[i].x - previous[i].x, next[i].y - previous[i].y) < 3.5,
      );
    previous = next;
  }
});
test("grounds reach the chamber bed after the first grains leave the lip", () => {
  const first = gristAt(23.45),
    last = gristAt(25.6);
  assert(first.airborne.length > 0);
  near(first.fraction, 0);
  near(last.fraction, 1);
  assert.equal(last.airborne.length, 0);
});
test("coffee meets the tilted server spout throughout decanting", () => {
  for (let t = 50.52; t < 53.49; t += 0.02) {
    const s = stateAt(t),
      surface = freeSurface(
        serverInterior,
        s.server,
        s.serverFill * serverCapacity,
      );
    near(surface.y, point(s.server, 34, -77)[1], 0.025);
  }
});
test("press discharge precedes collection, and liquid in flight eventually lands", () => {
  assert(stateAt(39.2).press > 0);
  near(stateAt(39.2).serverFill, 0);
  assert(stateAt(50.7).inFlight > 0);
  near(stateAt(50.7).mugFill, 0);
  near(stateAt(54).inFlight, 0);
});

import { sceneAt, SECOND_BATCH } from "../assets/coffee/motion.mjs";
import {
  holes,
  filterDrops,
  recipe,
  chamberWaterDepth,
} from "../assets/coffee/physics.mjs";
test("both grinder doses accumulate; water fits in the XL with headspace", () => {
  near(recipe.waterGrams / recipe.coffeeGrams, 16);
  near(recipe.coffeeGrams / 2, 14.8, 0.03);
  near(sceneAt(27).grounds, 0.5);
  near(sceneAt(SECOND_BATCH).grounds, 0.5);
  near(sceneAt(SECOND_BATCH + 26).grounds, 1);
  assert(95 - 5 - chamberWaterDepth > 14);
});
test("drops originate at every illustrated hole and stop on release", () => {
  assert(holes.length > 20);
  for (const hole of holes)
    assert(filterDrops.filter((d) => d.hole === hole).length > 10);
  assert(filterDrops.every((d) => d.at >= 39 && d.at < 45));
});
test("the entire kettle clears the mug on the way out and back", () => {
  for (let t = 0; t <= 56; t += 0.03) {
    const { kettle, mug } = stateAt(t);
    const corners = [
      [-88, -96],
      [80, -96],
      [-88, 1],
      [80, 1],
    ].map((p) => point(kettle, ...p));
    assert(
      Math.min(...corners.map((p) => p[0])) > mug[0] + 63 ||
        Math.max(...corners.map((p) => p[0])) < mug[0] - 36 ||
        Math.max(...corners.map((p) => p[1])) < mug[1] - 78,
    );
  }
});
test("spoon and handle clear the grinder and return to their own rest", () => {
  for (let t = 0; t <= 56; t += 0.025) {
    const s = stateAt(t);
    for (const h of [point(s.spoon, 0, 0), point(s.spoon, 0, -72)])
      assert(h[0] > s.lid[0] + 55);
  }
  assert.deepEqual(stateAt(36).spoon, stateAt(0).spoon);
  near(point(stateAt(36).spoon, 0, -72)[1], 492);
});
