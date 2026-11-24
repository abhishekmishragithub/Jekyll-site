import { sceneAt, DURATION } from "./motion.mjs";
import { beansAt, beanCount, recipe } from "./physics.mjs";
import { createCoffeeArt } from "./art.mjs";
const action = document.querySelector("#action"),
  pause = document.querySelector("#pause");
const canvas = document.querySelector("#bench"),
  c = canvas.getContext("2d");
const art = createCoffeeArt(c),
  {
    line,
    shape,
    oval,
    at,
    beans,
    server,
    mug,
    brewer,
    cap,
    plunger,
    kettle,
    grinder,
    packetBack,
    packetFront,
    scoop,
    dose,
    doseFront,
    bean,
    pourStream,
    steam,
  } = art;
const scrub = document.querySelector("#scrub"),
  speed = document.querySelector("#speed");
let elapsed = 0,
  raf = 0,
  last = null,
  running = false,
  lastStage = "";
function draw() {
  const s = sceneAt(elapsed);
  const t = s.t;
  const batch = beansAt(s);
  const narrow = canvas.clientWidth < 650,
    h = narrow ? 650 : 440;
  if (canvas.height !== h * 2) canvas.height = h * 2;
  c.setTransform(2, 0, 0, 2, 0, 0);
  c.clearRect(0, 0, 1000, h);
  const [x, y, z] = s.camera;
  const zoom = narrow ? z * 1.25 : z;
  c.translate(500, h * 0.5);
  c.scale(zoom, zoom);
  c.translate(-x, -y);
  c.lineCap = "round";
  c.lineJoin = "round";
  line("M45 482 Q305 484 550 482 T1120 481", 1.3);
  line("M62 487 L264 487 M705 486 L951 485", 0.5, "#aaa");
  for (let i = 0; i < 40; i++) {
    const x = 60 + i * 22;
    line(`M${x} ${493 + (i % 3) * 2} l${8 + (i % 6)} -2`, 0.4, "#bbb");
  }
  packetBack(s);
  at([220, 480, 0], () => {
    shape("M-45 -15 L45 -15 L46 -2 Q0 2 -46 -2 Z", "#eee", true, 1.2);
    shape("M-17 -10 L9 -10 L9 -3 L-17 -3 Z", "#ddd", false, 0.6);
    c.fillStyle = "#333";
    c.font = "5.7px monospace";
    c.fillText(
      `${s.dose[1] > 464.8 ? ((batch.filter((b) => b.holder === "dose").length * recipe.coffeeGrams) / (2 * beanCount)).toFixed(1) : 0}g`,
      -14,
      -4,
    );
    oval(28, -7, 2, 2, "#ddd", 0.6);
  });
  for (let i = 0; i < 3; i++) oval(405, 479 - i * 2, 20, 3, "#fff", 0.6);
  grinder(s);
  scoop(s);
  dose(s);
  for (const b of batch) {
    if (b.holder === "grinder" || (b.holder === "air" && t > 7 && b.y > 367))
      continue;
    bean(b.x, b.y, b.angle, b.size);
  }
  packetFront(s);
  doseFront(s);
  // Rear planes first: the neck of the server hides the filter discharge,
  // the near chamber wall sits in front of both the paddle and the slurry.
  server(s);
  line("M516 497 Q550 501 590 496 M520 499 Q549 503 582 499", 0.85, "#aaa399");
  at(s.spoon, () => {
    line("M0 -72 L0 -5", 2, "#666");
    oval(0, 0, 4, 8, "#bbb", 1);
  });
  plunger(s);
  brewer(s);
  if (t >= 36.2) at(s.filter, () => oval(0, 0, 21, 2.3, "#f3f1e8", 0.55));
  cap(s);
  if (t < 36.2) at(s.filter, () => oval(0, 0, 21, 2.3, "#f3f1e8", 0.55));
  kettle(s);
  mug(s);
  if (s.grist.airborne.length) {
    c.fillStyle = "#514437";
    for (const [x, y, r] of s.grist.airborne)
      if (y < 268) c.fillRect(x, y, r * 1.6, r);
  }
  if (t >= 28.5 && t < 31.4) pourStream(s, "water", 268);
  if (t >= 50.5 && t < 53.85) pourStream(s, "coffee", 412);
  steam(s);
  if (lastStage !== s.title) {
    document.querySelector("#bench-title").textContent = s.title;
    document.querySelector("#bench-note").textContent = s.note;
    canvas.setAttribute("aria-label", s.title + " " + s.note);
    lastStage = s.title;
  }
  scrub.value = elapsed;
  document.querySelector("#progress").style.width =
    (elapsed / DURATION) * 100 + "%";
  document.querySelector("#time").textContent =
    Math.floor(elapsed) + " / " + DURATION + "s";
}
const sound = document.querySelector("#foley"),
  soundButton = document.querySelector("#sound");
