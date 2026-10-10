// kit.mjs — helpers shared by the building descriptions: boxes, gable roofs, struts, barrels, flags.
// Model space as everywhere: meters, feet at y = 0, the front faces +Z, a roof ridge runs along X.
import { DEG, rotX, rotZ } from '../unit-glb.mjs';

export const box = (c, s, color, extra) => ({ c, s, color, ...extra });

// A gable roof of sloped slabs with darker courses and an eave edge, plus a rolled ridge.
// halfZ: half the depth of the walls under it; baseY: the wall top; over: [front, back] overhang.
// Returns { parts, ridge } — ridge is the height of the ridge line.
export function gableRoof({ pitch, halfZ, baseY, len, over = [0.35, 0.35], thick = 0.24, colors, courses = [0.9, 1.8, 2.7], cx = 0, cz = 0, ridgeR = 0.27 }) {
  const [main, dark, light] = colors;
  const cos = Math.cos(pitch), sin = Math.sin(pitch);
  const ridge = baseY - 0.02 + halfZ * Math.tan(pitch) + thick / cos;
  const parts = [];
  for (const side of [1, -1]) {
    const slope = (halfZ + over[side > 0 ? 0 : 1]) / cos;
    const slab = (s0, s1, t, lift, color) => {
      const mid = (s0 + s1) / 2, d = t / 2 - lift;
      const c = [cx, ridge - sin * mid - cos * d, cz + side * (cos * mid - sin * d)];
      return box(c, [len, t, s1 - s0], color, { q: rotX(pitch * side), pivot: c });
    };
    parts.push(slab(-0.15, slope, thick, 0, main), slab(slope - 0.16, slope, thick + 0.08, 0.04, dark));
    for (const s of courses) if (s + 0.2 < slope - 0.3) parts.push(slab(s, s + 0.2, thick, -0.02, dark));
  }
  parts.push({ c: [cx, ridge + 0.02, cz], h: len + 0.1, r: [ridgeR, ridgeR], n: 6, q: rotZ(90 * DEG), color: light });
  return { parts, ridge };
}

// A gable triangle (a 3-sided frustum turned about Z, apex up) whose outer face is at x.
export function gableEnd({ x, side, baseY, halfZ, pitch, thick = 0.3, color, cz = 0 }) {
  const gr = halfZ * Math.tan(pitch) / 1.5;
  return {
    c: [side * (x - thick / 2), baseY + gr / 2, cz], h: thick, r: [gr, gr], n: 3,
    sq: halfZ / (gr * Math.sqrt(3) / 2), q: rotZ(90 * DEG), color,
  };
}

// A beam in the plane x = const from (y1, z1) to (y2, z2).
export function strut(x, [y1, z1], [y2, z2], w, color) {
  const len = Math.hypot(y2 - y1, z2 - z1), c = [x, (y1 + y2) / 2, (z1 + z2) / 2];
  return box(c, [w, w, len], color, { q: rotX(Math.atan2(-(y2 - y1), z2 - z1)), pivot: c });
}

// A barrel with two iron hoops.
export const barrel = (x, z, { r = 0.28, h = 0.7, color = 'timber', hoop = 'iron' } = {}) => [
  { c: [x, h / 2, z], h, r: [r, r * 0.9], n: 8, color },
  { c: [x, h * 0.2, z], h: 0.05, r: [r * 0.97, r * 0.97], n: 8, color: hoop },
  { c: [x, h * 0.8, z], h: 0.05, r: [r * 0.93, r * 0.93], n: 8, color: hoop },
];

// A flag on a pole standing at (x, z) from height y0, the cloth streaming toward +Z.
export const flag = (x, y0, z, { pole = 1.6, poleColor = 'timber' } = {}) => [
  box([x, y0 + pole / 2, z], [0.07, pole, 0.07], poleColor),
  box([x, y0 + pole - 0.35, z + 0.5], [0.04, 0.55, 0.92], 'team'),
  box([x, y0 + pole - 0.35, z + 1.05], [0.04, 0.3, 0.2], 'teamDark'),
];
