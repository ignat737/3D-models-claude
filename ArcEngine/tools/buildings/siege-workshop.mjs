// siege-workshop.mjs — the human siege workshop, where catapults and siege towers are built: a
// plaster-and-timber hall on a stone base with a red-tile roof and a wide gate, the leaves
// swung open, a hoist jib over the gate and team banners. Inside: a workbench, a saw and timber;
// in the yard: a catapult under construction (left), a stack of stone shot, barrels, a big spoked
// wheel and a siege-tower scaffold with a ladder (right), a flag on the ridge.
// Static: one mesh, one palette material, no skeleton, no clips.
// Model space: meters, feet at y = 0, origin at the centre of the hall, the gate faces +Z, the
// ridge runs along X.
import { DEG, qmul, rotX, rotY, rotZ } from '../unit-glb.mjs';
import { barrel, box, flag, gableEnd, gableRoof, strut } from './kit.mjs';

const PALETTE = [
  { name: 'stone', hex: '#7d7a72' },
  { name: 'stoneDark', hex: '#5a5853' },
  { name: 'stoneLight', hex: '#a29e93' },
  { name: 'plaster', hex: '#d9ccaa' },
  { name: 'timber', hex: '#5e4028' },
  { name: 'wood', hex: '#a47a4a' },
  { name: 'woodLight', hex: '#d2aa6c' },
  { name: 'roof', hex: '#8a4a36' },
  { name: 'roofDark', hex: '#6a3626' },
  { name: 'roofLight', hex: '#a65e44' },
  { name: 'slit', hex: '#1d2229' },
  { name: 'iron', hex: '#37373b' },
  { name: 'steel', hex: '#c4c9d0' },
  { name: 'rope', hex: '#b59a62' },
  { name: 'team', hex: '#2f5da8' },
  { name: 'teamDark', hex: '#22447d' },
];

const LEN = 8.0, DEPTH = 6.0, HX = LEN / 2, HZ = DEPTH / 2;
const FOOT = 0.3, TOP = 3.3, T = 0.4, OW = 1.8, OH = 2.9;
const PITCH = 33 * DEG;

const roof = gableRoof({
  pitch: PITCH, halfZ: HZ + 0.1, baseY: TOP + 0.16, len: LEN + 0.8, over: [0.6, 0.5], thick: 0.24,
  colors: ['roof', 'roofDark', 'roofLight'], courses: [0.9, 1.8, 2.7],
});
const gable = side => gableEnd({ x: HX + 0.03, side, baseY: TOP + 0.14, halfZ: HZ + 0.1, pitch: PITCH, thick: T, color: 'plaster' });

// A beam in the plane z = const from (x1, y1) to (x2, y2).
const strutZ = (z, [x1, y1], [x2, y2], w, color) => {
  const c = [(x1 + x2) / 2, (y1 + y2) / 2, z];
  return box(c, [Math.hypot(x2 - x1, y2 - y1), w, w], color, { q: rotZ(Math.atan2(y2 - y1, x2 - x1)), pivot: c });
};

// Parts given in a leaf's own frame (x along the leaf from the hinge, z out of its face) turned by th about Y.
const leafAt = (hx, hz, th, local) => local.map(p => {
  const [x, y, z] = p.c, c = [hx + x * Math.cos(th) + z * Math.sin(th), y, hz - x * Math.sin(th) + z * Math.cos(th)];
  return box(c, p.s, p.color, { q: rotY(th), pivot: c });
});
const LEAF = 1.8, LEAF_H = OH - FOOT;
const leaf = [
  { c: [LEAF / 2, FOOT + LEAF_H / 2, 0], s: [LEAF, LEAF_H, 0.1], color: 'wood' },
  ...[0.3, 0.52, 0.8].map(f => ({ c: [LEAF / 2, FOOT + LEAF_H * f, 0.07], s: [LEAF - 0.08, 0.12, 0.05], color: 'iron' })),
  ...[0.3, 0.9, 1.5].map(x => ({ c: [x, FOOT + LEAF_H / 2, 0.065], s: [0.1, LEAF_H - 0.1, 0.03], color: 'timber' })),
];
const OPEN = 70 * DEG;
const gate = [
  ...leafAt(OW, HZ, Math.atan2(-Math.sin(OPEN), -Math.cos(OPEN)), leaf),
  ...leafAt(-OW, HZ, Math.atan2(-Math.sin(OPEN), Math.cos(OPEN)), leaf),
];

