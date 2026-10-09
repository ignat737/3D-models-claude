// orc-stone-gate.mjs — a 10 m gate section of the orc stone wall: wall masses with tusks and
// skulls on both sides, a rough arch of 11 blocks with a bone fang row in its mouth and a huge tusked
// skull over the keystone (opening 4.2 m wide, 4.4 m to the crown), the wall walk and pointed merlons
// carried on across the top, banners, and a double leaf of planks with iron bands, studs and a
// war-paint skull. Two models from one description: `orc-stone-gate` (leaves closed) and
// `orc-stone-gate-open` (leaves swung inward). Replaces an orc-stone-wall-segment: the same footing,
// thickness and wall walk, ends at x = +-5. Static: one mesh, one palette material.
import { fromTo, rotZ } from '../unit-glb.mjs';
import { PALETTE, banner, beam, box, masonry, skull, spike, spikeRows, wallTop } from './orc-common.mjs';
import { PLINTH, THICK, WALK } from './stone-common.mjs';

const H = THICK / 2;
const OPEN = 2.1, SPRING = 2.3, RING = 0.45, NV = 11, VW = 0.74;
const LEAF_T = 0.14, LEAF_Z = 0.25, PLANKS = 7, BODY = ['wood', 'woodDark', 'woodLight'];

// The arch: alternate blocks stand 0.04 / 0.08 m proud of the wall faces, the keystone 0.12 m.
const rm = OPEN + RING / 2;
const voussoirs = Array.from({ length: NV }, (_, i) => {
  const th = (i + 0.5) * Math.PI / NV, key = i === (NV - 1) / 2, c = [rm * Math.cos(th), SPRING + rm * Math.sin(th), 0];
  return box(c, [RING, key ? VW + 0.1 : VW, THICK + (key ? 0.12 : i % 2 ? 0.08 : 0.04)], key || i % 2 ? 'stoneLight' : 'stone', { q: rotZ(th), pivot: c });
});

// Wall masonry behind the ring, stepped to stay outside a radius of 2.3 m.
const ROWS = 11, ROW_H = 2.2 / ROWS;
const fill = Array.from({ length: ROWS }, (_, j) => {
  const a = j * ROW_H, w = Math.sqrt(2.3 * 2.3 - a * a), width = OPEN - w;
  return width < 0.05 ? [] : [-1, 1].map(s => box([s * (w + width / 2), SPRING + a + ROW_H / 2, 0], [width, ROW_H, THICK], 'stone'));
}).flat();
const TOP0 = SPRING + 2.2;

// Fangs in the mouth of the arch, in front of the leaves, pointing at the middle of the opening.
const fangs = Array.from({ length: 5 }, (_, i) => {
  const th = (25 + i * 32.5) * Math.PI / 180, r = OPEN - 0.02;
  return spike([r * Math.cos(th), SPRING + r * Math.sin(th), 0.62], [-Math.cos(th), -Math.sin(th), 0], 0.4, 0.1, 'bone');
});

const MID = (5 + OPEN) / 2, MASS_W = 5 - OPEN;
const masses = [-1, 1].flatMap(s => [
  box([s * MID, (PLINTH + WALK) / 2, 0], [MASS_W, WALK - PLINTH, THICK], 'stone'),
  box([s * MID, PLINTH / 2, 0], [MASS_W, PLINTH, THICK + 0.4], 'stoneDark'),
  ...masonry({ axis: 'z', sign: 1, plane: H, mid: s * MID, len: MASS_W, y0: PLINTH, y1: WALK, course: 0.8, block: 1.5, seed: 40 + s, light: 0.2 }),
  ...masonry({ axis: 'z', sign: -1, plane: H, mid: s * MID, len: MASS_W, y0: PLINTH, y1: WALK, course: 0.8, block: 2.0, seed: 44 + s, light: 0.1 }),
  ...spikeRows('z', 1, H, s < 0 ? -5 : OPEN, s < 0 ? -OPEN : 5, [2.4], 1.2, 50 + s * 3),
  ...banner('z', 1, H, s * MID, 4.9, 0.9, 1.7),
]);

function leaf(s, open) {
  const w = OPEN / PLANKS, parts = [];
  const at = (u, y, t) => open ? [s * (OPEN - t - 0.07), y, LEAF_Z - u] : [s * (OPEN - u), y, LEAF_Z + t];
  const sz = (su, sy, st) => open ? [st, sy, su] : [su, sy, st];
  const top = i => { const x = OPEN - i * w; return SPRING + Math.sqrt(Math.max(OPEN * OPEN - x * x, 0)) - 0.14; };
  for (let i = 0; i < PLANKS; i++) {
    const h = top(i) - 0.12;
    parts.push(box(at((i + 0.5) * w, 0.12 + h / 2, 0), sz(w - 0.012, h, LEAF_T), BODY[(i + (s > 0 ? 1 : 0)) % 3]));
  }
  for (const y of [0.55, 1.75]) parts.push(box(at(OPEN / 2, y, LEAF_T / 2 + 0.04), sz(OPEN - 0.1, 0.2, 0.08), 'iron'));
  parts.push(beam(at(0.15, 0.6, LEAF_T / 2 + 0.1), at(OPEN - 0.15, 1.8, LEAF_T / 2 + 0.1), 0.13, 'woodDark'));
  parts.push(box(at(OPEN / 2, 1.15, LEAF_T / 2 + 0.03), sz(OPEN - 0.3, 0.26, 0.05), 'team'));
  parts.push(box(at(OPEN / 2, 1.15, LEAF_T / 2 + 0.06), sz(0.5, 0.36, 0.03), 'red'));
  for (const [u, y] of [[0.6, 0.9], [1.5, 1.45]]) parts.push(spike(at(u, y, LEAF_T / 2), open ? [-s, 0.3, 0] : [0, 0.3, 1], 0.3, 0.06, 'iron'));
  return parts;
}

function gate(open) {
  return [
    ...masses, ...voussoirs, ...fill, ...fangs,
    box([0, (TOP0 + WALK) / 2, 0], [2 * OPEN, WALK - TOP0, THICK], 'stone'),
    ...skull('z', 1, H + 0.12, 0, SPRING + OPEN + RING + 0.75, 2.2, true),
    ...wallTop({ walk: WALK, thick: THICK, deck: 'stone', parapet: 'stone', merlon: 'stoneDark' }),
    box([0, 0.03, 0], [2 * OPEN, 0.06, THICK], 'earth'),
    box([0, 0.06, LEAF_Z], [2 * OPEN, 0.12, 0.5], 'stoneDark'),
    ...[-1, 1].flatMap(s => leaf(s, open)),
  ];
}

const base = { folder: '3D-models-defense', static: true, joints: [], palette: PALETTE, clips: [], preview: '25,90,155', previewGap: 150, previewZoom: 1.6 };
export const closed = { ...base, name: 'orc-stone-gate', parts: gate(false) };
export const opened = { ...base, name: 'orc-stone-gate-open', parts: gate(true) };
