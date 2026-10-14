// castle.mjs — a castle: a curtain wall with battlements and buttresses, four round corner towers
// with open crenellated fighting platforms (no roofs; braziers and team flags inside), a gatehouse
// with a half-raised portcullis, torches, a lowered drawbridge on chains and banners, a tall keep
// with four turrets, windows, a balcony and a flag, and a cobbled courtyard with a flagstone path,
// a well, a training dummy, a weapon rack, barrels and crates.
// Static: one mesh, one palette material, no skeleton, no clips.
// Model space: meters, feet at y = 0, origin at the centre of the walls, the gate and the
// drawbridge face +Z.
import { DEG, rotX, rotY } from '../unit-glb.mjs';
import { barrel, box, flag, strut } from './kit.mjs';

const PALETTE = [
  { name: 'stone', hex: '#8f8c84' },
  { name: 'stoneDark', hex: '#615f5a' },
  { name: 'stoneLight', hex: '#aaa69c' },
  { name: 'cobble', hex: '#8a806e' },
  { name: 'timber', hex: '#553826' },
  { name: 'timberLight', hex: '#8a6038' },
  { name: 'slit', hex: '#1d2229' },
  { name: 'iron', hex: '#37373b' },
  { name: 'water', hex: '#4d7fa6' },
  { name: 'gold', hex: '#d9a93a' },
  { name: 'team', hex: '#2f5da8' },
  { name: 'teamDark', hex: '#22447d' },
  { name: 'fire', hex: '#f08a2c' },
];

const CX = 6.2, CZ = 5.2;                     // corner tower centres
const T = 1.0, WH = 4.6;                      // wall thickness, height
const GATE_W = 0.9, GATE_Z0 = 3.9, GATE_Z1 = 6.55, GATE_H = 6.8;
const KEEP = { x: 0, z: -1.9, w: 5.2, h: 10.0 };

// Merlons along a wall: n boxes evenly spaced between a and b on one axis.
const merlons = (axis, fixed, a, b, n, y) => Array.from({ length: n }, (_, i) => {
  const t = a + (b - a) * (i + 0.5) / n;
  return box(axis === 'x' ? [t, y, fixed] : [fixed, y, t], axis === 'x' ? [0.7, 0.8, 0.36] : [0.36, 0.8, 0.7], 'stone');
});

// An open corner tower: a drum, a flared corbel course that carries the platform floor, and a
// ring of eight parapet panels with merlons — no roof. Inside: a brazier, a hatch, a team flag.
const POLY = Math.cos(Math.PI / 8);            // apothem / vertex radius of the 8-gon
const TR = 1.25;                               // corner tower radius scale
const FLOOR = 6.6, PARAPET = 1.1, WALL_T = 0.32;
const drumApothem = y => (1.75 - 0.17 * y / (FLOOR - 0.4)) * TR * POLY;
const radial = (x, z, a, rad, y, [h, len], color, thick = WALL_T) =>
  box([x + rad * Math.cos(a), y, z + rad * Math.sin(a)], [thick, h, len], color, { q: rotY(-a) });

const tower = (x, z) => {
  const sx = Math.sign(x), sz = Math.sign(z);
  const apo = 2.0 * TR * POLY, chord = 2 * apo * Math.tan(Math.PI / 8), mid = apo - WALL_T / 2;
  const edges = Array.from({ length: 8 }, (_, i) => (22.5 + 45 * i) * DEG);
  const out = Math.atan2(sz, sx);
  const slitAngles = [out - 22.5 * DEG, out + 22.5 * DEG];
  return [
    { c: [x, (FLOOR - 0.4) / 2, z], h: FLOOR - 0.4, r: [1.75 * TR, 1.58 * TR], n: 8, color: 'stone' },
    { c: [x, FLOOR - 0.2, z], h: 0.4, r: [1.58 * TR, 2.0 * TR], n: 8, color: 'stoneDark' },
    ...edges.flatMap(a => [
      radial(x, z, a, mid, FLOOR + PARAPET / 2, [PARAPET, chord], 'stone'),
      radial(x, z, a, mid, FLOOR + PARAPET + 0.35, [0.7, 0.75], 'stone'),
    ]),
    ...slitAngles.map(a => radial(x, z, a, drumApothem(4.2) + 0.01, 4.2, [0.7, 0.14], 'slit', 0.08)),
    { c: [x - sx * 0.75, FLOOR + 0.4, z - sz * 0.75], h: 0.8, r: [0.1, 0.38], n: 6, color: 'iron' },
    { c: [x - sx * 0.75, FLOOR + 1.0, z - sz * 0.75], h: 0.4, r: [0.3, 0.04], n: 6, color: 'fire' },
    box([x + sx * 0.6, FLOOR + 0.03, z - sz * 0.6], [0.8, 0.06, 0.8], 'timberLight'),
    ...flag(x, FLOOR, z, { pole: 3.0 }),
  ];
};

