import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";

// Exercise the actual browser controller with a deterministic clock. Rendering
// and keyboard interaction are checked separately in the browser.
const script = readFileSync(
  new URL("../assets/js/portfolio.js", import.meta.url),
  "utf8",
).replace(/^import[^;]+;\s*/, "");
function setup(reduced = false) {
  const listeners = {};
  const timers = new Map();
  let nextId = 0;
  const coffee = { dataset: { state: "ready" }, offsetWidth: 150 };
  const button = {
    hidden: true,
    disabled: false,
    addEventListener: (event, fn) => {
      listeners[event] = fn;
    },
  };
  const status = { textContent: "" };
  const motion = {
    matches: reduced,
    addEventListener: (_, fn) => {
      listeners.motion = fn;
    },
  };
  const nodes = {
    "#coffee": coffee,
    "#brew-button": button,
    "#brew-status": status,
  };
  runInNewContext(script, {
    document: { querySelector: (selector) => nodes[selector] ?? null },
    matchMedia: () => motion,
    setTimeout: (fn, delay) => {
      timers.set(++nextId, { fn, delay });
      return nextId;
    },
    clearTimeout: (id) => timers.delete(id),
  });
  return { coffee, button, status, motion, timers, listeners };
}
test("automatic playback advances all poses and resets on replay without overlapping", () => {
  const s = setup();
  assert.equal(s.button.hidden, false);
  assert.equal(s.coffee.dataset.frame, "0");
  s.listeners.click();
  assert.equal(s.coffee.dataset.state, "brewing");
  assert.equal(s.button.disabled, true);
  s.listeners.click();
  assert.equal(s.timers.size, 3);
  const scheduled = [...s.timers.values()].sort((a,b) => a.delay-b.delay);
  assert.deepEqual(scheduled.map(t=>t.delay), [1456,3224,5200]);
  scheduled[0].fn(); assert.equal(s.coffee.dataset.frame, "1");
  scheduled[1].fn(); assert.equal(s.coffee.dataset.frame, "2");
  scheduled[2].fn(); assert.equal(s.coffee.dataset.frame, "3");
  assert.equal(s.coffee.dataset.state, "done");
  assert.equal(s.button.disabled, false);
  assert.equal(s.timers.size, 0);
  s.listeners.click();
  assert.equal(s.coffee.dataset.frame, "0");
  assert.equal(s.coffee.dataset.state, "brewing");
});
test("reduced-motion clicks advance still poses and Another cup visibly resets", () => {
  const s = setup(true);
  for (let cycle=0; cycle<3; cycle++) {
    for (const expected of ["1","2","3","0"]) {
      const before=s.coffee.dataset.frame;
      s.listeners.click();
      assert.equal(s.coffee.dataset.frame, expected);
      assert.notEqual(s.coffee.dataset.frame, before);
      assert.equal(s.button.disabled, false);
      assert.equal(s.timers.size, 0);
      if (expected === "3") assert.equal(s.button.textContent, "Another cup? ↻");
    }
  }
});
test("enabling reduced motion cancels timers and preserves the visible pose", () => {
  const s=setup(); s.listeners.click();
  [...s.timers.values()].find(t=>t.delay===1456).fn();
  s.motion.matches=true; s.listeners.motion();
  assert.equal(s.coffee.dataset.frame,"1");
  assert.equal(s.coffee.dataset.state,"stepping");
  assert.equal(s.button.disabled,false);
  assert.equal(s.timers.size,0);
  s.listeners.click(); assert.equal(s.coffee.dataset.frame,"2");
});
test("turning motion back on waits for a click before automatic playback",()=>{
  const s=setup(true); s.listeners.click();
  s.motion.matches=false; s.listeners.motion();
  assert.equal(s.coffee.dataset.frame,"1"); assert.equal(s.timers.size,0);
  s.listeners.click();
  assert.equal(s.coffee.dataset.frame,"0"); assert.equal(s.timers.size,3);
});
