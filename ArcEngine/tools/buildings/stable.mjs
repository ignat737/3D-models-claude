// stable.mjs — a long timber stable: plank walls on a stone footing, a steep thatched roof with a
// hay-loft dormer and a hoist beam, three stalls with Dutch doors (two bay and white horses look
// out), a paddock fence with a gap, a hay trough, hay bales, team lintels over the stalls and a
// flag on the ridge.
// Static: one mesh, one palette material, no skeleton, no clips.
// Model space: meters, feet at y = 0, origin at the centre of the footprint, the stall doors face
// +Z, the ridge runs along X.
import { DEG, rotX, rotZ } from '../unit-glb.mjs';
import { box, flag, gableEnd, gableRoof } from './kit.mjs';

const PALETTE = [
  { name: 'stone', hex: '#8f8c84' },
  { name: 'stoneDark', hex: '#615f5a' },
  { name: 'wood', hex: '#a47a4a' },
  { name: 'woodDark', hex: '#5b3d25' },
  { name: 'woodLight', hex: '#c49a62' },
  { name: 'thatch', hex: '#c9a85c' },
  { name: 'thatchDark', hex: '#a08240' },
  { name: 'hay', hex: '#e2c04e' },
  { name: 'slit', hex: '#1d2229' },
  { name: 'iron', hex: '#37373b' },
  { name: 'horseBay', hex: '#7a4a2a' },
  { name: 'horseMane', hex: '#2b2018' },
  { name: 'horseWhite', hex: '#dcd8d0' },
  { name: 'gold', hex: '#d9a93a' },
  { name: 'team', hex: '#2f5da8' },
  { name: 'teamDark', hex: '#22447d' },
];

const LEN = 8.0, DEPTH = 4.6, HX = LEN / 2, HZ = DEPTH / 2;
const FOOT = 0.35, TOP = 2.6;
const PITCH = 40 * DEG;
const STALLS = [-2.5, 0, 2.5];

const roof = gableRoof({
  pitch: PITCH, halfZ: HZ + 0.1, baseY: TOP + 0.1, len: LEN + 0.7, over: [0.6, 0.45], thick: 0.38,
  colors: ['thatch', 'thatchDark', 'thatch'], courses: [0.9, 1.9, 2.9], ridgeR: 0.3,
});
const RIDGE = roof.ridge;
const gable = side => gableEnd({ x: HX + 0.05, side, baseY: TOP + 0.08, halfZ: HZ + 0.1, pitch: PITCH, color: 'wood' });

// A Dutch door in the front wall at x: dark open upper half in a frame, closed lower leaf, a team lintel.
const stall = x => [
  box([x, 1.82, HZ + 0.02], [1.7, 1.0, 0.06], 'woodDark'),
  box([x, 1.82, HZ + 0.045], [1.4, 0.8, 0.04], 'slit'),
  box([x, FOOT + 0.62, HZ + 0.03], [1.7, 1.25, 0.08], 'woodDark'),
  box([x, FOOT + 0.62, HZ + 0.07], [1.4, 1.05, 0.04], 'woodLight'),
  box([x, FOOT + 0.62, HZ + 0.1], [1.4, 0.07, 0.02], 'woodDark'),
  box([x, FOOT + 0.62, HZ + 0.1], [0.07, 1.05, 0.02], 'woodDark'),
  box([x + 0.55, FOOT + 1.15, HZ + 0.11], [0.1, 0.1, 0.03], 'iron'),
  box([x, 2.45, HZ + 0.06], [1.9, 0.2, 0.1], 'team'),
  box([x, 2.34, HZ + 0.06], [1.9, 0.05, 0.1], 'teamDark'),
];

