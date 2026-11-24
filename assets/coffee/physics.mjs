// All positions are in bench coordinates. Positive y points towards the table.
const bound = (value) => Math.min(1, Math.max(0, value));
export const gravity = 740;
const waterGrams = 16 * 29.5735295625;
export const recipe = {
  waterGrams,
  coffeeGrams: waterGrams / 16,
  chamberMl: 600,
};
export const chamberWaterDepth = (95 * waterGrams) / recipe.chamberMl;
export const holes = [-1, 0, 1].flatMap((row) => {
  const count = row === 0 ? 9 : 7;
  return Array.from({ length: count }, (_, i) => ({
    x: (i - (count - 1) / 2) * 4.35 + row * 1.25,
    y: row * 1.05 + 0.1,
    row,
  }));
});

// Drops detach at each visible perforation. More pressure means a shorter
// interval between releases. Seeking samples the same release history.
export const filterDrops = holes
  .flatMap((hole, i) => {
    const drops = [];
    let phase = 0;
    for (let t = 39; t < 45; t += 0.01) {
      const flow =
        (transfer(t + 0.02, 39, 45) - transfer(t - 0.02, 39, 45)) / 0.04;
      phase += flow * (19 + ((i * 7) % 11)) * 0.01;
      if (phase < (drops.length ? 1 : 0.11 + ((i * 0.618) % 1) * 0.74))
        continue;
      phase = 0;
      drops.push({
        hole,
        at: t,
        size: 0.55 + 0.36 * (0.5 + 0.5 * Math.sin(i * 7 + t * 23)),
      });
    }
    return drops;
  })
  .sort((a, b) => a.at - b.at);

export function point(pose, x, y) {
  const a = (pose[2] * Math.PI) / 180;
  return [
    pose[0] + x * Math.cos(a) - y * Math.sin(a),
    pose[1] + x * Math.sin(a) + y * Math.cos(a),
  ];
}

// Constant flow between a short acceleration and a matching release.
export function transfer(t, start, end, ramp = 0.18) {
  const u = bound((t - start) / (end - start));
  if (u < ramp) return (u * u) / (2 * ramp * (1 - ramp));
  if (u > 1 - ramp) return 1 - (1 - u) ** 2 / (2 * ramp * (1 - ramp));
  return (u - ramp / 2) / (1 - ramp);
}

function fall(start, age, vx, vy) {
  return [start[0] + vx * age, start[1] + vy * age + (gravity * age * age) / 2];
}
const noise = (n) => {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};
const levelPose = [220, 465, 0];
const scoopTip = [218, 402],
  bowlTip = [338, 340],
  groundsTip = [485, 240];
export const beanCount = 24;
const beans = Array.from({ length: beanCount }, (_, i) => ({
  scoop: [((i % 6) - 2.5) * 2.5 + noise(i), -2.4 - Math.floor(i / 6) * 1.4],
  bowl: [((i % 8) - 3.5) * 3.7 + noise(i + 7), -19 - Math.floor(i / 8) * 2.4],
  release: 2.32 + (0.83 * (i + noise(i) * 0.65)) / beanCount,
  load: 7.81 + (0.72 * (i + noise(i + 1) * 0.8)) / beanCount,
  twist: (noise(i + 2) - 0.5) * 9,
  spin: (noise(i + 3) - 0.5) * 2,
  size: 0.45 + noise(i + 4) * 0.14,
}));
export const tips = { scoop: scoopTip, dose: bowlTip, grounds: groundsTip };
function lipApproach(pose, inside, lip, until, t) {
  const p = bound(1 + (t - until) / 0.3) ** 2;
  return point(
    pose,
    inside[0] + (lip[0] - inside[0]) * p,
    inside[1] + (lip[1] - inside[1]) * p,
  );
}
function flight(start, target, age, angle, twist, size, holder) {
  const vy = 9,
    duration =
      (Math.sqrt(vy * vy + 2 * gravity * (target[1] - start[1])) - vy) /
      gravity;
  const elapsed = Math.min(age, duration);
  const [x, y] = fall(start, elapsed, (target[0] - start[0]) / duration, vy);
  return {
    x,
    y,
    angle: angle + twist * elapsed,
    size,
    holder: age < duration ? "air" : holder,
  };
}