let soundOn = false,
  audioReady,
  audioRequest = 0;
function prepareSound() {
  if (!audioReady) {
    audioReady = fetch(sound.dataset.src)
      .then((response) => {
        if (!response.ok) throw Error("Foley unavailable");
        return response.blob();
      })
      .then(
        (blob) =>
          new Promise((resolve, reject) => {
            sound.onloadedmetadata = resolve;
            sound.onerror = reject;
            sound.src = URL.createObjectURL(blob);
          }),
      )
      .catch((error) => {
        audioReady = null;
        throw error;
      });
  }
  return audioReady;
}
function update() {
  action.textContent = running
    ? "Brewing…"
    : elapsed >= DURATION
      ? "Another cup ↻"
      : elapsed > 0
        ? "Continue brewing"
        : "Brew a cup";
  action.disabled = running;
  pause.hidden = !running;
}
async function syncSound() {
  const request = ++audioRequest;
  sound.pause();
  if (!soundOn) return;
  try {
    await prepareSound();
    if (request !== audioRequest || !running || !soundOn) return;
    sound.currentTime = elapsed;
    sound.playbackRate = Number(speed.value);
    await sound.play();
  } catch (error) {
    if (request !== audioRequest || error.name === "AbortError") return;
    soundOn = false;
    soundButton.textContent = "Retry sound";
    soundButton.setAttribute("aria-pressed", "false");
  }
}
soundButton.addEventListener("click", () => {
  soundOn = !soundOn;
  soundButton.setAttribute("aria-pressed", String(soundOn));
  soundButton.textContent = soundOn ? "Sound on" : "Sound off";
  syncSound();
});
speed.addEventListener("change", syncSound);
function stop() {
  running = false;
  last = null;
  cancelAnimationFrame(raf);
  syncSound();
  update();
}
function tick(now) {
  if (!running) return;
  if (last !== null)
    elapsed = Math.min(
      DURATION,
      elapsed + ((now - last) / 1000) * Number(speed.value),
    );
  if (soundOn && !sound.paused && !sound.seeking && sound.readyState >= 3)
    elapsed = sound.currentTime;
  last = now;
  draw();
  if (elapsed >= DURATION) {
    stop();
    return;
  }
  raf = requestAnimationFrame(tick);
}
function start() {
  if (elapsed >= DURATION) elapsed = 0;
  running = true;
  last = performance.now();
  syncSound();
  update();
  raf = requestAnimationFrame(tick);
}
function reset() {
  stop();
  elapsed = 0;
  draw();
  update();
}
action.addEventListener("click", start);
pause.addEventListener("click", stop);
document.querySelector("#reset").addEventListener("click", reset);
scrub.addEventListener("input", () => {
  stop();
  elapsed = Number(scrub.value);
  draw();
  update();
});
document.addEventListener("visibilitychange", () => {
  if (document.hidden) stop();
});
window.addEventListener("pagehide", stop);
window.addEventListener("resize", draw);
document.querySelector("#player").hidden = false;
draw();
update();
