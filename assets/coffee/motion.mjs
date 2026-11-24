import { transfer, gristAt, spillAngle, tips, point } from "./physics.mjs";
export { point };
export const SECOND_BATCH = 30;
export const DURATION = 56 + SECOND_BATCH;
export const stages = [
  [0, "A small beginning.", "Beans from the packet, onto the scale."],
  [5, "Into the C3.", "Lift the lid, tip in the beans, then close it."],
  [10, "Freshly ground.", "Each pass grinds 14.8 g of coffee."],
  [
    16,
    "Paper, cap, chamber.",
    "Seat the paper in the cap. The chamber rests on the plunger.",
  ],
  [
    21,
    "Every last ground.",
    "Unscrew the catch cup and empty it into the brewer.",
  ],
  [
    26,
    "A slow pour.",
    "473 g water for 29.6 g coffee. Leave room above the slurry.",
  ],
  [32, "A little stir.", "Mix gently, then give it a moment."],
  [
    36,
    "Easy does it.",
    "Seat the cap, turn onto the server, and press steadily.",
  ],
  [45, "Make a little room.", "Lift the brewer clear and set it down."],
  [49, "Server to cup.", "One final pour."],
  [54, "Worth the wait.", "A quiet cup, and a little steam."],
];
const clamp = (x) => Math.max(0, Math.min(1, x));
export const ease = (x) => {
  x = clamp(x);
  return x * x * x * (x * (x * 6 - 15) + 10);
};
export const progress = (t, a, b) => ease((t - a) / (b - a));
export function anchored(target, local, angle) {
  const q = point([0, 0, angle], ...local);
  return [target[0] - q[0], target[1] - q[1], angle];
}
function track(t, keys) {
  if (t <= keys[0][0]) return [...keys[0][1]];
  for (let i = 1; i < keys.length; i++) {
    if (t <= keys[i][0]) {
      const p = progress(t, keys[i - 1][0], keys[i][0]);
      return keys[i][1].map(
        (n, j) => keys[i - 1][1][j] + (n - keys[i - 1][1][j]) * p,
      );
    }
  }
  return [...keys.at(-1)[1]];
}
export function cameraAt(t) {
  return track(t, [
    [0, [174, 406, 2.35]],
    [4, [182, 405, 2.55]],
    [8, [300, 356, 2.1]],
    [13, [340, 397, 2.45]],
    [18, [412, 410, 2.15]],
    [23, [473, 286, 1.85]],
    [29, [530, 283, 1.8]],
    [34, [487, 332, 1.85]],
    [37.5, [545, 301, 1.59]],
    [39, [606, 337, 1.67]],
    [42.3, [609, 407, 2.56]],
    [45, [609, 408, 2.56]],
    [48, [586, 369, 1.72]],
    [51, [757, 379, 1.98]],
    [54, [775, 390, 2.06]],
    [56, [789, 420, 2.46]],
  ]);
}
const firstSpill = spillAngle(1),
  lastSpill = spillAngle(0);
