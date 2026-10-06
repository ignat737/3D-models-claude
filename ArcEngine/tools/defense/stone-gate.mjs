// stone-gate.mjs — a 10 m gate section of the stone wall: wall masses on both sides, a round
// arch of 11 voussoirs with a keystone over a 4.2 m opening (2.3 m to the spring, 4.4 m to the crown),
// the wall walk and the crenellated parapet carried on across the top, banners, and a double leaf of
// planks cut to the arch with iron hinges and braces. Two models from one description:
// `stone-gate` (leaves closed) and `stone-gate-open` (leaves swung inward, the opening is free).
// The section replaces a stone-wall-segment (same footing, thickness, wall walk and ends at
// x = +-5). Static: one mesh, one palette material, no skeleton.
import { PALETTE, THICK, PLINTH, WALK, box, masonry, wallTop, banner, onFace } from './stone-common.mjs';
import { fromTo, rotZ } from '../unit-glb.mjs';

const H = THICK / 2;
const OPEN = 2.1, SPRING = 2.3;                       // half width and the height of the arch spring
const RING = 0.45, NV = 11, VW = 0.74;                // voussoir thickness, count and width
const LEAF_T = 0.14, LEAF_Z = 0.25, PLANKS = 11;
const BODY = ['wood', 'woodDark', 'woodLight'];

function beam(a, b, w, color) {
  const d = b.map((v, k) => v - a[k]), len = Math.hypot(...d), c = a.map((v, k) => (v + b[k]) / 2);
  return box(c, [w, w, len], color, { q: fromTo([0, 0, 1], d), pivot: c });
}

// The arch: alternate voussoirs stand 0.04 m and 0.08 m proud of the wall faces, the keystone 0.12 m.
const rm = OPEN + RING / 2;
const voussoirs = Array.from({ length: NV }, (_, i) => {
  const th = (i + 0.5) * Math.PI / NV, key = i === (NV - 1) / 2;
  const depth = THICK + (key ? 0.12 : i % 2 ? 0.08 : 0.04);
  return box([rm * Math.cos(th), SPRING + rm * Math.sin(th), 0], [RING, key ? VW + 0.1 : VW, depth], key || i % 2 ? 'stoneLight' : 'stone', { q: rotZ(th), pivot: [rm * Math.cos(th), SPRING + rm * Math.sin(th), 0] });
});

// Behind the ring: wall masonry above the spring in steps that stay outside a radius of 2.3 m.
const ROWS = 11, ROW_H = 2.2 / ROWS;
const fill = Array.from({ length: ROWS }, (_, j) => {
  const a = j * ROW_H, w = Math.sqrt(2.3 * 2.3 - a * a), width = OPEN - w;
  return width < 0.05 ? [] : [-1, 1].map(s => box([s * (w + width / 2), SPRING + a + ROW_H / 2, 0], [width, ROW_H, THICK], 'stone'));
}).flat();
const TOP0 = SPRING + 2.2;

const MASS_X = (5 + OPEN) / 2, MASS_W = 5 - OPEN;
const masses = [-1, 1].flatMap(s => [
  box([s * (5 + OPEN) / 2, (PLINTH + WALK) / 2, 0], [MASS_W, WALK - PLINTH, THICK], 'stone'),
  box([s * MASS_X, PLINTH / 2, 0], [MASS_W, PLINTH, THICK + 0.4], 'stoneDark'),
  ...[1, -1].flatMap(f => masonry({ axis: 'z', sign: f, plane: H, mid: s * MASS_X, len: MASS_W, y0: PLINTH, y1: WALK, course: 0.6, block: f > 0 ? 1.5 : 2.0, seed: 30 + s * 3 + f, light: f > 0 ? 0.13 : 0.08 })),
  ...banner('z', 1, H, MASS_X * s, 4.9, 0.9, 1.6).map(p => ({ ...p, c: [p.c[0], p.c[1], p.c[2]] })),
]);

// A leaf; u runs from the hinge pier to the middle. Plank tops follow the arch.
function leaf(s, open) {
  const w = OPEN / PLANKS, parts = [];
  const at = (u, y, t) => open ? [s * (OPEN - t - 0.07), y, LEAF_Z - u] : [s * (OPEN - u), y, LEAF_Z + t];
  const sz = (su, sy, st) => open ? [st, sy, su] : [su, sy, st];
  const top = i => { const x = OPEN - i * w; return SPRING + Math.sqrt(Math.max(OPEN * OPEN - x * x, 0)) - 0.14; };
  for (let i = 0; i < PLANKS; i++) {
    const h = top(i) - 0.12;
    parts.push(box(at((i + 0.5) * w, 0.12 + h / 2, 0), sz(w - 0.012, h, LEAF_T), BODY[(i + (s > 0 ? 1 : 0)) % 3]));
  }
  for (const y of [0.55, 1.75]) parts.push(box(at(OPEN / 2, y, LEAF_T / 2 + 0.04), sz(OPEN - 0.1, 0.2, 0.08), 'rail'));
  parts.push(beam(at(0.15, 0.6, LEAF_T / 2 + 0.08), at(OPEN - 0.15, 1.8, LEAF_T / 2 + 0.08), 0.13, 'rail'));
  parts.push(box(at(OPEN / 2, 1.15, LEAF_T / 2 + 0.03), sz(OPEN - 0.3, 0.26, 0.05), 'team'));
  for (const y of [0.55, 1.75]) parts.push(box(at(0.4, y, LEAF_T / 2 + 0.09), sz(0.8, 0.1, 0.04), 'iron'));
  parts.push(box(at(OPEN - 0.2, 1.0, LEAF_T / 2 + 0.07), sz(0.1, 0.1, 0.07), 'iron'));
  return parts;
}

function gate(open) {
  return [
    ...masses,
    ...voussoirs, ...fill,
    box([0, (TOP0 + WALK) / 2, 0], [2 * OPEN, WALK - TOP0, THICK], 'stone'),
    ...wallTop(),
    box([0, 0.03, 0], [2 * OPEN, 0.06, THICK], 'earth'),
    box([0, 0.06, LEAF_Z], [2 * OPEN, 0.12, 0.5], 'stoneDark'),
    ...[-1, 1].flatMap(s => leaf(s, open)),
  ];
}

const base = { folder: '3D-models-defense', static: true, joints: [], palette: PALETTE, clips: [], preview: '25,90,155', previewGap: 150, previewZoom: 1.6 };
export const closed = { ...base, name: 'stone-gate', parts: gate(false) };
export const opened = { ...base, name: 'stone-gate-open', parts: gate(true) };
