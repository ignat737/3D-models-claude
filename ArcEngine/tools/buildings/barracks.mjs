// barracks.mjs — a medieval barracks: a long hall with a stone ground floor and a half-timbered
// upper floor, a red tile gable roof, a stone chimney on the -X gable, a double door between two
// team-coloured banners, arrow slits, a spear rack, a training dummy and a flag on the ridge.
// Static: one mesh, one palette material, no skeleton, no clips.
// Model space: meters, feet at y = 0, origin at the centre of the footprint, the door faces +Z,
// the ridge runs along X.
import { DEG, qmul, rotX, rotZ } from '../unit-glb.mjs';

const PALETTE = [
  { name: 'stone', hex: '#8f8c84' },
  { name: 'stoneDark', hex: '#615f5a' },
  { name: 'plaster', hex: '#d8ccb0' },
  { name: 'timber', hex: '#553826' },
  { name: 'timberLight', hex: '#8a6038' },
  { name: 'tile', hex: '#a8553a' },
  { name: 'tileDark', hex: '#7e3d2b' },
  { name: 'tileLight', hex: '#c46c4a' },
  { name: 'slit', hex: '#1d2229' },
  { name: 'iron', hex: '#37373b' },
  { name: 'steel', hex: '#b9bfc6' },
  { name: 'straw', hex: '#cdb06a' },
  { name: 'gold', hex: '#d9a93a' },
  { name: 'team', hex: '#2f5da8' },
  { name: 'teamDark', hex: '#22447d' },
];

const LEN = 7.0, DEPTH = 4.4;
const HX = LEN / 2, HZ = DEPTH / 2;
const STONE_TOP = 1.5, WALL_TOP = 2.9;
const PITCH = 38 * DEG, T = 0.24;
const OVER = 0.35, OVER_END = 0.3;
const GABLE_X = HX - 0.05 + 0.1;
const GABLE_H = HZ * Math.tan(PITCH);
const GABLE_BASE = WALL_TOP - 0.02;
const RIDGE = GABLE_BASE + GABLE_H + T / Math.cos(PITCH);
const ROOF_LEN = LEN + 2 * OVER_END;
const FRONT = HZ;

const box = (c, s, color, extra) => ({ c, s, color, ...extra });

// A roof slab on one slope: s0..s1 measured down the top surface from the ridge line.
function slab(side, s0, s1, thick, lift, color) {
  const dir = [0, -Math.sin(PITCH), Math.cos(PITCH) * side], nrm = [0, Math.cos(PITCH), Math.sin(PITCH) * side];
  const mid = (s0 + s1) / 2, d = thick / 2 - lift;
  const c = [0, RIDGE + dir[1] * mid - nrm[1] * d, dir[2] * mid - nrm[2] * d];
  return box(c, [ROOF_LEN, thick, s1 - s0], color, { q: rotX(PITCH * side), pivot: c });
}

// A timber strut in the plane of a gable end, from (y1, z1) to (y2, z2).
function strut(x, [y1, z1], [y2, z2], w, color) {
  const len = Math.hypot(y2 - y1, z2 - z1), c = [x, (y1 + y2) / 2, (z1 + z2) / 2];
  return box(c, [w, w, len], color, { q: rotX(Math.atan2(-(y2 - y1), z2 - z1)), pivot: c });
}

const SLOPE = (HZ + OVER) / Math.cos(PITCH);
const slopes = [1, -1].flatMap(side => [
  slab(side, -0.15, SLOPE, T, 0, 'tile'),
  slab(side, SLOPE - 0.16, SLOPE, T + 0.08, 0.04, 'tileDark'),
  slab(side, 0.9, 1.1, T, -0.02, 'tileDark'),
  slab(side, 1.8, 2.0, T, -0.02, 'tileDark'),
]);

// A triangular prism lying on its side: a 3-sided frustum turned about Z, apex up.
const GR = GABLE_H / 1.5;
const gable = side => ({
  c: [side * (GABLE_X - 0.15), GABLE_BASE + GR / 2, 0],
  h: 0.3, r: [GR, GR], n: 3, sq: HZ / (GR * Math.sqrt(3) / 2),
  q: rotZ(90 * DEG), color: 'plaster',
});

