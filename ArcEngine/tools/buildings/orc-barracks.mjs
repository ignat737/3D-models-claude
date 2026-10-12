// orc-barracks.mjs — an orc war hall on a hexagonal plan: a stone hexagonal footing, six walls of thick
// crooked logs (the ends stick out at the corners, alternating from side to side), a steep six-sided
// hide roof with bone hip ridges and horns on every corner, a smoke lantern with fire and a pennant on
// top. Double iron-strapped door under a tusked skull between two hide banners in the team colours on the
// front face, shuttered windows on the other five faces (two rows), bone spikes in the walls, braziers,
// an axe rack, a straw dummy, a war drum, a skull stake and a totem outside the +X corner.
// 9.2 m across the flats, 10.6 m across the corners (the human barracks is 7.0 x 4.4 m).
// Static: one mesh, one palette material, no skeleton, no clips.
// Model space: meters, feet at y = 0, origin at the centre of the hexagon, the door faces +Z. Every face
// is built once on the +Z side (u along the wall, y up, z = A + depth) and turned by `spin` to the others.
import { DEG, PALETTE, axe, banner, beam, box, brazier, door, drum, faceSpike, horn, logColor, pennant, rnd, rock, rotZ, skull, skullStake, spike, spin } from './orc-kit.mjs';

const A = 4.6;                                        // apothem: centre to the outer face of a wall
const R = A * 2 / Math.sqrt(3);                       // circumradius: centre to a corner
const PLINTH = 0.35, ROWS = 7, LOG_R = 0.34;
const FLAT = LOG_R * Math.sqrt(3) / 2, PITCH_Y = 1.8 * LOG_R;
const TOP = PLINTH + 2 * LOG_R + (ROWS - 1) * PITCH_Y;
const faceAngle = k => -60 * k * DEG;                 // k = 0 is the front, then round to the left

// Round parts are six-sided frusta about Y with a corner on +X, so a flat looks to +Z, like the front wall.
const hex = (y, h, a0, a1, color) => ({ c: [0, y, 0], h, r: [a0 * 2 / Math.sqrt(3), a1 * 2 / Math.sqrt(3)], n: 6, color });

// Log courses of all six walls. On a side the logs lie along its tangent; a log reaches past both
// corners on every other side and course and stops short on the rest, so the ends interlock.
const dist = A - FLAT, SIDE = dist * 2 / Math.sqrt(3);
const logs = Array.from({ length: 6 }, (_, j) => spin(Array.from({ length: ROWS }, (_, k) => {
  const over = (k + j) % 2 === 0, e = 0.25 * (0.6 + 0.8 * rnd(k + 3 * j, 8));
  const len = over ? SIDE + 2 * e : SIDE - 2.3 * LOG_R;
  return { c: [0, PLINTH + LOG_R + k * PITCH_Y, dist], h: len, r: [LOG_R, LOG_R * 0.9], n: 6, q: rotZ(90 * DEG), color: logColor(k + j) };
}), faceAngle(j))).flat();

// A window on the +Z face: dark frame, the opening, team shutters on both sides.
const windowAt = (u, y, w, h, shutters) => [
  box([u, y, A + 0.04], [w + 0.24, h + 0.24, 0.08], 'woodDark'),
  box([u, y, A + 0.09], [w, h, 0.04], 'slit'),
  ...(shutters ? [1, -1].map(s => box([u + s * (w / 2 + 0.16), y, A + 0.11], [0.26, h + 0.1, 0.05], 'team')) : []),
];

// What every wall but the front gets: two shuttered windows, a small one above, two bone spikes.
const plainFace = [
  ...[-1.3, 1.3].flatMap(u => windowAt(u, 2.3, 0.8, 0.9, true)),
  ...windowAt(0, 3.9, 0.6, 0.7, false),
  ...[-2.1, 2.1].map((u, i) => faceSpike('z', 1, A, u, 0.95 + 0.2 * i, 0.8, 0.07, 0.3, 'bone')),
];

// A rack of axes: two posts, a bar, four axes hung by the heads.
const rack = (x, z) => [
  ...[-0.8, 0.8].map(s => box([x + s, 0.7, z], [0.12, 1.4, 0.12], 'woodDark')),
  box([x, 1.3, z], [1.8, 0.1, 0.1], 'wood'),
  box([x, 0.6, z], [1.8, 0.08, 0.08], 'wood'),
  ...[-0.6, -0.2, 0.2, 0.6].flatMap((dx, i) => axe(x + dx - 0.12, 0.85, z + 0.07, { len: 0.95, tilt: i % 2 ? 4 : -3, color: i % 2 ? 'iron' : 'stoneLight' })),
];

// A training dummy: a post, arms, a hide body, a skull for a head.
const dummy = (x, z) => [
  box([x, 0.9, z], [0.14, 1.8, 0.14], 'woodDark'),
  box([x, 1.35, z], [1.0, 0.12, 0.12], 'wood'),
  box([x, 1.2, z], [0.5, 0.7, 0.3], 'hide'),
  box([x, 1.2, z + 0.16], [0.52, 0.12, 0.03], 'teamDark'),
  box([x, 0.72, z], [0.62, 0.1, 0.22], 'woodDark'),
  ...skull('z', 1, z - 0.1, x, 1.95, 0.9),
  { c: [x, 0.05, z], h: 0.1, r: [0.3, 0.3], n: 6, color: 'stoneDark' },
];