// A turret on a keep corner.
const turret = (x, z) => [
  { c: [x, KEEP.h + 0.8, z], h: 1.6, r: [0.85, 0.8], n: 8, color: 'stone' },
  { c: [x, KEEP.h + 1.6 + 0.9, z], h: 1.8, r: [1.05, 0.05], n: 8, color: 'team' },
  { c: [x, KEEP.h + 3.0, z], h: 0.3, r: [0.12, 0.12], n: 6, color: 'gold' },
];

const KX = KEEP.w / 2, KZF = KEEP.z + KEEP.w / 2;
const WELL = [-3.2, 1.8];

const PARTS = [
  // Courtyard floor and wall footing.
  box([0, 0.05, 0], [2 * CX, 0.1, 2 * CZ], 'cobble'),
  box([0, 0.3, -CZ], [2 * CX, 0.6, T + 0.4], 'stoneDark'),
  ...[1, -1].map(s => box([s * CX, 0.3, 0], [T + 0.4, 0.6, 2 * CZ], 'stoneDark')),
  ...[1, -1].map(s => box([s * (GATE_W + 1.2 + (CX - GATE_W - 1.2 + 0.2) / 2 + 0.2), 0.3, CZ], [CX - GATE_W - 1.2 - 0.2, 0.6, T + 0.4], 'stoneDark')),

  // Curtain wall: back, two sides, the front in two pieces beside the gatehouse; merlons on top.
  box([0, WH / 2, -CZ], [2 * CX, WH, T], 'stone'),
  ...[1, -1].map(s => box([s * CX, WH / 2, 0], [T, WH, 2 * CZ], 'stone')),
  ...[1, -1].map(s => box([s * (3.1 + (CX - 3.1) / 2), WH / 2, CZ], [CX - 3.1, WH, T], 'stone')),
  ...merlons('x', -CZ - 0.32, -CX + 1, CX - 1, 5, WH + 0.4),
  ...[1, -1].flatMap(s => merlons('z', s * (CX + 0.32), -CZ + 1, CZ - 1, 4, WH + 0.4)),
  ...[1, -1].flatMap(s => merlons('x', CZ + 0.32, s * 3.4, s * (CX - 1), 2, WH + 0.4)),
  ...[1, -1].map(s => box([s * (CX + 0.0), WH + 0.07, 0], [T + 0.08, 0.14, 2 * CZ], 'stoneDark')),
  box([0, WH + 0.07, -CZ], [2 * CX, 0.14, T + 0.08], 'stoneDark'),
  ...[1, -1].map(s => box([s * (3.1 + (CX - 3.1) / 2), WH + 0.07, CZ], [CX - 3.1, 0.14, T + 0.08], 'stoneDark')),

  // Four corner towers.
  ...tower(CX, CZ), ...tower(-CX, CZ), ...tower(CX, -CZ), ...tower(-CX, -CZ),

  // Wall details: buttresses and arrow slits outside.
  ...[-3, 0, 3].map(x => box([x, 2.1, -CZ - T / 2 - 0.2], [0.6, WH - 0.5, 0.4], 'stoneDark')),
  ...[1, -1].flatMap(s => [-2, 2].map(z => box([s * (CX + T / 2 + 0.2), 2.1, z], [0.4, WH - 0.5, 0.6], 'stoneDark'))),
  ...[-1.5, 1.5].map(x => box([x, 2.8, -CZ - T / 2 - 0.02], [0.1, 0.8, 0.06], 'slit')),
  ...[1, -1].map(s => box([s * (CX + T / 2 + 0.02), 2.8, 0], [0.06, 0.8, 0.1], 'slit')),

  // Gatehouse: two flanking towers, a block over the passage, battlements, a lintel, a half-raised
  // portcullis, banners, and a drawbridge on chains.
  ...[1, -1].flatMap(s => [
    box([s * (GATE_W + 1.15), GATE_H / 2, (GATE_Z0 + GATE_Z1) / 2], [2.3, GATE_H, GATE_Z1 - GATE_Z0], 'stone'),
    box([s * (GATE_W + 1.15), GATE_H + 0.07, (GATE_Z0 + GATE_Z1) / 2], [2.5, 0.14, GATE_Z1 - GATE_Z0 + 0.2], 'stoneDark'),
    ...merlons('x', GATE_Z1 - 0.15, s * (GATE_W + 0.1), s * (GATE_W + 2.3), 3, GATE_H + 0.54),
    box([s * (GATE_W + 2.3 - 0.1), GATE_H + 0.54, (GATE_Z0 + GATE_Z1) / 2], [0.36, 0.8, 0.7], 'stone'),
    box([s * (GATE_W + 1.15), 4.8, GATE_Z1 + 0.02], [0.14, 0.7, 0.06], 'slit'),
    box([s * (GATE_W + 1.15), 5.0, GATE_Z1 + 0.04], [0.8, 1.9, 0.04], 'team'),
    box([s * (GATE_W + 1.15), 4.0, GATE_Z1 + 0.04], [0.8, 0.14, 0.04], 'teamDark'),
    box([s * (GATE_W + 1.15), 5.5, GATE_Z1 + 0.06], [0.28, 0.28, 0.012], 'gold'),
  ]),
  box([0, 5.1, (GATE_Z0 + GATE_Z1) / 2], [2 * GATE_W, 3.4, GATE_Z1 - GATE_Z0], 'stone'),
  box([0, GATE_H + 0.07, (GATE_Z0 + GATE_Z1) / 2], [2 * GATE_W + 0.2, 0.14, GATE_Z1 - GATE_Z0 + 0.2], 'stoneDark'),
  ...merlons('x', GATE_Z1 - 0.15, -GATE_W, GATE_W, 3, GATE_H + 0.54),
  box([0, 3.45, GATE_Z1 + 0.05], [2 * GATE_W + 0.5, 0.3, 0.2], 'stoneDark'),
  box([0, 3.0, GATE_Z0 + 0.5], [2 * GATE_W, 0.12, 1.0], 'slit'),
  ...[-0.7, -0.35, 0, 0.35, 0.7].map(x => box([x, 2.45, GATE_Z1 - 0.2], [0.07, 1.8, 0.07], 'iron')),
  ...[1.9, 2.8].map(y => box([0, y, GATE_Z1 - 0.2], [1.6, 0.07, 0.07], 'iron')),
  box([0, 4.4, GATE_Z1 + 0.04], [0.14, 0.7, 0.06], 'slit'),
  box([0, 0.14, (GATE_Z0 + GATE_Z1) / 2 + 0.2], [2 * GATE_W, 0.08, GATE_Z1 - GATE_Z0 + 0.4], 'stoneDark'),
  box([0, 0.3, GATE_Z1 + 1.15], [1.7, 0.14, 2.4], 'timberLight', { q: rotX(7 * DEG), pivot: [0, 0.3, GATE_Z1 + 1.15] }),
  ...[0.5, 1.6].map(dz => box([0, 0.3 - dz * Math.tan(7 * DEG) + 0.08, GATE_Z1 - 0.05 + dz], [1.74, 0.04, 0.1], 'timber', { q: rotX(7 * DEG), pivot: [0, 0.3, GATE_Z1 + 1.15] })),
  ...[1, -1].map(s => strut(s * 0.8, [3.3, GATE_Z1 + 0.1], [0.45, GATE_Z1 + 2.2], 0.06, 'iron')),

  ...[1, -1].map(s => box([s * (GATE_W + 0.15), 1.7, GATE_Z1 + 0.06], [0.3, 3.4, 0.12], 'stoneLight')),
  ...[1, -1].flatMap(s => [
    box([s * (GATE_W + 0.5), 3.0, GATE_Z1 + 0.14], [0.1, 0.1, 0.16], 'iron'),
    { c: [s * (GATE_W + 0.5), 3.3, GATE_Z1 + 0.14], h: 0.4, r: [0.14, 0.03], n: 6, color: 'fire' },
  ]),

  // The keep: a tall block, cornice, merlons, four turrets, a door, slits, banners, a flag.
  box([KEEP.x, KEEP.h / 2, KEEP.z], [KEEP.w, KEEP.h, KEEP.w], 'stone'),
  box([KEEP.x, 0.3, KEEP.z], [KEEP.w + 0.4, 0.6, KEEP.w + 0.4], 'stoneDark'),
  box([KEEP.x, KEEP.h + 0.1, KEEP.z], [KEEP.w + 0.5, 0.3, KEEP.w + 0.5], 'stoneDark'),
  ...merlons('x', KEEP.z + KX + 0.12, -KX + 1.1, KX - 1.1, 2, KEEP.h + 0.65),
  ...[1, -1].flatMap(s => merlons('z', s * (KX + 0.12), KEEP.z - KX + 1.1, KEEP.z + KX - 1.1, 1, KEEP.h + 0.65)),
  ...[1, -1].flatMap(sx => [1, -1].flatMap(sz => turret(sx * KX, KEEP.z + sz * KX))),
  box([0, 8.0, KZF + 0.02], [0.18, 0.9, 0.06], 'slit'),
  ...[-1.6, 1.6].map(x => box([x, 6.0, KZF + 0.02], [0.18, 0.9, 0.06], 'slit')),
  ...[-1.6, 1.6].map(x => box([x, 3.4, KZF + 0.02], [0.18, 0.9, 0.06], 'slit')),
  box([0, 1.3, KZF + 0.03], [1.5, 2.4, 0.1], 'stoneDark'),
  box([0, 1.2, KZF + 0.07], [1.1, 2.2, 0.08], 'timber'),
  box([0, 1.15, KZF + 0.12], [0.9, 2.0, 0.04], 'timberLight'),
  box([0, 1.15, KZF + 0.15], [0.05, 2.0, 0.02], 'timber'),
  box([0, 0.12, KZF + 0.5], [2.0, 0.24, 1.0], 'stoneDark'),
  ...[1, -1].map(s => box([s * 1.0, 6.2, KZF + 0.04], [0.9, 3.2, 0.04], 'team')),
  ...[1, -1].map(s => box([s * 1.0, 4.5, KZF + 0.04], [0.9, 0.14, 0.04], 'teamDark')),
  ...[1, -1].map(s => box([s * 1.0, 6.9, KZF + 0.06], [0.3, 0.3, 0.012], 'gold')),
  box([0, 3.1, KZF + 0.4], [1.9, 0.14, 0.8], 'timberLight'),
  ...[1, -1].map(s => box([s * 0.7, 2.75, KZF + 0.25], [0.14, 0.55, 0.5], 'stoneDark')),
  box([0, 8.9, KZF + 0.07], [KEEP.w + 0.2, 0.16, 0.14], 'stoneDark'),
  box([0, 8.9, KEEP.z - KX - 0.07], [KEEP.w + 0.2, 0.16, 0.14], 'stoneDark'),
  ...[1, -1].map(s => box([s * (KX + 0.07), 8.9, KEEP.z], [0.14, 0.16, KEEP.w], 'stoneDark')),
  ...[1, -1].flatMap(s => [
    box([s * (KX + 0.02), 6.0, KEEP.z], [0.04, 1.3, 0.5], 'stoneLight'),
    box([s * (KX + 0.04), 6.0, KEEP.z], [0.06, 0.9, 0.18], 'slit'),
  ]),
  box([0, 6.0, KEEP.z - KX - 0.02], [0.5, 1.3, 0.04], 'stoneLight'),
  box([0, 6.0, KEEP.z - KX - 0.04], [0.18, 0.9, 0.06], 'slit'),
  ...flag(0, KEEP.h + 0.25, KEEP.z, { pole: 3.2 }),

  // Courtyard: a well with a little frame, barrels, crates.
  { c: [WELL[0], 0.45, WELL[1]], h: 0.7, r: [0.65, 0.65], n: 8, color: 'stoneLight' },
  { c: [WELL[0], 0.78, WELL[1]], h: 0.04, r: [0.5, 0.5], n: 8, color: 'water' },
  ...[1, -1].map(s => box([WELL[0] + s * 0.6, 1.2, WELL[1]], [0.1, 1.5, 0.1], 'timber')),
  box([WELL[0], 1.95, WELL[1]], [1.5, 0.1, 0.14], 'timber'),
  ...barrel(3.6, 3.2), ...barrel(-3.6, -3.4),
  box([-4.5, 0.45, 2.4], [0.8, 0.7, 0.8], 'timberLight'),
  box([-4.5, 1.05, 2.4], [0.5, 0.5, 0.5], 'timber'),
  box([0, 0.12, 2.3], [1.6, 0.04, 3.2], 'stoneLight'),
  // Training dummy and a weapon rack.
  box([3.9, 0.8, -2.2], [0.12, 1.6, 0.12], 'timber'),
  box([3.9, 1.3, -2.2], [0.9, 0.1, 0.1], 'timber'),
  box([3.9, 1.7, -2.2], [0.3, 0.3, 0.3], 'timberLight'),
  ...[-4.9, -3.9].map(x => box([x, 0.6, -1.4], [0.1, 1.2, 0.1], 'timber')),
  box([-4.4, 1.0, -1.4], [1.1, 0.08, 0.08], 'timber'),
  ...[-4.65, -4.4, -4.15].map(x => box([x, 0.95, -1.4], [0.04, 1.7, 0.04], 'iron')),
];

export default {
  name: 'castle', static: true, joints: [], palette: PALETTE, parts: PARTS, clips: [], maxTriangles: 4000,
  preview: '25,90,155', previewGap: 560,
  withAt: [0, GATE_Z1 + 3.4],
  previewZoom: 2.2,
};