export function stateAt(time) {
  const t = Math.max(0, Math.min(56, time));
  const press = transfer(t, 39, 45),
    pour = transfer(t, 50.5, 53.5),
    water = transfer(t - 0.36, 28.5, 31);
  const grist = gristAt(t),
    grounds = grist.fraction;
  // Pivot about the middle of the closed assembly, then lower the filter onto glass.
  const turn = progress(t, 36.8, 38.15);
  const angle = 180 * (1 - turn);
  const pivot = track(t, [
    [0, [485, 362]],
    [36.2, [485, 362]],
    [36.8, [485, 312]],
    [38.15, [610, 265]],
    [38.9, [610, 294]],
  ]);
  const brewer =
    t <= 45
      ? anchored(pivot, [0, -109], angle)
      : track(t, [
          [45, [610, 403, 0]],
          [46, [610, 350, 0]],
          [47.5, [480, 350, 0]],
          [48.5, [480, 480, 0]],
        ]);
  const plunger = [...point(brewer, 0, -108 + 87 * press), brewer[2]];
  const cap =
    t >= 36.2
      ? [...brewer]
      : track(t, [
          [0, [420, 480, 0]],
          [35.25, [420, 480, 0]],
          [35.75, [454, 234, 150]],
          [36.2, [485, 253, 180]],
        ]);
  const dose = track(t, [
    [0, [220, 465, 0]],
    [6, [220, 465, 0]],
    [7, [300, 300, 0]],
    [7.8, anchored(tips.dose, [22, -24], 75)],
    [9, anchored(tips.dose, [22, -24], 75)],
    [9.5, [280, 300, 0]],
    [10, [220, 465, 0]],
  ]);
  const kettle = track(t, [
    [0, [1010, 480, 0]],
    [26, [1010, 480, 0]],
    [26.55, [1010, 325, 0]],
    [27.5, [745, 295, 0]],
    [28.5, anchored([485, 235], [-85, -83], -32)],
    [31, anchored([485, 235], [-85, -83], -32)],
    [31.6, [745, 295, 0]],
    [32.1, [1010, 325, 0]],
    [32.6, [1010, 480, 0]],
  ]);
  const lip = [790, 377];
  const startAngle = firstSpill,
    endAngle = lastSpill;
  const server =
    t >= 50.5 && t <= 53.5
      ? anchored(lip, [34, -77], spillAngle(1 - pour))
      : track(t, [
          [0, [610, 480, 0]],
          [49, [610, 480, 0]],
          [50, [689, 364, 8]],
          [50.5, anchored(lip, [34, -77], startAngle)],
          [53.5, anchored(lip, [34, -77], endAngle)],
          [54.25, [699, 352, 15]],
          [55.25, [610, 480, 0]],
        ]);
  const catchCup = track(t, [
    [0, [340, 480, 0]],
    [21, [340, 480, 0]],
    [21.35, [340, 480, 0]],
    [21.9, [393, 479, 0]],
    [22.4, [412, 337, 0]],
    [22.8, [425, 223, 0]],
    [23.3, anchored(tips.grounds, [20, -35], 78)],
    [24.7, anchored(tips.grounds, [20, -35], 78)],
    [25.1, [425, 223, 0]],
    [25.65, [410, 334, 0]],
    [26.45, [393, 479, 0]],
    [27.05, [340, 480, 0]],
  ]);
  const scoop = track(t, [
    [0, [100, 408, 65]],
    [0.5, [100, 408, 65]],
    [1.16, [101, 365, 46]],
    [1.45, [118, 361, 4]],
    [2.3, anchored(tips.scoop, [11, 0], 53)],
    [3.5, anchored(tips.scoop, [11, 0], 53)],
    [4, [118, 361, 4]],
    [4.35, [101, 365, 46]],
    [5, [100, 408, 65]],
  ]);
  const spoon = track(t, [
    [0, [516, 492, 90]],
    [32, [516, 492, 90]],
    [32.5, [548, 231, 15]],
    [33, [485, 239, 0]],
    [33.5, [485, 329, 0]],
    [34.7, [485, 329, 0]],
    [35, [485, 239, 0]],
    [35.4, [548, 232, 15]],
    [36, [516, 492, 90]],
  ]);
  if (t >= 33.5 && t <= 34.7) {
    const p = (t - 33.5) / 1.2,
      a = p * Math.PI * 4,
      envelope = Math.sin(p * Math.PI) ** 2;
    spoon[0] += 8 * Math.sin(a) * envelope;
    spoon[1] += 2 * Math.cos(a) * envelope;
  }
  const filter =
    t >= 18.8
      ? [...point(cap, 0, -9), cap[2]]
      : track(t, [
          [0, [405, 472, 0]],
          [17, [405, 472, 0]],
          [17.8, [420, 444, 0]],
          [18.8, [420, 471, 0]],
        ]);
  const grinderDrop = track(t, [
    [0, [0]],
    [21, [0]],
    [21.35, [-9]],
    [21.9, [-9]],
    [22.5, [35]],
    [25.8, [35]],
    [26.4, [-9]],
    [27.05, [-9]],
    [27.4, [0]],
  ])[0];
  const lid = track(t, [
    [0, [340, 367, 0]],
    [5, [340, 367, 0]],
    [5.5, [340, 313, 0]],
    [6, [405, 340, 0]],
    [9, [405, 340, 0]],
    [9.5, [340, 313, 0]],
    [10, [340, 367, 0]],
  ]);
  lid[1] += grinderDrop;
  // Integrating a raised-cosine speed ramp gives continuous speed at both ends.
  const g = clamp((t - 10) / 6);
  const crank =
    6 * Math.PI * 2 * (g - Math.sin(2 * Math.PI * g) / (2 * Math.PI));
  // Flight time contracts as the server fills and the distance to its surface falls.
  const pressFlight = 0.43 - 0.18 * press;
  const received = transfer(t - pressFlight, 39, 45);
  const mugFill = transfer(t - 0.28, 50.5, 53.5);
  return {
    t,
    grist,
    grinderDrop,
    brewer,
    cap,
    plunger,
    dose,
    kettle,
    server,
    catchCup,
    scoop,
    spoon,
    filter,
    lid,
    crank,
    mug: [795, 480, 0],
    press,
    pour,
    water,
    grounds,
    beans: progress(t, 2.3, 3.5) * (1 - progress(t, 7.8, 9)),
    serverFill: received * (1 - pour),
    mugFill,
    inFlight: press - received + pour - mugFill,
    brewFill: water * (1 - press),
    stage: stages.findLastIndex((s) => t >= s[0]),
  };
}

// Two measured charges share the C3. The filter and first bed of grounds
// stay at the brewing station while the camera returns for the second dose.
export function sceneAt(elapsed) {
  const second = elapsed >= SECOND_BATCH;
  const t = second ? elapsed - SECOND_BATCH : Math.min(elapsed, 27.45);
  const s = stateAt(t);
  if (!second) {
    s.kettle = [1010, 480, 0];
    s.grounds *= 0.5;
  } else {
    s.grounds = 0.5 + s.grounds * 0.5;
    if (t < 18.8) s.filter = [...point(s.cap, 0, -9), s.cap[2]];
  }
  let camera = cameraAt(t);
  if (!second && elapsed > 25) {
    const p = progress(elapsed, 25, SECOND_BATCH);
    camera = cameraAt(25).map((n, i) => n + (cameraAt(0)[i] - n) * p);
  }
  let [title, note] = stages[s.stage].slice(1);
  if (t < 5) {
    title = second ? "The second measure." : "Weigh the coffee.";
    note = second
      ? "Another 14.8 g brings the dose to 29.6 g."
      : "14.8 g on the scale, the first of two loads.";
  }
  if (second && t >= 16 && t < 21) {
    title = "Ground and ready.";
    note =
      "The first grounds are in the chamber. The second batch joins them next.";
  }
  if (!second && t >= 26) {
    title = "Half the dose is in.";
    note = "Back to the scale for the second 14.8 g.";
  }
  return { ...s, camera, title, note };
}
