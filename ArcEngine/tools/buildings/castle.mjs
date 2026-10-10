// castle.mjs — a castle: a curtain wall with battlements and four round corner towers under team
// coloured cone roofs, a gatehouse with a half-raised portcullis, a lowered drawbridge on chains
// and banners, a tall keep with four turrets and a flag, and a cobbled courtyard with a well and
// barrels.
// Static: one mesh, one palette material, no skeleton, no clips.
// Model space: meters, feet at y = 0, origin at the centre of the walls, the gate and the
// drawbridge face +Z.
import { DEG, rotX } from '../unit-glb.mjs';
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
];

const CX = 6.2, CZ = 5.2;                     // corner tower centres
const T = 1.0, WH = 4.6;                      // wall thickness, height
const TOWER_R = 1.55, TOWER_H = 7.2;
const GATE_W = 0.9, GATE_Z0 = 3.9, GATE_Z1 = 6.55, GATE_H = 6.8;
const KEEP = { x: 0, z: -1.9, w: 5.2, h: 10.0 };

// Merlons along a wall: n boxes evenly spaced between a and b on one axis.
const merlons = (axis, fixed, a, b, n, y) => Array.from({ length: n }, (_, i) => {
  const t = a + (b - a) * (i + 0.5) / n;
  return box(axis === 'x' ? [t, y, fixed] : [fixed, y, t], axis === 'x' ? [0.7, 0.8, 0.36] : [0.36, 0.8, 0.7], 'stone');
});

// A round corner tower: shaft, flared top, a cone roof in the team colour, a slit.
const tower = (x, z) => [
  { c: [x, TOWER_H / 2, z], h: TOWER_H, r: [TOWER_R + 0.15, TOWER_R], n: 8, color: 'stone' },
  { c: [x, TOWER_H + 0.25, z], h: 0.5, r: [TOWER_R, TOWER_R + 0.3], n: 8, color: 'stoneDark' },
  { c: [x, TOWER_H + 0.5 + 1.2, z], h: 2.4, r: [TOWER_R + 0.35, 0.05], n: 8, color: 'team' },
  { c: [x, TOWER_H + 0.55, z], h: 0.1, r: [TOWER_R + 0.35, TOWER_R + 0.35], n: 8, color: 'teamDark' },
  box([x + Math.sign(x) * TOWER_R * 0.97, 5.6, z], [0.08, 0.7, 0.14], 'slit'),
];

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
  ...flag(0, KEEP.h + 0.25, KEEP.z, { pole: 3.2 }),

  // Courtyard: a well with a little frame, barrels, crates.
  { c: [WELL[0], 0.45, WELL[1]], h: 0.7, r: [0.65, 0.65], n: 8, color: 'stoneLight' },
  { c: [WELL[0], 0.78, WELL[1]], h: 0.04, r: [0.5, 0.5], n: 8, color: 'water' },
  ...[1, -1].map(s => box([WELL[0] + s * 0.6, 1.2, WELL[1]], [0.1, 1.5, 0.1], 'timber')),
  box([WELL[0], 1.95, WELL[1]], [1.5, 0.1, 0.14], 'timber'),
  ...barrel(3.6, 3.2), ...barrel(-4.4, -3.6),
  box([-4.5, 0.45, 2.4], [0.8, 0.7, 0.8], 'timberLight'),
];

export default {
  name: 'castle', static: true, joints: [], palette: PALETTE, parts: PARTS, clips: [],
  preview: '25,90,155', previewGap: 560,
  withAt: [0, GATE_Z1 + 3.4],
  previewZoom: 2.2,
};