// A horse looking out over a stall door: neck, mane, head, muzzle, ears, eyes.
const horse = (x, body, mane) => {
  const nc = [x, 1.85, HZ + 0.05];
  return [
    box(nc, [0.34, 0.9, 0.4], body, { q: rotX(28 * DEG), pivot: nc }),
    box([x, 2.0, HZ - 0.06], [0.1, 0.8, 0.3], mane, { q: rotX(28 * DEG), pivot: [x, 2.0, HZ - 0.06] }),
    box([x, 2.12, HZ + 0.55], [0.3, 0.34, 0.6], body, { q: rotX(35 * DEG), pivot: [x, 2.12, HZ + 0.55] }),
    box([x, 1.92, HZ + 0.84], [0.22, 0.22, 0.2], body === 'horseWhite' ? 'horseBay' : mane, { q: rotX(35 * DEG), pivot: [x, 1.92, HZ + 0.84] }),
    ...[1, -1].flatMap(s => [
      box([x + s * 0.1, 2.46, HZ + 0.3], [0.07, 0.2, 0.07], body),
      box([x + s * 0.165, 2.1, HZ + 0.62], [0.02, 0.05, 0.06], 'slit'),
    ]),
    box([x, 2.4, HZ + 0.4], [0.16, 0.07, 0.3], mane, { q: rotX(35 * DEG), pivot: [x, 2.4, HZ + 0.4] }),
  ];
};

// A paddock fence run along X at z from x0 to x1: posts and two rails.
const fence = (x0, x1, z) => {
  const n = Math.round((x1 - x0) / 1.6), step = (x1 - x0) / n;
  return [
    ...Array.from({ length: n + 1 }, (_, i) => box([x0 + i * step, 0.55, z], [0.14, 1.1, 0.14], 'woodDark')),
    ...[0.45, 0.85].map(y => box([(x0 + x1) / 2, y, z], [x1 - x0, 0.09, 0.07], 'wood')),
  ];
};
const fenceZ = (z0, z1, x) => {
  const n = Math.max(1, Math.round((z1 - z0) / 1.6)), step = (z1 - z0) / n;
  return [
    ...Array.from({ length: n }, (_, i) => box([x, 0.55, z0 + (i + 1) * step], [0.14, 1.1, 0.14], 'woodDark')),
    ...[0.45, 0.85].map(y => box([x, y, (z0 + z1) / 2], [0.07, 0.09, z1 - z0], 'wood')),
  ];
};

// A hay bale with two straps.
const bale = (x, y, z) => [
  box([x, y, z], [0.9, 0.45, 0.5], 'hay'),
  ...[-0.2, 0.2].map(dx => box([x + dx, y + 0.01, z], [0.04, 0.46, 0.52], 'woodDark')),
];

const FZ = HZ + 1.7;                             // paddock fence line
const DORMER = { x: 0, w: 1.7, z: HZ + 0.02, top: TOP + 1.45 };