const WALLS = [
  box([0, FOOT / 2, 0], [LEN + 0.3, FOOT, DEPTH + 0.3], 'stoneDark'),
  box([0, TOP + 0.06, 0], [LEN + 0.2, 0.16, DEPTH + 0.2], 'timber'),
  // stone course (0.3 - 1.1) and plaster above it
  box([0, 0.7, -HZ + T / 2], [LEN, 0.8, T + 0.04], 'stone'),
  ...[1, -1].map(s => box([s * (HX - T / 2), 0.7, 0], [T + 0.04, 0.8, DEPTH], 'stone')),
  ...[1, -1].map(s => box([s * 2.9, 0.7, HZ - T / 2], [2.2, 0.8, T + 0.04], 'stone')),
  box([0, 2.2, -HZ + T / 2], [LEN, 2.2, T], 'plaster'),
  ...[1, -1].map(s => box([s * (HX - T / 2), 2.2, 0], [T, 2.2, DEPTH], 'plaster')),
  ...[1, -1].map(s => box([s * 2.9, 2.2, HZ - T / 2], [2.2, 2.2, T], 'plaster')),
  box([0, 3.1, HZ - T / 2], [2 * OW, 0.4, T], 'plaster'),
  box([0, OH - 0.1, HZ - T / 2], [2 * OW + 0.6, 0.3, T + 0.06], 'timber'),
];

// The timber frame stands proud of the plaster by 3 cm on each side.
const P = T + 0.06, PH = TOP - FOOT, PY = FOOT + PH / 2;
const FRAME = [
  ...[[1, 1], [-1, 1], [1, -1], [-1, -1]].map(([sx, sz]) => box([sx * (HX - 0.2), PY, sz * (HZ - 0.2)], [0.5, PH, 0.5], 'timber')),
  ...[1, -1].map(s => box([s * (OW + 0.15), PY, HZ - T / 2], [0.3, PH, P], 'timber')),
  ...[1, -1].map(s => box([s * 3.0, PY, HZ - T / 2], [0.24, PH, P], 'timber')),
  ...[-2.5, 0, 2.5].map(x => box([x, PY, -HZ + T / 2], [0.26, PH, P], 'timber')),
  ...[1, -1].map(s => box([s * (HX - T / 2), PY, 0], [P, PH, 0.26], 'timber')),
  ...[1, -1].map(s => box([s * 2.9, 2.2, HZ - T / 2], [2.2, 0.2, P], 'timber')),
  box([0, 2.2, -HZ + T / 2], [LEN - 0.5, 0.2, P], 'timber'),
  ...[1, -1].map(s => box([s * (HX - T / 2), 2.2, 0], [P, 0.2, DEPTH - 0.5], 'timber')),
  // diagonal braces in the upper panels of the front and the side walls
  ...[1, -1].flatMap(s => [
    strutZ(HZ - T / 2, [s * 2.1, 2.3], [s * 2.9, 3.2], 0.14, 'timber'),
    strutZ(HZ - T / 2, [s * 3.8, 2.3], [s * 3.1, 3.2], 0.14, 'timber'),
    strutZ(-HZ + T / 2, [s * 0.15, 2.3], [s * 1.2, 3.2], 0.14, 'timber'),
    strutZ(-HZ + T / 2, [s * 2.4, 3.2], [s * 2.6, 2.3], 0.14, 'timber'),
  ].map(p => ({ ...p, s: [p.s[0], p.s[1], P] }))),
];

// A window with team shutters on a side wall (x = side * HX), looking along X.
const windowAt = (side, z) => [
  box([side * (HX + 0.012), 2.0, z], [0.024, 1.0, 0.8], 'timber'),
  box([side * (HX + 0.02), 2.0, z], [0.02, 0.8, 0.6], 'slit'),
  ...[1, -1].map(s => box([side * (HX + 0.036), 2.0, z + s * 0.5], [0.05, 0.9, 0.26], 'team')),
];

