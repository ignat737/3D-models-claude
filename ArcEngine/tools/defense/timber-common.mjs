// timber-common.mjs — shared by the timber fortifications (timber-wall-segment, timber-tower,
// timber-gate): a wall of stacked horizontal logs on a stone footing, a plank wall walk behind a
// crenellated plank parapet. The middle type between the palisade and the stone wall: wood, but
// built like the stone one (wall walk, merlons, slits, banners). Same frame as the other defence
// models: meters, feet at y = 0, outer face to +Z, a section runs along X and ends flush at x = +-5.
import { DEG, fromTo, qmul, rotX, rotY, rotZ } from '../unit-glb.mjs';
import { banner, box, masonry, onFace, rnd, slit } from './stone-common.mjs';

export { banner, box, masonry, onFace, rnd, slit };

export const PALETTE = [
  { name: 'stone', hex: '#8d8a82' },
  { name: 'stoneDark', hex: '#66635d' },
  { name: 'stoneLight', hex: '#aaa699' },
  { name: 'moss', hex: '#5f7d3f' },
  { name: 'slit', hex: '#25282e' },
  { name: 'wood', hex: '#7a5632' },
  { name: 'woodDark', hex: '#5e4125' },
  { name: 'woodLight', hex: '#a37a48' },
  { name: 'plank', hex: '#9a7444' },
  { name: 'cut', hex: '#d2b078' },
  { name: 'rail', hex: '#4a331e' },
  { name: 'iron', hex: '#37373b' },
  { name: 'earth', hex: '#6b5a3f' },
  { name: 'team', hex: '#2f5da8' },
  { name: 'teamDark', hex: '#22447d' },
];

export const THICK = 1.6;                 // wall thickness
export const PLINTH = 0.5;                // stone footing
export const LOG_R = 0.28;                // a log: hexagon with a vertex up, 0.56 m high, 0.485 m wide
export const FLAT = LOG_R * Math.sqrt(3) / 2;
export const ROW = 0.5;                   // course pitch (logs overlap by 0.06 at the vertices)
export const ROWS = 8;
export const WALK = PLINTH + ROWS * ROW + 0.1;      // 4.6: top of the plank wall walk
export const MERLON_H = 0.75;
const BODY = ['wood', 'woodDark', 'woodLight'];
export const logColor = i => BODY[((i % 3) + 3) % 3];

// A log along X from x0 to x1 / along Z from z0 to z1, centred on the height y.
export const logX = (x0, x1, y, z, color) => ({ c: [(x0 + x1) / 2, y, z], h: x1 - x0, r: [LOG_R, LOG_R], n: 6, q: rotZ(90 * DEG), color });
export const logZ = (z0, z1, y, x, color) => ({ c: [x, y, (z0 + z1) / 2], h: z1 - z0, r: [LOG_R, LOG_R], n: 6, q: qmul(rotX(90 * DEG), rotY(30 * DEG)), color });
export const rowY = k => PLINTH + (k + 0.5) * ROW;

// A beam along the line a -> b (model space), square section w.
export function beam(a, b, w, color) {
  const d = b.map((v, k) => v - a[k]), len = Math.hypot(...d), c = a.map((v, k) => (v + b[k]) / 2);
  return box(c, [w, w, len], color, { q: fromTo([0, 0, 1], d), pivot: c });
}

// Courses of logs on a face of a wall that spans x0..x1: two pieces per course with a staggered
// joint, so the face does not read as ten identical 10 m poles.
export function wallLogs(side, x0, x1, rows, seed, from = 0) {
  const z = side * (THICK / 2 - FLAT), out = [];
  for (let k = from; k < from + rows; k++) {
    const j = x0 + (x1 - x0) * (0.25 + 0.5 * rnd(seed, k)), y = rowY(k);
    if (x1 - x0 < 3.2) { out.push(logX(x0, x1, y, z, logColor(k + seed))); continue; }
    out.push(logX(x0, j - 0.015, y, z, logColor(k + seed)), logX(j + 0.015, x1, y, z, logColor(k + seed + 1)));
  }
  return out;
}

// Plank wall walk for a section of length len (x from -len/2 to len/2): decking with plank joints,
// a rail on the inner edge, and a parapet of planks with six merlons on the outer edge.
export function wallTop(len = 10, merlons = 6) {
  const half = THICK / 2, pt = 0.4, zp = half - pt / 2, pitch = len / merlons, out = [];
  const deckZ = (0.1 - pt) / 2, deckW = THICK - 0.1 - pt;       // from the inner rail to the parapet
  out.push(box([0, WALK - 0.05, deckZ], [len, 0.1, deckW], 'plank'));
  for (let x = -len / 2 + 1; x < len / 2 - 0.5; x += 1) out.push(box([x, WALK + 0.003, deckZ], [0.03, 0.01, deckW], 'woodDark'));
  // inner rail: four posts and a handrail
  for (const x of [-3.75, -1.25, 1.25, 3.75]) out.push(box([x * len / 10, WALK + 0.4, -half + 0.1], [0.12, 0.8, 0.12], 'rail'));
  out.push(box([0, WALK + 0.85, -half + 0.1], [len, 0.1, 0.1], 'rail'));
  // parapet and merlons
  out.push(box([0, WALK + 0.25, zp], [len, 0.5, pt], 'wood'));
  for (let i = 0; i < merlons; i++) {
    const x = -len / 2 + pitch * (i + 0.5);
    out.push(box([x, WALK + 0.5 + MERLON_H / 2, zp], [1.0, MERLON_H, pt], 'plank'));
    for (const dx of [-0.17, 0.17]) out.push(box([x + dx, WALK + 0.5 + MERLON_H / 2, zp + pt / 2 + 0.01], [0.03, MERLON_H - 0.1, 0.02], 'woodDark'));
    out.push(box([x, WALK + 0.5 + MERLON_H + 0.04, zp], [1.12, 0.08, pt + 0.1], 'cut'));
  }
  return out;
}