const PARTS = [
  // Footing, plank walls with proud boards, corner posts, plates.
  box([0, FOOT / 2, 0], [LEN + 0.2, FOOT, DEPTH + 0.2], 'stoneDark'),
  box([0, FOOT + (TOP - FOOT) / 2, 0], [LEN, TOP - FOOT, DEPTH], 'wood'),
  ...[1, -1].flatMap(sx => [1, -1].map(sz => box([sx * HX, FOOT + (TOP - FOOT) / 2, sz * HZ], [0.26, TOP - FOOT, 0.26], 'woodDark'))),
  ...[1, -1].map(s => box([0, TOP + 0.07, s * HZ], [LEN + 0.3, 0.14, 0.3], 'woodDark')),
  ...[1, -1].map(s => box([s * HX, TOP + 0.07, 0], [0.3, 0.14, DEPTH], 'woodDark')),
  ...[-3.3, -1.25, 1.25, 3.3].map(x => box([x, FOOT + (TOP - FOOT) / 2, HZ + 0.015], [0.1, TOP - FOOT, 0.1], 'woodDark')),
  ...[-3.0, -1.0, 1.0, 3.0].map(x => box([x, FOOT + (TOP - FOOT) / 2, -HZ - 0.015], [0.1, TOP - FOOT, 0.1], 'woodDark')),
  ...[-1.5, 0, 1.5].flatMap(z => [1, -1].map(s => box([s * (HX + 0.015), FOOT + (TOP - FOOT) / 2, z], [0.1, TOP - FOOT, 0.1], 'woodDark'))),
  box([0, 1.15, HZ + 0.012], [LEN - 0.4, 0.1, 0.06], 'woodDark'),
  gable(1), gable(-1),
  ...[1, -1].flatMap(s => [-1.2, -0.4, 0.4, 1.2].map(z => box([s * (HX + 0.07), TOP + 0.5, z], [0.04, 0.8, 0.08], 'woodDark'))),
  ...[1, -1].map(s => box([s * (HX + 0.08), TOP + 0.9, 0], [0.04, 0.4, 0.5], 'slit')),
  ...roof.parts,

  // The hay-loft dormer: front wall with a dark door and a shed roof, a hoist beam.
  box([DORMER.x, TOP + 0.7, DORMER.z + 0.1], [DORMER.w, 1.3, 0.2], 'wood'),
  box([DORMER.x, TOP + 0.6, DORMER.z + 0.22], [1.0, 0.9, 0.06], 'woodDark'),
  box([DORMER.x, TOP + 0.6, DORMER.z + 0.255], [0.84, 0.76, 0.04], 'slit'),
  box([DORMER.x, TOP + 0.38, DORMER.z + 0.34], [0.84, 0.3, 0.3], 'hay'),
  ...[1, -1].map(s => box([DORMER.x + s * DORMER.w / 2, TOP + 0.7, DORMER.z - 0.7], [0.14, 1.3, 1.7], 'wood')),
  box([DORMER.x, TOP + 1.42, DORMER.z - 0.55], [DORMER.w + 0.4, 0.2, 2.1], 'thatch', { q: rotX(10 * DEG), pivot: [DORMER.x, TOP + 1.42, DORMER.z - 0.55] }),
  box([DORMER.x, TOP + 1.3, DORMER.z + 0.46], [DORMER.w + 0.4, 0.12, 0.12], 'thatchDark'),
  box([DORMER.x, TOP + 1.62, DORMER.z + 0.65], [0.12, 0.12, 1.4], 'woodDark'),
  box([DORMER.x, TOP + 1.3, DORMER.z + 1.2], [0.03, 0.62, 0.03], 'iron'),
  { c: [DORMER.x, TOP + 0.9, DORMER.z + 1.2], h: 0.16, r: [0.08, 0.08], n: 6, q: rotZ(90 * DEG), color: 'iron' },

  // Stalls and the two horses.
  ...STALLS.flatMap(stall),
  ...horse(STALLS[0], 'horseBay', 'horseMane'),
  ...horse(STALLS[2], 'horseWhite', 'horseMane'),
  box([-1.25, 2.5, HZ + 0.06], [0.3, 0.3, 0.07], 'gold'),
  // A horseshoe over the middle stall door.
  ...[-1, 1].map(s => box([s * 0.16, 2.75, HZ + 0.12], [0.07, 0.3, 0.05], 'gold', { q: rotZ(s * 12 * DEG), pivot: [s * 0.16, 2.75, HZ + 0.12] })),
  box([0, 2.62, HZ + 0.12], [0.3, 0.07, 0.05], 'gold'),

  // Paddock: front fence with a gap before the middle stall, two returns, a trough, hay.
  ...fence(-HX, -1.1, FZ), ...fence(1.1, HX, FZ),
  ...fenceZ(HZ + 0.1, FZ, -HX), ...fenceZ(HZ + 0.1, FZ, HX),
  box([-2.5, 0.3, HZ + 1.15], [1.3, 0.34, 0.5], 'woodDark'),
  box([-2.5, 0.45, HZ + 1.15], [1.1, 0.12, 0.3], 'hay'),
  box([2.5, 0.3, HZ + 1.15], [1.3, 0.34, 0.5], 'woodDark'),
  box([2.5, 0.45, HZ + 1.15], [1.1, 0.12, 0.3], 'hay'),
  ...bale(3.2, 0.225, HZ + 0.4), ...bale(2.0, 0.225, HZ + 0.4), ...bale(2.6, 0.675, HZ + 0.4),
  // A team blanket over the fence rail.
  box([-0.4, 0.9, FZ], [0.8, 0.1, 0.22], 'team'),

  // Flag on the ridge.
  ...flag(3.0, RIDGE, 0, { pole: 1.5, poleColor: 'woodDark' }),
];

export default {
  name: 'stable', static: true, joints: [], palette: PALETTE, parts: PARTS, clips: [],
  preview: '25,90,155', previewGap: 330,
  withAt: [0, 4.6],
  previewZoom: 1.45,
};