// Inside the gate: a workbench with a saw and a vice, a pile of planks and a lantern.
const INSIDE = [
  box([-2.4, FOOT + 0.45, -1.7], [2.2, 0.12, 0.9], 'woodLight'),
  ...[-1, 1].flatMap(sx => [-1, 1].map(sz => box([-2.4 + sx * 0.95, FOOT + 0.2, -1.7 + sz * 0.35], [0.12, 0.4, 0.12], 'timber'))),
  box([-2.4, FOOT + 0.2, -1.7], [1.9, 0.08, 0.7], 'wood'),
  box([-2.0, FOOT + 0.62, -1.7], [0.9, 0.2, 0.04], 'steel'),
  box([-1.5, FOOT + 0.62, -1.7], [0.2, 0.16, 0.14], 'timber'),
  box([-3.2, FOOT + 0.62, -1.6], [0.3, 0.2, 0.3], 'iron'),
  box([1.9, FOOT + 0.3, -2.1], [3.0, 0.6, 1.1], 'woodLight'),
  ...[0.12, 0.3, 0.48].map(y => box([1.9, FOOT + y, -2.1 + 0.56], [3.04, 0.03, 0.02], 'wood')),
  box([0.2, FOOT + 0.14, -2.3], [0.4, 0.28, 0.4], 'wood'),
  box([-3.7, 2.35, -1.7], [0.1, 0.5, 0.1], 'timber'),
  box([-3.55, 2.55, -1.7], [0.3, 0.04, 0.04], 'iron'),
  box([-3.4, 2.4, -1.7], [0.22, 0.28, 0.22], 'slit'),
];

// The hoist jib over the gate, its rope and hook.
const JIB = [
  box([0, 3.1, HZ + 0.8], [0.2, 0.2, 1.6], 'timber'),
  box([0, 3.0, HZ + 1.45], [0.18, 0.2, 0.18], 'iron'),
  box([0, 2.55, HZ + 1.45], [0.05, 0.95, 0.05], 'rope'),
  box([0, 2.0, HZ + 1.45], [0.14, 0.12, 0.14], 'iron'),
  box([0, 1.85, HZ + 1.45], [0.05, 0.22, 0.05], 'iron'),
];

const BANNERS = [1, -1].flatMap(s => [
  box([s * 2.5, 3.0, HZ + 0.03], [0.8, 0.08, 0.08], 'timber'),
  box([s * 2.5, 2.2, HZ + 0.06], [0.6, 1.5, 0.04], 'team'),
  box([s * 2.5, 2.35, HZ + 0.09], [0.24, 0.3, 0.03], 'steel'),
  box([s * 2.5, 1.35, HZ + 0.06], [0.6, 0.1, 0.04], 'teamDark'),
]);

// A catapult under construction in the yard at (X, Z): rails on four wheels, two uprights, a
// throwing arm propped on a beam, a bucket and a coil of rope.
const CX = -HX - 2.3, CZ = 0.4;
const catapult = [
  ...[1, -1].map(s => box([CX + s * 0.6, 0.9, CZ], [0.2, 0.2, 3.0], 'wood')),
  ...[-1.1, 0.3].map(dz => box([CX, 0.9, CZ + dz], [1.4, 0.2, 0.2], 'woodLight')),
  ...[1, -1].flatMap(s => [-1, 1].flatMap(sz => [
    { c: [CX + s * 0.86, 0.45, CZ + sz * 1.0], h: 0.14, r: [0.45, 0.45], n: 8, q: rotZ(90 * DEG), color: 'woodLight' },
    { c: [CX + s * 0.94, 0.45, CZ + sz * 1.0], h: 0.05, r: [0.12, 0.12], n: 6, q: rotZ(90 * DEG), color: 'iron' },
  ])),
  ...[-1, 1].map(sz => box([CX, 0.45, CZ + sz * 1.0], [1.6, 0.1, 0.1], 'timber')),
  ...[1, -1].map(s => box([CX + s * 0.5, 1.75, CZ - 0.2], [0.2, 1.6, 0.2], 'wood')),
  box([CX, 2.5, CZ - 0.2], [1.2, 0.18, 0.18], 'woodLight'),
  strut(CX + 0.5, [1.0, CZ + 0.9], [1.75, CZ - 0.2], 0.12, 'timber'),
  strut(CX - 0.5, [1.0, CZ + 0.9], [1.75, CZ - 0.2], 0.12, 'timber'),
  strut(CX, [1.0, CZ + 1.3], [3.1, CZ - 0.9], 0.2, 'woodLight'),
  box([CX, 3.15, CZ - 1.0], [0.55, 0.14, 0.55], 'iron'),
  box([CX, 2.95, CZ - 1.0], [0.5, 0.28, 0.04], 'rope'),
  box([CX + 0.15, 1.1, CZ + 1.35], [0.1, 0.1, 0.1], 'steel'),
  { c: [CX + 0.9, 0.12, CZ + 2.1], h: 0.16, r: [0.35, 0.35], n: 8, color: 'rope' },
];

