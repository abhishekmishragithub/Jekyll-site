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
test("coffee plays once, prevents overlapping brews, and allows replay after completion", () => {
  const { coffee, button, status, timers, listeners } = setup();
  assert.equal(button.hidden, false);
  listeners.click();
  assert.equal(coffee.dataset.state, "brewing");
  assert.equal(button.disabled, true);
  assert.equal(status.textContent, "A little patience for the press.");
  listeners.click();
  assert.equal(timers.size, 1);
  const timer = [...timers.values()][0];
  assert.equal(timer.delay, 5200);
  timer.fn();
  assert.equal(coffee.dataset.state, "done");
  assert.equal(button.disabled, false);
  assert.equal(timers.size, 0);
  assert.equal(status.textContent, "That’s better. Enjoy your cup.");
  listeners.click();
  assert.equal(coffee.dataset.state, "brewing");
  assert.equal(timers.size, 1);
});
test("reduced motion completes immediately and also cancels an in-flight animation", () => {
  const reduced = setup(true);
  reduced.listeners.click();
  assert.equal(reduced.coffee.dataset.state, "done");
  assert.equal(reduced.button.disabled, false);
  assert.equal(reduced.timers.size, 0);
  const changing = setup();
  changing.listeners.click();
  changing.motion.matches = true;
  changing.listeners.motion();
  assert.equal(changing.coffee.dataset.state, "done");
  assert.equal(changing.button.disabled, false);
  assert.equal(changing.timers.size, 0);
});
