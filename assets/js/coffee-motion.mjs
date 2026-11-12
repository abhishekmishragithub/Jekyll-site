// Continuous positions in the SVG's 360 × 450 drawing coordinates.
// Each segment eases into a physical action; no raster frames are swapped.
export const BREW_DURATION = 10400;
const keys = [
  // ms, plunge, brewer x/y, cup x/y/tilt, lean, left wrist x/y, right wrist x/y
  [0,     0,  0,   0,   0,    0,  0, 0, 177,225, 211,322],
  [600,   0,  0,   0,   0,    0,  0, 2, 177,225, 211,322],
  [3500, 62,  0,   0,   0,    0,  0,12, 177,287, 211,322],
  [4000, 62,  0,   0,   0,    0,  0,10, 177,287, 211,322],
  [4600, 62,  0,   0,   0,    0,  0, 4, 129,273, 211,322],
  [5400, 62,  0, -65,   0,    0,  0, 0, 126,313, 211,257],
  [6200, 62, 84, -65,   0,    0,  0, 0, 133,365, 295,257],
  [7000, 62, 84,  49,   0,    0,  0, 0, 137,394, 295,377],
  [8400, 62, 84,  49, -12, -201,  0, 0, 125,193, 270,395],
  [9100, 62, 84,  49, -12, -201, -9, 3, 125,193, 270,395],
  [10400,62, 84,  49,  -9, -142,  0, 0, 128,252, 270,395],
];
export function poseAt(time) {
  const t = Math.max(0, Math.min(BREW_DURATION, time));
  const end = keys.findIndex((key) => key[0] >= t);
  if (end <= 0) return keys[0].slice(1);
  const a = keys[end - 1], b = keys[end];
  const fraction = (t - a[0]) / (b[0] - a[0]);
  const ease = fraction * fraction * (3 - 2 * fraction);
  return a.slice(1).map((value, i) => value + (b[i + 1] - value) * ease);
}
export function drawPose(parts, time) {
  const [plunge, bx, by, cx, cy, tilt, lean, lx, ly, rx, ry] = poseAt(time);
  const move = (name, transform) => parts[name].setAttribute('transform', transform);
  move('body', `translate(${lean * .28} ${lean * .25})`);
  move('head', `translate(${lean * .5} ${lean * .65}) rotate(${lean * .4} 170 180)`);
  move('press', `translate(${bx} ${by})`);
  move('plunger', `translate(0 ${plunge})`);
  move('cup', `translate(${cx} ${cy}) rotate(${tilt} 180 398)`);
  // The wrist follows the cup handle even during the sip's rotation.
  const radians = tilt * Math.PI / 180;
  const grip = time >= 7000;
  const handX = grip ? cx + 180 - 43 * Math.cos(radians) + 4 * Math.sin(radians) : lx;
  const handY = grip ? cy + 398 - 43 * Math.sin(radians) - 4 * Math.cos(radians) : ly;
  const reach = Math.max(0, Math.min(1, (time - 4600) / 2400));
  const handTurn = 80 * reach * reach * (3 - 2 * reach) + tilt;
  move('left-hand', `translate(${handX} ${handY}) rotate(${handTurn})`);
  move('right-hand', `translate(${rx} ${ry})`);
  // Curved sleeves bend continuously between shoulders, elbows and wrists.
  for (const [side, sx, sy, ex, ey, wx, wy] of [
    ['left',112 + lean*.28,218 + lean*.25,64,Math.max(270,handY+8),handX,handY],
    ['right',226 + lean*.28,219 + lean*.25,278,Math.max(278,ry-16),rx,ry],
  ]) {
    const path = `M${sx} ${sy} Q${ex} ${ey} ${(ex+wx)/2} ${(ey+wy)/2} L${wx} ${wy}`;
    parts[`${side}-outline`].setAttribute('d', path);
    parts[`${side}-sleeve`].setAttribute('d', path);
    parts[`${side}-skin`].setAttribute('d', `M${wx+(ex-wx)*.25} ${wy+(ey-wy)*.25}L${wx} ${wy}`);
  }
  parts.steam.setAttribute('opacity', Math.max(0, Math.min(.65, (time-4800)/1600)));
}
export function mountCoffee(coffee, { motion, requestFrame, cancelFrame }) {
  const button = coffee.querySelector('#brew-button');
  const status = coffee.querySelector('#brew-status');
  const parts = Object.fromEntries([...coffee.querySelectorAll('[data-brew]')].map(el => [el.dataset.brew, el]));
  let frame = null, start = null;
  function finish() {
    if (frame !== null) cancelFrame(frame);
    frame = null;
    drawPose(parts, BREW_DURATION);
    coffee.dataset.state = 'done';
    button.disabled = false;
    button.textContent = 'Another cup? ↻';
    status.textContent = 'That’s better. Enjoy your cup.';
  }
  function tick(now) {
    if (start === null) start = now;
    const elapsed = now - start;
    if (elapsed >= BREW_DURATION) return finish();
    drawPose(parts, elapsed);
    frame = requestFrame(tick);
  }
  drawPose(parts, 0);
  button.hidden = false;
  button.addEventListener('click', () => {
    if (coffee.dataset.state === 'brewing') return;
    coffee.dataset.state = 'brewing';
    button.disabled = true;
    button.textContent = 'Easy does it…';
    status.textContent = 'Press, lift, and a little pause for coffee.';
    start = null;
    if (motion.matches) finish();
    else {
      drawPose(parts, 0);
      frame = requestFrame(tick);
    }
  });
  motion.addEventListener('change', () => {
    if (motion.matches && coffee.dataset.state === 'brewing') finish();
  });
}
