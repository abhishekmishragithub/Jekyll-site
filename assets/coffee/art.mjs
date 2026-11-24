import { progress, point } from "./motion.mjs";
import {
  serverInterior,
  serverCapacity,
  freeSurface,
  transfer,
  gravity,
  holes,
  filterDrops,
  chamberWaterDepth,
} from "./physics.mjs";
export function createCoffeeArt(c) {
  const paths = new Map();
  const path = (s) => {
    if (!paths.has(s)) paths.set(s, new Path2D(s));
    return paths.get(s);
  };
  const texture = document.createElement("canvas");
  texture.width = 37;
  texture.height = 41;
  const tx = texture.getContext("2d");
  tx.strokeStyle = "#333";
  tx.globalAlpha = 0.24;
  tx.lineWidth = 0.55;
  for (let i = -40; i < 75; i += 7) {
    tx.beginPath();
    tx.moveTo(i, 0);
    tx.lineTo(i - 21, 41);
    tx.stroke();
  }
  for (let i = 0; i < 19; i++) {
    const x = (i * 17) % 37,
      y = (i * 23) % 41;
    tx.beginPath();
    tx.moveTo(x, y);
    tx.lineTo(x + 2, y - 1.5);
    tx.stroke();
  }
  const grain = c.createPattern(texture, "repeat");
  function shape(s, fill = "#fff", hatch = false, width = 1.8) {
    const p = path(s);
    c.fillStyle = fill;
    c.fill(p);
    if (hatch) {
      c.fillStyle = grain;
      c.fill(p);
    }
    c.strokeStyle = "#30302e";
    c.lineWidth = width;
    c.stroke(p);
  }
  function line(s, width = 1.5, color = "#343431") {
    c.strokeStyle = color;
    c.lineWidth = width;
    c.stroke(new Path2D(s));
  }
  function oval(x, y, rx, ry, fill = "#fff", width = 1.5) {
    c.beginPath();
    c.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
    c.fillStyle = fill;
    c.fill();
    c.lineWidth = width;
    c.strokeStyle = "#333";
    c.stroke();
  }
  function at(p, fn) {
    c.save();
    c.translate(p[0], p[1]);
    c.rotate(((p[2] || 0) * Math.PI) / 180);
    fn();
    c.restore();
  }
  function bean(x, y, a = 0, size = 1) {
    c.save();
    c.translate(x, y);
    c.rotate(a);
    c.scale(size, size);
    oval(0, 0, 3.2, 4.4, "#4b4b48", 0.6);
    line("M0 -3 Q-2 0 1 3", 0.65, "#eee");
    c.restore();
  }
  function beans(amount, x, y, w) {
    for (let i = 0; i < Math.round(amount * 18); i++)
      bean(x + ((i * 19) % w) - w / 2, y - (i % 3) * 3, (i * 1.7) % 6, 0.7);
  }
  function polygon(points, fill) {
    if (points.length < 3) return;
    c.beginPath();
    c.moveTo(...points[0]);
    for (const p of points.slice(1)) c.lineTo(...p);
    c.closePath();
    c.fillStyle = fill;
    c.fill();
  }
  function capFlow(s, level) {
    if (s.t < 39 || s.t > 45.55) return;
    const head = [610, 403];
    c.save();
    for (const drop of filterDrops) {
      const age = s.t - drop.at;
      if (age < 0) break;
      if (age > 0.52) continue;
      const x = head[0] + drop.hole.x,
        y = head[1] + drop.hole.y + 5 * age + (gravity * age * age) / 2;
      if (y >= level) continue;
      const radius = drop.size,
        stretch = Math.min(2.3, 1 + age * 4);
      c.beginPath();
      c.ellipse(x, y, radius * 0.82, radius * stretch, 0, 0, 2 * Math.PI);
      c.fillStyle = drop.hole.row < 0 ? "#8f7964" : "#584535";
      c.fill();
    }
    c.restore();
  }
  function server(s) {
    const surface = freeSurface(
      serverInterior,
      s.server,
      s.serverFill * serverCapacity,
    );
    at(s.server, () => {
      line("M-26 -66 C-74 -84 -77 -19 -38 -22", 7);
      line("M-26 -66 C-74 -84 -77 -19 -38 -22", 3, "#fff");
      const outline =
        "M-24 -77 Q-22 -54 -36 -30 Q-50 -2 -25 0 L25 0 Q49 -2 35 -30 L23 -66 L34 -77 Q5 -85 -24 -77 Z";
      shape(outline, "#fff", false, 2);
      c.save();
      c.clip(path(outline));
      // The surface and falling drops are in world space, even when the glass tips.
      c.rotate((-s.server[2] * Math.PI) / 180);
      c.translate(-s.server[0], -s.server[1]);
      capFlow(s, surface.y);
      if (s.serverFill > 0.0001) {
        polygon(surface.polygon, "#514439");
        c.save();
        c.clip();
        c.fillStyle = "#a98d6c";
        c.fillRect(s.server[0] - 120, surface.y, 240, 0.95);
        if (s.t > 39.35 && s.t < 45.5) {
          for (let i = 0; i < 3; i++) {
            const u = (s.t * 2.3 + i * 0.37) % 1;
            c.globalAlpha = 0.48 * (1 - u);
            c.beginPath();
            c.ellipse(
              s.server[0] - 11 + i * 12,
              surface.y + 0.12,
              1 + u * 6,
              0.5 + u * 0.7,
              0,
              0,
              Math.PI * 2,
            );
            c.strokeStyle = "#c1a888";
            c.lineWidth = 0.6;
            c.stroke();
          }
        }
        c.restore();
      }
      c.restore();
      // White reflections and a second, lightly drawn rim keep the glass legible.
      line("M-17 -66 Q-16 -45 -25 -25 M-27 -20 L-29 -12", 3.4, "#fff");
      line("M19 -50 L25 -25", 2.4, "#fff");
      line("M-24 -77 Q0 -70 34 -77 M-32 -6 Q0 2 33 -7", 1);
    });
  }
  function mug(s) {
    at(s.mug, () => {
      line("M31 -58 C65 -67 64 -12 32 -15", 10);
      line("M31 -58 C65 -67 64 -12 32 -15", 5.5, "#fff");
      shape("M-34 -68 Q-36 -40 -30 -4 Q0 5 30 -4 L34 -68 Z", "#eee", true, 2);
      oval(0, -68, 34, 8, "#fff", 1.7);
      if (s.mugFill > 0) {
        c.save();
        c.beginPath();
        c.ellipse(0, -68, 31, 6, 0, 0, Math.PI * 2);
        c.clip();
        oval(0, -60 - 7 * s.mugFill, 29, 5, "#3b3b38", 0.5);
        c.restore();
      }
      line("M-27 -58 L-25 -17", 1.8, "#fff");
    });
  }
  // The seal and piston sit behind the translucent near wall. All ellipses
  // share the same viewing angle, including the opening, shoulder and grip.
  function brewer(s) {
    at(s.brewer, () => {
      const wall = "M-24 -121 Q0 -116 24 -121 L24 -13 Q0 -8 -24 -13 Z";
      shape(wall, "rgba(101,104,102,.28)", false, 0.85);
      c.save();
      c.clip(path(wall));
      const seal = -108 + 87 * s.press;
      const interior = [
        [-22, seal],
        [22, seal],
        [22, -13],
        [-22, -13],
      ];
      const totalDepth = -13 - seal;
      const bedDepth = 5 * s.grounds;
      const bed = freeSurface(interior, s.brewer, bedDepth / totalDepth);
      const surface = freeSurface(
        interior,
        s.brewer,
        (bedDepth + chamberWaterDepth * s.brewFill) / totalDepth,
      );
      c.save();
      c.rotate((-s.brewer[2] * Math.PI) / 180);
      c.translate(-s.brewer[0], -s.brewer[1]);
      if (s.brewFill > 0) {
        polygon(surface.polygon, "#5a5045");
        c.save();
        c.clip();
        c.fillStyle = "#a38c72";
        c.fillRect(s.brewer[0] - 140, surface.y, 280, 1.2);
        c.restore();
      }
      if (s.grounds > 0) polygon(bed.polygon, "#382f29");
      for (const [x, y, r] of s.grist.airborne) {
        c.fillStyle = "#514437";
        c.fillRect(x, y, r * 1.6, r);
      }
      if (s.t >= 28.5 && s.t <= 31.4) pourStream(s, "water", surface.y);
      c.restore();
      // Flat reflection bands follow the curvature of smoked moulded plastic.
      c.fillStyle = "rgba(35,37,36,.20)";
      c.fillRect(-24, -124, 4, 120);
      c.fillRect(17, -124, 7, 120);
      c.fillStyle = "rgba(255,255,255,.29)";
      c.fillRect(-17, -124, 3, 120);
      c.restore();
      line("M-24 -121 C-16 -116 15 -116 24 -121", 1.15, "#363734");
      line("M-24 -121 C-17 -125 17 -125 24 -121", 0.65, "#656661");
      c.font = "5.2px Geist, sans-serif";
      c.textAlign = "center";
      c.textBaseline = "middle";
      for (let n = 1; n <= 4; n++) {
        const y = -15 - 21 * n;
        c.strokeStyle = "#c6bba8";
        c.lineWidth = 0.65;
        c.beginPath();
        c.ellipse(9, y, 3.2, 3.5, 0, 0, Math.PI * 2);
        c.stroke();
        c.fillStyle = "#d7ccbb";
        c.fillText(String(n * 2), 9, y + 0.15);
      }
      shape(
        "M-35 -12 L-24 -15 L25 -15 L35 -12 L28 -8 L-27 -8 Z",
        "#595a55",
        false,
        0.8,
      );
      shape(
        "M-35 -12 L-27 -8 L28 -8 L35 -12 L35 -9 L28 -5 L-27 -5 L-35 -9 Z",
        "#3e403c",
        false,
        0.8,
      );
      if (s.t < 36.2) {
        oval(0, -9, 21.5, 3.6, "#aca99e", 0.65);
        line("M-21 -9 Q0 -12.5 21 -9", 0.7, "#b4b4ac");
      }
    });
  }
  function plunger(s) {
    at(s.plunger, () => {
      shape(
        "M-18 -115 Q0 -111 18 -115 L18 -8 Q0 -4 -18 -8 Z",
        "#aaa9a3",
        false,
        0.85,
      );
      line("M-14 -109 L-14 -12", 2, "#d6d4cc");
      line("M13 -111 L13 -10", 3, "#898a84");
      shape(
        "M-21 -10 Q0 -6 21 -10 L21 -2 Q0 2 -21 -2 Z",
        "#393b38",
        false,
        0.85,
      );
      line("M-20 -6 Q0 -2 20 -6", 0.7, "#777872");
      shape(
        "M-29 -119 Q0 -124 29 -119 L29 -116 Q0 -110 -29 -116 Z",
        "#555651",
        false,
        0.85,
      );
      oval(0, -119, 29, 3.4, "#898a83", 0.8);
    });
  }
  function kettle(s) {
    at(s.kettle, () => {
      line("M29 -78 C76 -107 80 -20 44 -22", 8);
      line("M29 -78 C76 -107 80 -20 44 -22", 4.4, "#fff");
      shape(
        "M-30 -71 Q-18 -83 21 -75 L45 -8 Q46 0 31 0 L-42 0 Q-49 -3 -42 -15 Z",
        "#ddd",
        true,
        1.8,
      );
      shape(
        "M-37 -28 C-67 -34 -57 -81 -85 -80 L-86 -86 C-48 -89 -53 -43 -31 -43 Z",
        "#e6e6e4",
        true,
        1.7,
      );
      oval(-4, -76, 30, 5, "#eee", 1.5);
      shape("M-9 -81 L-9 -89 Q-5 -95 1 -89 L1 -81 Z", "#444", false, 1);
      line("M-18 -65 L-33 -13 M-13 -65 L-26 -13", 1.3, "#fff");
    });
  }
  function cap(s) {
    at(s.cap, () => {
      shape(
        "M-24 -10 Q0 -6 24 -10 L23 -1 Q0 3 -23 -1 Z",
        "#333532",
        false,
        0.8,
      );
      for (let x = -20; x <= 20; x += 4) line(`M${x} -6 l0 5`, 0.8, "#85867e");
      oval(0, -10, 24, 2.8, "#61625b", 0.8);
      // Rows of perforations on the exposed base, relief slots around its wall.
      oval(0, -0.3, 22.5, 2.3, "#77786f", 0.65);
      for (const hole of holes) {
        c.fillStyle = "#2e2d28";
        c.beginPath();
        c.ellipse(hole.x, hole.y, 0.92, 0.38, 0, 0, 2 * Math.PI);
        c.fill();
      }
    });
  }
  function grinder(s) {
    at([340, 445 + s.grinderDrop, 0], () => {
      shape("M-20 -78 L20 -78 L20 0 Q0 4 -20 0 Z", "#777", true, 1.6);
      c.save();
      c.clip(path("M-20 -78 L20 -78 L20 0 L-20 0 Z"));
      for (let i = -115; i < 50; i += 4) {
        line(`M-22 ${i} l44 52`, 0.46, "#4f504b");
        line(`M-22 ${i + 52} l44 -52`, 0.45, "#a3a39c");
      }
      c.restore();
      oval(0, -78, 21, 5, "#333", 1);
      line("M-13 -66 L-13 -15", 1.5, "#bbb");
      c.font = "8px Georgia";
      c.fillStyle = "#fff";
      c.fillText("C3", -6, -37);
    });
    at(s.lid, () => {
      oval(0, 0, 22, 5, "#777", 1);
      const x = 43 * Math.cos(s.crank),
        y = -12 + 8 * Math.sin(s.crank);
      line(`M0 0 L0 -12 L${x} ${y}`, 3);
      oval(x, y, 7, 5, "#444", 1);
    });
    at(s.catchCup, () => {
      shape("M-20 -35 L20 -35 L20 -4 Q0 2 -20 -4 Z", "#777", true, 1.6);
      oval(0, -35, 20, 4, "#555", 1);
      line("M-14 -28 L-14 -8", 1, "#ccc");
    });
  }
  // A paper pouch has separate front and back lips so the scoop disappears
  // inside the packet. The folded side pulls in a little as the spoon lifts.
  function packetTop(s) {
    const lift = progress(s.t, 0.5, 1.1) * (1 - progress(s.t, 1.12, 1.5));
    return -87 - 1.9 * lift;
  }
  function packetBack(s) {
    at([100, 480, 0], () => {
      const y = packetTop(s);
      shape(
        `M-29 ${y} L-22 -96 L-14 -94 L8 -97 L22 -94 L30 ${y} L22 -74 L-23 -76 Z`,
        "#b7a387",
        false,
        1,
      );
      shape(
        `M-27 ${y} Q-5 -98 27 ${y} Q19 -78 -19 -79 Z`,
        "#463c32",
        false,
        0.8,
      );
      for (let i = 0; i < 9; i++)
        bean(-19 + i * 4.4, -85 + (i % 3) * 0.8, i * 1.4, 0.47);
    });
  }
  function packetFront(s) {
    at([100, 480, 0], () => {
      const y = packetTop(s);
      shape(
        `M-29 ${y} L-19 -83 L2 -84 L18 -82 L30 ${y} L29 -68 L36 -10 L31 -3 L-25 -1 L-36 -6 L-29 -59 Z`,
        "#d7c5a8",
        false,
        1.25,
      );
      shape(
        `M18 -82 L30 ${y} L29 -68 L36 -10 L31 -3 L20 -9 L23 -55 Z`,
        "#ac9574",
        false,
        0.75,
      );
      line(
        "M27 -74 L27 -41 L33 -10 L25 -15 M-34 -7 L-24 -11 L18 -10 M-26 -72 L-21 -68 M-29 -24 L-25 -16",
        0.8,
        "#82715a",
      );
      line("M-26 -80 L-13 -77 L11 -78 L19 -77", 1, "#8b785e");
      shape("M-26 -63 L16 -64 L18 -23 L-27 -22 Z", "#f4efe3", false, 0.6);
      c.fillStyle = "#594836";
      c.textAlign = "center";
      c.font = "bold 7px Georgia";
      c.fillText("COFFEE", -5, -48);
      c.font = "4.3px monospace";
      c.fillText("WHOLE BEAN", -5, -40);
      line("M-19 -32 Q-11 -36 -5 -32 T9 -33", 0.75, "#8c775c");
    });
  }
  function scoop(s) {
    at(s.scoop, () => {
      line("M-44 -4 L-10 0", 3, "#494843");
      oval(0, 0, 12, 4.4, "#deded7", 0.95);
    });
  }
  function dose(s) {
    at(s.dose, () => {
      shape("M-22 -24 L22 -24 Q23 -2 0 0 Q-23 -2 -22 -24 Z", "#eee", true, 1.2);
      oval(0, -24, 22, 5, "#ecebe4", 1);
    });
  }
  function doseFront(s) {
    at(s.dose, () =>
      shape(
        "M-22 -24 Q0 -14 22 -24 Q22 -2 0 0 Q-21 -1 -22 -24 Z",
        "#eeede7",
        true,
        1,
      ),
    );
  }
  function pourStream(s, kind, impactY) {
    const water = kind === "water",
      a = water ? 28.5 : 50.5,
      b = water ? 31 : 53.5;
    const ageLimit = 0.75;
    c.save();
    c.lineCap = "round";
    let last = null;
    for (let age = 0; age < ageLimit; age += 0.009) {
      const emitted = s.t - age;
      if (emitted < a || emitted > b) {
        last = null;
        continue;
      }
      const force =
        ((transfer(emitted + 0.01, a, b) - transfer(emitted - 0.01, a, b)) *
          (b - a)) /
        0.02;
      if (force < 0.012) {
        last = null;
        continue;
      }
      const origin = water ? [485, 235] : [790, 377];
      const vx = water ? -9 : 16;
      const y = origin[1] + 22 * age + (gravity * age * age) / 2;
      const x = origin[0] + vx * age;
      const tip = [x, Math.min(impactY, y)];
      c.beginPath();
      c.moveTo(...(last || tip));
      c.lineTo(...tip);
      c.strokeStyle = water ? "#84949a" : "#564636";
      c.lineWidth =
        (water ? 2.35 : 2.9) * Math.min(1, force) * (1 - 0.43 * age);
      c.stroke();
      last = tip;
      if (y >= impactY) break;
    }
    c.restore();
  }
  function steam(s) {
    if (s.pour < 0.05) return;
    const top = point(s.mug, 0, -78);
    c.save();
    c.globalAlpha = 0.24 * s.pour;
    for (let i = 0; i < 2; i++) {
      const x = top[0] - 8 + i * 16,
        w = Math.sin(s.t * 1.9 + i) * 5;
      line(
        `M${x} ${top[1] - 5} C${x + 12 + w} ${top[1] - 20} ${x - 13 + w} ${top[1] - 25} ${x + w} ${top[1] - 44}`,
        1.3,
        "#555",
      );
    }
    c.restore();
  }

  return {
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
  };
}