// A spear standing behind the rack's top bar and leaning forward onto it, tilted about its foot.
const spear = (x, z, roll) => {
  const q = qmul(rotZ(roll * DEG), rotX(6 * DEG)), pivot = [x, 0.05, z];
  return [
    { c: [x, 1.0, z], h: 1.9, r: [0.022, 0.022], n: 4, color: 'timberLight', q, pivot },
    { c: [x, 2.05, z], h: 0.2, r: [0.045, 0.01], n: 4, color: 'steel', q, pivot },
  ];
};

const door = { w: 0.85, top: 2.2 };
const dummy = [-2.5, FRONT + 1.35];
const rack = [2.45, FRONT + 0.75];

const PARTS = [
  // Footing, stone ground floor with a string course, plaster upper floor with its plates.
  box([0, 0.15, 0], [LEN + 0.16, 0.3, DEPTH + 0.16], 'stoneDark'),
  box([0, 0.3 + (STONE_TOP - 0.3) / 2, 0], [LEN, STONE_TOP - 0.3, DEPTH], 'stone'),
  box([0, STONE_TOP + 0.06, 0], [LEN + 0.1, 0.12, DEPTH + 0.1], 'timber'),
  box([0, (STONE_TOP + 0.12 + WALL_TOP) / 2, 0], [LEN, WALL_TOP - STONE_TOP - 0.12, DEPTH], 'plaster'),
  ...[1, -1].flatMap(sx => [1, -1].flatMap(sz => [
    box([sx * HX, STONE_TOP / 2, sz * HZ], [0.4, STONE_TOP, 0.4], 'stoneDark'),
    box([sx * HX, (STONE_TOP + WALL_TOP) / 2 + 0.06, sz * HZ], [0.2, WALL_TOP - STONE_TOP - 0.12, 0.2], 'timber'),
  ])),
  ...[1, -1].map(sz => box([0, WALL_TOP - 0.1, sz * HZ], [LEN + 0.2, 0.2, 0.2], 'timber')),
  ...[1, -1].map(sx => box([sx * HX, WALL_TOP - 0.1, 0], [0.2, 0.2, DEPTH], 'timber')),
  // Studs on the upper floor, front and back, between the banners and the windows.
  ...[1, -1].flatMap(sz => [-2.1, -0.65, 0.65, 2.1].map(x => box([x, (STONE_TOP + WALL_TOP) / 2 + 0.06, sz * (HZ + 0.015)], [0.12, WALL_TOP - STONE_TOP - 0.34, 0.12], 'timber'))),

  // Gable ends: a plaster triangle and braces; a loft window on the +X end.
  gable(1), gable(-1),
  ...[1, -1].flatMap(sx => [1, -1].map(sz => strut(sx * (GABLE_X + 0.03), [WALL_TOP, sz * 1.9], [WALL_TOP + 1.25, sz * 0.5], 0.12, 'timber'))),
  box([GABLE_X + 0.02, 3.6, 0], [0.1, 0.5, 0.36], 'timber'),
  box([GABLE_X + 0.04, 3.6, 0], [0.1, 0.38, 0.24], 'slit'),

  // Roof: tile slabs with darker courses, a rolled ridge.
  ...slopes,
  { c: [0, RIDGE + 0.02, 0], h: ROOF_LEN + 0.1, r: [0.27, 0.27], n: 6, q: rotZ(90 * DEG), color: 'tileLight' },

  // Double door: stone lintel and step, timber frame, two leaves with iron straps and rings.
  box([0, door.top + 0.12, FRONT + 0.03], [2 * door.w + 0.5, 0.24, 0.1], 'stoneDark'),
  box([0, (0.3 + door.top) / 2, FRONT + 0.02], [2 * door.w + 0.2, door.top - 0.3, 0.06], 'timber'),
  ...[1, -1].map(k => box([k * door.w / 2, (0.3 + door.top - 0.05) / 2, FRONT + 0.055], [door.w - 0.02, door.top - 0.35, 0.04], 'timberLight')),
  box([0, (0.3 + door.top - 0.05) / 2, FRONT + 0.08], [0.04, door.top - 0.35, 0.02], 'timber'),
  ...[0.6, 1.6].map(y => box([0, y, FRONT + 0.081], [2 * door.w - 0.04, 0.09, 0.012], 'iron')),
  ...[1, -1].map(k => box([k * 0.18, 1.1, FRONT + 0.1], [0.08, 0.08, 0.04], 'iron')),
  box([0, 0.09, FRONT + 0.4], [2 * door.w + 0.7, 0.18, 0.7], 'stoneDark'),

  // Banners on both sides of the door: a crossbar, team cloth with a dark hem and a gold badge.
  ...[1, -1].flatMap(k => [
    box([k * 1.85, 2.55, FRONT + 0.1], [0.8, 0.07, 0.07], 'timber'),
    box([k * 1.85, 1.92, FRONT + 0.1], [0.62, 1.22, 0.025], 'team'),
    box([k * 1.85, 1.38, FRONT + 0.11], [0.62, 0.16, 0.025], 'teamDark'),
    box([k * 1.85, 2.0, FRONT + 0.125], [0.2, 0.2, 0.012], 'gold'),
  ]),

  // Arrow slits on the stone floor (front and both sides), shuttered windows above.
  ...[1, -1].map(k => box([k * 2.85, 0.95, FRONT + 0.005], [0.12, 0.5, 0.02], 'slit')),
  ...[1, -1].flatMap(sx => [0.9, -0.9].map(z => box([sx * (HX + 0.005), 0.95, z], [0.02, 0.5, 0.12], 'slit'))),
  ...[1, -1].flatMap(k => [
    box([k * 2.85, 2.2, FRONT + 0.02], [0.7, 0.6, 0.06], 'timber'),
    box([k * 2.85, 2.2, FRONT + 0.04], [0.5, 0.4, 0.04], 'slit'),
    box([k * 2.85, 1.86, FRONT + 0.08], [0.82, 0.07, 0.14], 'timberLight'),
  ]),

  // Stone chimney against the -X gable, rising past the ridge.
  box([-HX - 0.33, 1.5, 0], [0.6, 3.0, 1.1], 'stone'),
  box([-HX - 0.3, (3.0 + RIDGE + 0.55) / 2, 0], [0.5, RIDGE + 0.55 - 3.0, 0.8], 'stone'),
  box([-HX - 0.3, RIDGE + 0.61, 0], [0.64, 0.12, 0.94], 'stoneDark'),

  // Spear rack: two posts, two bars, a round shield, three spears leaning on the top bar.
  ...[1, -1].map(k => box([rack[0] + k * 0.75, 0.65, rack[1]], [0.09, 1.3, 0.09], 'timber')),
  box([rack[0], 1.0, rack[1]], [1.6, 0.07, 0.07], 'timberLight'),
  box([rack[0], 0.4, rack[1]], [1.6, 0.07, 0.07], 'timberLight'),
  { c: [rack[0] + 0.3, 0.7, rack[1] + 0.08], h: 0.06, r: [0.27, 0.27], n: 8, q: rotX(90 * DEG), color: 'team' },
  { c: [rack[0] + 0.3, 0.7, rack[1] + 0.115], h: 0.03, r: [0.1, 0.1], n: 8, q: rotX(90 * DEG), pivot: [rack[0] + 0.3, 0.7, rack[1] + 0.08], color: 'gold' },
  ...[-0.5, -0.3, -0.1].flatMap((dx, i) => spear(rack[0] + dx, rack[1] - 0.12, [-3, 2, -1][i])),

  // Training dummy: base, post, crossbar, straw body with a team sash, a sack head.
  box([dummy[0], 0.05, dummy[1]], [0.6, 0.1, 0.6], 'timber'),
  box([dummy[0], 0.8, dummy[1]], [0.12, 1.4, 0.12], 'timberLight'),
  box([dummy[0], 1.25, dummy[1]], [0.95, 0.1, 0.1], 'timberLight'),
  box([dummy[0], 1.1, dummy[1]], [0.4, 0.6, 0.28], 'straw'),
  box([dummy[0], 1.1, dummy[1]], [0.42, 0.12, 0.3], 'team'),
  { c: [dummy[0], 1.58, dummy[1]], h: 0.26, r: [0.15, 0.13], n: 6, color: 'straw' },

  // Flag on the ridge: the team colour that shows from the RTS camera.
  box([2.6, RIDGE + 0.8, 0], [0.07, 1.6, 0.07], 'timber'),
  box([2.6, RIDGE + 1.25, 0.5], [0.04, 0.55, 0.92], 'team'),
  box([2.6, RIDGE + 1.25, 1.05], [0.04, 0.3, 0.2], 'teamDark'),
];

export default {
  name: 'barracks', static: true, joints: [], palette: PALETTE, parts: PARTS, clips: [],
  maxTriangles: 1400,
  preview: '25,90,155', previewGap: 330,
  withAt: [-1.0, 3.3],
  previewZoom: 1.25,
};