// A pyramid of stone shot beside it.
const shot = (x, y, z) => ({ c: [x, y + 0.2, z], h: 0.4, r: [0.22, 0.2], n: 6, color: 'stoneLight' });
const SHOTS = [
  ...[[-0.25, 0], [0.25, 0], [0, 0.4]].map(([dx, dz]) => shot(CX - 2.0 + dx, 0, CZ + 0.2 + dz - 0.6)),
  shot(CX - 2.0, 0.4, CZ - 0.2),
  ...[[-0.25, 0], [0.25, 0]].map(([dx]) => shot(CX - 2.0 + dx, 0, CZ + 0.4)),
];

// A big spoked cart wheel leaning on the front wall beside the gate.
const wheel = (() => {
  const x = -3.3, z = HZ + 0.4, y = 0.85, R = 0.85, q = rotX(90 * DEG - 12 * DEG), pivot = [x, y, z];
  return [
    { c: [x, y, z], h: 0.14, r: [R, R], n: 10, q, color: 'woodLight' },
    { c: [x, y, z], h: 0.2, r: [0.2, 0.2], n: 6, q, color: 'iron' },
    ...[0, 60, 120].map(a => box([x, y, z], [2 * R - 0.2, 0.1, 0.17], 'wood', { q: qmul(q, rotY(a * DEG)), pivot })),
  ];
})();

// The siege-tower scaffold on the +X side: four posts, three levels of rails, braces, a ladder.
const SX = HX + 2.0, SZ = 0.6, SW = 1.0, SD = 1.3, SH = 4.6;
const scaffold = [
  ...[1, -1].flatMap(sx => [1, -1].map(sz => box([SX + sx * SW, SH / 2, SZ + sz * SD], [0.2, SH, 0.2], 'wood'))),
  ...[1.1, 2.4, 3.7].flatMap(y => [
    ...[1, -1].map(sx => box([SX + sx * SW, y, SZ], [0.14, 0.14, 2 * SD], 'woodLight')),
    ...[1, -1].map(sz => box([SX, y, SZ + sz * SD], [2 * SW, 0.14, 0.14], 'woodLight')),
  ]),
  ...[1, -1].flatMap(sx => [
    strut(SX + sx * SW, [1.1, SZ - SD], [2.4, SZ + SD], 0.1, 'timber'),
    strut(SX + sx * SW, [2.4, SZ + SD], [3.7, SZ - SD], 0.1, 'timber'),
  ]),
  strutZ(SZ + SD, [SX - SW, 1.1], [SX + SW, 2.4], 0.1, 'timber'),
  ...[1, -1].map(s => box([SX + s * 0.35, 1.6, SZ + SD + 0.2], [0.07, 3.0, 0.07], 'timber')),
  ...[0.4, 0.85, 1.3, 1.75, 2.2, 2.65].map(y => box([SX, y, SZ + SD + 0.2], [0.7, 0.06, 0.06], 'timber')),
  ...[1, -1].flatMap(sx => [-1, 1].map(sz => ({ c: [SX + sx * (SW + 0.2), 0.4, SZ + sz * SD * 0.7], h: 0.14, r: [0.4, 0.4], n: 8, q: rotZ(90 * DEG), color: 'woodLight' }))),
  box([SX, 3.77, SZ], [2 * SW - 0.2, 0.06, 2 * SD - 0.2], 'wood'),
];

const PARTS = [
  ...WALLS, ...FRAME, ...gate, ...windowAt(1, -1.0), ...windowAt(-1, -1.0), ...windowAt(1, 1.0), ...windowAt(-1, 1.0),
  ...roof.parts, gable(1), gable(-1),
  ...INSIDE, ...JIB, ...BANNERS, ...catapult, ...SHOTS, ...wheel, ...scaffold,
  ...barrel(2.4, HZ + 0.7), ...barrel(2.9, HZ + 0.9, { r: 0.26, h: 0.62 }),
  ...flag(2.6, roof.ridge, 0, { pole: 1.8 }),
];

export default {
  name: 'siege-workshop', static: true, joints: [], palette: PALETTE, parts: PARTS, clips: [], maxTriangles: 3000,
  preview: '25,90,155', previewGap: 520, previewZoom: 1.8, withAt: [0, 4.6],
};