// The hexagonal hide roof: a six-sided pyramid, dark courses, bone hip ridges, a horn on every corner.
const EAVE = TOP + 0.1, ROOF_H = 3.8, RB = (A + 0.65) * 2 / Math.sqrt(3), RT = 1.0;
const roofR = t => RB + (RT - RB) * t;
const corner = (r, y, a) => [r * Math.cos(a), y, r * Math.sin(a)];
const roof = [
  { c: [0, EAVE + ROOF_H / 2, 0], h: ROOF_H, r: [RB, RT], n: 6, color: 'hide' },
  { c: [0, EAVE - 0.05, 0], h: 0.3, r: [RB + 0.12, RB + 0.06], n: 6, color: 'woodDark' },
  ...[0.3, 0.6].map(t => ({ c: [0, EAVE + ROOF_H * t, 0], h: 0.14, r: [roofR(t) + 0.06, roofR(t) + 0.05], n: 6, color: 'woodDark' })),
  ...Array.from({ length: 6 }, (_, i) => beam(corner(RB, EAVE + 0.02, i * Math.PI / 3), corner(RT, EAVE + ROOF_H, i * Math.PI / 3), 0.22, 'bone')),
  ...Array.from({ length: 6 }, (_, i) => horn(corner(RB + 0.12, EAVE + 0.1, i * Math.PI / 3), [Math.cos(i * Math.PI / 3), 0.9, Math.sin(i * Math.PI / 3)], 1.3)).flat(),
];
const APEX = EAVE + ROOF_H;
const lantern = [
  { c: [0, APEX + 0.6, 0], h: 1.2, r: [0.8, 0.7], n: 6, color: 'stoneDark' },
  { c: [0, APEX + 1.28, 0], h: 0.16, r: [1.0, 1.0], n: 6, color: 'stone' },
  { c: [0, APEX + 1.74, 0], h: 0.8, r: [0.5, 0.02], n: 4, color: 'fire' },
  ...pennant(0, APEX + 1.3, -0.65, 2.1),
];

// Totem outside the corner that looks to +X: built facing +Z at the corner distance, then turned.
const totem = spin([
  box([0, 2.0, R + 0.9], [0.34, 4.0, 0.34], 'woodDark'),
  ...skull('z', 1, R + 1.05, 0, 3.4, 1.4, true),
  ...[-1, 1].map(s => spike([s * 0.1, 4.0, R + 0.9], [s * 0.9, 0.8, 0.3], 0.8, 0.09, 'bone')),
], 90 * DEG);

const front = [
  // Steps, the double door under a big skull, banners, braziers, spikes low on the wall.
  box([0, 0.08, A + 0.6], [3.4, 0.16, 0.8], 'stoneDark'),
  box([0, 0.22, A + 0.4], [2.9, 0.12, 0.45], 'stone'),
  ...door({ x: 0, face: A, y0: PLINTH, w: 2.0, h: 2.5, double: true, skullAt: false }),
  ...skull('z', 1, A + 0.14, 0, PLINTH + 3.55, 1.7, true),
  ...[-2.05, 2.05].flatMap(x => banner('z', 1, A, x, 4.2, 0.8, 1.9)),
  ...[-2.0, 2.0].flatMap(x => brazier(x, 0.75, A + 1.2)),
  ...[-2.4, 2.4].map((x, i) => faceSpike('z', 1, A, x, 0.9 + 0.15 * i, 0.7, 0.07, 0.2, 'bone')),
];

const PARTS = [
  hex(PLINTH / 2, PLINTH, A + 0.45, A + 0.45, 'stoneDark'),
  hex((PLINTH + TOP) / 2, TOP - PLINTH, dist, dist, 'char'),
  ...logs,
  hex(TOP + 0.03, 0.14, A + 0.1, A + 0.1, 'woodDark'),
  ...roof,
  ...lantern,
  ...front,
  ...[1, 2, 3, 4, 5].flatMap(k => spin(plainFace, faceAngle(k))),
  ...totem,

  // The yard in front: axes, the dummy, a drum, a skull stake; boulders behind.
  ...rack(3.9, A + 1.5),
  ...dummy(-3.9, A + 1.5),
  ...drum(-1.8, A + 2.0, 0.5, 0.75),
  ...skullStake(5.0, A + 0.5, 1.4, 0.9),
  rock(-2.6, -A - 0.8, 0.55, 0.6, 'stone', { turn: 15 }),
  rock(3.0, -A - 0.7, 0.45, 0.45, 'stoneDark', { turn: 60 }),
];

export default {
  name: 'orc-barracks', static: true, joints: [], palette: PALETTE, parts: PARTS, clips: [], maxTriangles: 4000,
  preview: '25,90,155', previewGap: 380, previewZoom: 1.5, withAt: [-1.0, A + 3.2],
};