export function beansAt(s) {
  return beans.map((b, i) => {
    let pos,
      holder,
      angle = b.spin;
    if (s.t < b.release) {
      holder = "scoop";
      pos = lipApproach(s.scoop, b.scoop, [11, 0], b.release, s.t);
      angle += (s.scoop[2] * Math.PI) / 180;
    } else {
      const landed = flight(
        scoopTip,
        point(levelPose, ...b.bowl),
        s.t - b.release,
        angle + (53 * Math.PI) / 180,
        b.twist,
        b.size,
        "dose",
      );
      if (landed.holder === "air") return landed;
      angle = landed.angle;
      if (s.t < b.load) {
        holder = "dose";
        pos = lipApproach(s.dose, b.bowl, [22, -24], b.load, s.t);
        angle += (s.dose[2] * Math.PI) / 180;
      } else {
        return flight(
          bowlTip,
          [335 + noise(i + 11) * 12, 369 + noise(i + 10) * 3],
          s.t - b.load,
          angle + (75 * Math.PI) / 180,
          b.twist,
          b.size,
          "grinder",
        );
      }
    }
    return { x: pos[0], y: pos[1], angle, size: b.size, holder };
  });
}

// Individual grain packets take one flight, and stop at the growing bed.
export function gristAt(t) {
  const airborne = [];
  let landed = 0;
  const count = 160;
  for (let i = 0; i < count; i++) {
    const age = t - (23.3 + (1.08 * (i + noise(i) * 0.65)) / count);
    if (age < 0) break;
    const start = [groundsTip[0] + 3 * (noise(i) - 0.5), groundsTip[1]];
    const [x, y] = fall(
      start,
      age,
      (noise(i + 2) - 0.5) * 56,
      12 + noise(i + 4) * 13,
    );
    if (y >= 359 - (5 * i) / count) landed++;
    else airborne.push([x, y, 0.48 + 0.48 * noise(i + 5)]);
  }
  return { airborne, fraction: landed / count };
}

// Clip the vessel interior against a horizontal plane in world space.
// The area of the remaining polygon is the amount visible below that plane.
export const serverInterior = [
  [-22, -75],
  [-20, -59],
  [-26, -42],
  [-37, -21],
  [-39, -12],
  [-36, -5],
  [-25, -2],
  [24, -2],
  [34, -5],
  [38, -12],
  [36, -23],
  [23, -61],
  [21, -66],
  [34, -77],
];
export const serverCapacity = 0.72;
function below(poly, y) {
  const clipped = [];
  for (let i = 0; i < poly.length; i++) {
    const a = poly[(i + poly.length - 1) % poly.length],
      b = poly[i];
    if (a[1] > y !== b[1] > y) {
      const u = (y - a[1]) / (b[1] - a[1]);
      clipped.push([a[0] + u * (b[0] - a[0]), y]);
    }
    if (b[1] >= y) clipped.push(b);
  }
  return clipped;
}
function area(poly) {
  let sum = 0;
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i],
      b = poly[(i + 1) % poly.length];
    sum += a[0] * b[1] - b[0] * a[1];
  }
  return Math.abs(sum) / 2;
}
export function freeSurface(poly, pose, fraction) {
  const world = poly.map(([x, y]) => point(pose, x, y));
  const ys = world.map((p) => p[1]);
  let high = Math.min(...ys),
    low = Math.max(...ys);
  const volume = area(poly) * bound(fraction);
  for (let i = 0; i < 20; i++) {
    const mid = (high + low) / 2;
    if (area(below(world, mid)) > volume) high = mid;
    else low = mid;
  }
  return { y: low, polygon: below(world, low) };
}
const capacity = area(serverInterior) * serverCapacity;
export function spillAngle(fill) {
  let low = 0,
    high = 145;
  for (let i = 0; i < 18; i++) {
    const mid = (low + high) / 2,
      pose = [0, 0, mid];
    const rotated = serverInterior.map(([x, y]) => point(pose, x, y));
    if (area(below(rotated, point(pose, 34, -77)[1])) > capacity * fill)
      low = mid;
    else high = mid;
  }
  return high;
}
