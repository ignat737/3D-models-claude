// town-hall.mjs — a town hall: a stone ground floor and a half-timbered upper floor under a red
// tile gable roof, a clock tower on the front with a balcony over the door, a belfry with a bell,
// a team-coloured pyramid roof with a gold finial and flag, team banners at the door, shields on
// the gables and two chimneys.
// Static: one mesh, one palette material, no skeleton, no clips.
// Model space: meters, feet at y = 0, origin at the centre of the hall, the tower and the door face
// +Z, the ridge runs along X.
import { DEG, rotX, rotY, rotZ } from '../unit-glb.mjs';
import { box, flag, gableEnd, gableRoof, strut } from './kit.mjs';

const PALETTE = [
  { name: 'stone', hex: '#9a968c' },
  { name: 'stoneDark', hex: '#66635d' },
  { name: 'plaster', hex: '#ddd1b4' },
  { name: 'timber', hex: '#553826' },
  { name: 'timberLight', hex: '#8a6038' },
  { name: 'tile', hex: '#a8553a' },
  { name: 'tileDark', hex: '#7e3d2b' },
  { name: 'tileLight', hex: '#c46c4a' },
  { name: 'slit', hex: '#1d2229' },
  { name: 'glass', hex: '#6d93b0' },
  { name: 'iron', hex: '#37373b' },
  { name: 'cream', hex: '#efe6cf' },
  { name: 'gold', hex: '#d9a93a' },
  { name: 'team', hex: '#2f5da8' },
  { name: 'teamDark', hex: '#22447d' },
];

const LEN = 9.0, DEPTH = 6.0, HX = LEN / 2, HZ = DEPTH / 2;
const FOOT = 0.4, GROUND_TOP = 3.3, WALL_TOP = 6.1;
const PITCH = 36 * DEG;
const TW = 3.0, TD = 2.6, TZ = HZ + 1.0, TC = TZ - TD / 2;       // tower width, depth, front face, centre z
const SHAFT = 6.4, CLOCK_TOP = 8.4, BELFRY_TOP = 9.8;

const roof = gableRoof({
  pitch: PITCH, halfZ: HZ + 0.05, baseY: WALL_TOP, len: LEN + 0.7, over: [0.45, 0.45], thick: 0.26,
  colors: ['tile', 'tileDark', 'tileLight'], courses: [0.9, 1.8, 2.7, 3.6],
});
const RIDGE = roof.ridge;
const gable = side => gableEnd({ x: HX + 0.05, side, baseY: WALL_TOP - 0.02, halfZ: HZ + 0.05, pitch: PITCH, color: 'plaster' });

// A window in the plane z = face (dir 1 faces +Z, -1 faces -Z): frame, glass, a bar, a sill.
const window = (x, y, face, dir, { w = 0.8, h = 1.2 } = {}) => [
  box([x, y, face + dir * 0.02], [w, h, 0.06], 'timber'),
  box([x, y, face + dir * 0.045], [w - 0.2, h - 0.2, 0.04], 'glass'),
  box([x, y, face + dir * 0.06], [0.05, h - 0.2, 0.03], 'timber'),
  box([x, y - h / 2 - 0.04, face + dir * 0.08], [w + 0.2, 0.08, 0.16], 'stoneDark'),
];

// A clock dial on a tower face: a gold ring, a cream face, two hands. Axis along the face normal.
const clock = (x, y, z, q) => [
  { c: [x, y, z], h: 0.06, r: [0.78, 0.78], n: 10, q, color: 'gold' },
  { c: [x, y, z], h: 0.1, r: [0.64, 0.64], n: 10, q, color: 'cream' },
];

const WIN_X = [2.3, 3.7];
const door = { w: 1.2, top: GROUND_TOP - 0.7 };
const BAL = { z0: TZ, z1: TZ + 0.9, floor: 3.55, x: 1.1 };

const PARTS = [
  // Hall: footing, stone ground floor with quoins and a string course, plaster upper floor in a frame.
  box([0, FOOT / 2, 0], [LEN + 0.3, FOOT, DEPTH + 0.3], 'stoneDark'),
  box([0, (FOOT + GROUND_TOP) / 2, 0], [LEN, GROUND_TOP - FOOT, DEPTH], 'stone'),
  ...[1, -1].flatMap(sx => [1, -1].map(sz => box([sx * HX, (FOOT + GROUND_TOP) / 2, sz * HZ], [0.45, GROUND_TOP - FOOT, 0.45], 'stoneDark'))),
  box([0, GROUND_TOP + 0.08, 0], [LEN + 0.24, 0.16, DEPTH + 0.24], 'stoneDark'),
  box([0, (GROUND_TOP + 0.16 + WALL_TOP) / 2, 0], [LEN - 0.1, WALL_TOP - GROUND_TOP - 0.16, DEPTH - 0.1], 'plaster'),
  ...[1, -1].flatMap(sx => [1, -1].map(sz => box([sx * (HX - 0.05), (GROUND_TOP + 0.16 + WALL_TOP) / 2, sz * (HZ - 0.05)], [0.24, WALL_TOP - GROUND_TOP - 0.16, 0.24], 'timber'))),
  ...[1, -1].map(s => box([0, WALL_TOP - 0.1, s * (HZ - 0.05)], [LEN + 0.1, 0.2, 0.24], 'timber')),
  ...[1, -1].map(s => box([s * (HX - 0.05), WALL_TOP - 0.1, 0], [0.24, 0.2, DEPTH - 0.1], 'timber')),
  ...[-4.3, -3.0, 3.0, 4.3].map(x => box([x, (GROUND_TOP + 0.16 + WALL_TOP - 0.2) / 2, HZ - 0.03], [0.14, WALL_TOP - GROUND_TOP - 0.36, 0.1], 'timber')),
  ...[-3.0, 0, 3.0].map(x => box([x, (GROUND_TOP + 0.16 + WALL_TOP - 0.2) / 2, -HZ + 0.03], [0.14, WALL_TOP - GROUND_TOP - 0.36, 0.1], 'timber')),
  ...[1, -1].flatMap(s => [1, -1].map(z => box([s * (HX - 0.03), (GROUND_TOP + 0.16 + WALL_TOP - 0.2) / 2, z * 1.5], [0.1, WALL_TOP - GROUND_TOP - 0.36, 0.14], 'timber'))),
  // Windows: four a side on both floors of the front, three on the back.
  ...[1, -1].flatMap(s => WIN_X.flatMap(x => [
    ...window(s * x, 2.0, HZ, 1), ...window(s * x, 4.75, HZ - 0.05, 1),
  ])),
  ...[-3, 0, 3].flatMap(x => [...window(x, 2.0, -HZ, -1), ...window(x, 4.75, -HZ + 0.05, -1)]),

  // Gables and the tile roof, two chimneys, gold finials on the ridge ends.
  gable(1), gable(-1),
  ...[1, -1].flatMap(sx => [1, -1].map(sz => strut(sx * (HX + 0.08), [WALL_TOP, sz * 2.3], [WALL_TOP + 1.2, sz * 0.6], 0.14, 'timber'))),
  ...[1, -1].map(s => ({ c: [s * (HX + 0.12), WALL_TOP + 1.0, 0], h: 0.1, r: [0.4, 0.4], n: 10, q: rotZ(90 * DEG), color: 'team' })),
  ...roof.parts,
  ...[1, -1].flatMap(s => [
    box([s * 3.1, RIDGE + 0.9, -0.5], [0.7, 2.4, 0.8], 'stone'),
    box([s * 3.1, RIDGE + 2.15, -0.5], [0.9, 0.14, 1.0], 'stoneDark'),
    { c: [s * (HX + 0.3), RIDGE + 0.1, 0], h: 0.5, r: [0.12, 0.02], n: 4, color: 'gold' },
  ]),

  // The clock tower: stone shaft, plaster stage with a balcony door, clock stage, open belfry, cornice.
  box([0, FOOT / 2, TC], [TW + 0.3, FOOT, TD + 0.3], 'stoneDark'),
  box([0, (FOOT + GROUND_TOP) / 2, TC], [TW, GROUND_TOP - FOOT, TD], 'stone'),
  box([0, GROUND_TOP + 0.08, TC], [TW + 0.24, 0.16, TD + 0.24], 'stoneDark'),
  box([0, (GROUND_TOP + 0.16 + SHAFT) / 2, TC], [TW - 0.1, SHAFT - GROUND_TOP - 0.16, TD - 0.1], 'plaster'),
  ...[1, -1].flatMap(sx => [1, -1].map(sz => box([sx * (TW / 2 - 0.1), (GROUND_TOP + 0.16 + SHAFT) / 2, TC + sz * (TD / 2 - 0.1)], [0.22, SHAFT - GROUND_TOP - 0.16, 0.22], 'timber'))),
  box([0, SHAFT + 0.07, TC], [TW + 0.2, 0.14, TD + 0.2], 'stoneDark'),
  box([0, (SHAFT + CLOCK_TOP) / 2, TC], [TW - 0.2, CLOCK_TOP - SHAFT, TD - 0.2], 'plaster'),
  ...[1, -1].flatMap(sx => [1, -1].map(sz => box([sx * (TW / 2 - 0.2), (SHAFT + CLOCK_TOP) / 2, TC + sz * (TD / 2 - 0.2)], [0.2, CLOCK_TOP - SHAFT, 0.2], 'timber'))),
  box([0, CLOCK_TOP + 0.07, TC], [TW + 0.3, 0.14, TD + 0.3], 'stoneDark'),
  // Belfry: four piers around a dark core, a bell in the front arch, the cornice above.
  box([0, (CLOCK_TOP + BELFRY_TOP) / 2 + 0.07, TC], [2.0, BELFRY_TOP - CLOCK_TOP - 0.14, 1.6], 'slit'),
  ...[1, -1].flatMap(sx => [1, -1].map(sz => box([sx * 1.25, (CLOCK_TOP + BELFRY_TOP) / 2 + 0.07, TC + sz * 1.05], [0.5, BELFRY_TOP - CLOCK_TOP - 0.14, 0.5], 'stone'))),
  { c: [0, 9.25, TC + 1.0], h: 0.5, r: [0.32, 0.14], n: 8, color: 'gold' },
  box([0, 9.55, TC + 1.0], [0.1, 0.1, 0.1], 'iron'),
  box([0, BELFRY_TOP + 0.08, TC], [TW + 0.3, 0.16, TD + 0.3], 'stoneDark'),
  { c: [0, BELFRY_TOP + 1.65, TC], h: 3.0, r: [2.5, 0.05], n: 4, q: rotY(45 * DEG), color: 'team' },
  { c: [0, BELFRY_TOP + 0.55, TC], h: 0.1, r: [2.5, 2.5], n: 4, q: rotY(45 * DEG), color: 'teamDark' },
  { c: [0, BELFRY_TOP + 3.35, TC], h: 0.5, r: [0.2, 0.2], n: 6, color: 'gold' },
  ...flag(0, BELFRY_TOP + 3.6, TC, { pole: 1.8, poleColor: 'gold' }),
  // Clocks on the front and both sides.
  ...clock(0, 7.4, TC + TD / 2 - 0.1, rotX(90 * DEG)),
  box([0, 7.5, TC + TD / 2 - 0.0], [0.07, 0.5, 0.04], 'iron'),
  box([0.12, 7.4, TC + TD / 2 - 0.0], [0.34, 0.07, 0.04], 'iron'),
  ...[1, -1].flatMap(s => [
    ...clock(s * (TW / 2 - 0.1), 7.4, TC, rotZ(90 * DEG)),
  ]),

  // Door with a stone surround, two steps, banners either side, a balcony with a door above.
  box([0, door.top + 0.15, TZ + 0.04], [door.w + 0.7, 0.3, 0.14], 'stoneDark'),
  ...[1, -1].map(s => box([s * (door.w / 2 + 0.2), (FOOT + door.top) / 2, TZ + 0.04], [0.3, door.top - FOOT, 0.14], 'stoneDark')),
  box([0, (FOOT + door.top) / 2, TZ + 0.02], [door.w, door.top - FOOT, 0.08], 'timber'),
  ...[1, -1].map(s => box([s * door.w / 4, (FOOT + door.top - 0.05) / 2, TZ + 0.065], [door.w / 2 - 0.08, door.top - FOOT - 0.1, 0.04], 'timberLight')),
  box([0, (FOOT + door.top - 0.05) / 2, TZ + 0.09], [0.04, door.top - FOOT - 0.1, 0.02], 'timber'),
  box([0, 0.1, TZ + 0.55], [2.2, 0.2, 1.1], 'stoneDark'),
  box([0, 0.3, TZ + 0.3], [1.8, 0.2, 0.6], 'stone'),
  ...[1, -1].map(s => box([s * 1.05, 1.9, TZ + 0.05], [0.55, 1.5, 0.04], 'team')),
  ...[1, -1].map(s => box([s * 1.05, 1.1, TZ + 0.05], [0.55, 0.12, 0.04], 'teamDark')),
  ...[1, -1].map(s => box([s * 1.05, 1.65, TZ + 0.075], [0.2, 0.2, 0.012], 'gold')),
  box([0, BAL.floor - 0.07, (BAL.z0 + BAL.z1) / 2 - 0.02], [2 * BAL.x + 0.2, 0.14, BAL.z1 - BAL.z0 + 0.1], 'timberLight'),
  ...[1, -1].map(s => strut(s * 0.9, [GROUND_TOP - 0.2, TZ + 0.1], [BAL.floor - 0.12, BAL.z1 - 0.05], 0.14, 'stoneDark')),
  ...[1, -1].flatMap(s => [BAL.z1, BAL.z0 + 0.1].map(z => box([s * BAL.x, BAL.floor + 0.42, z], [0.09, 0.84, 0.09], 'timber'))),
  box([0, BAL.floor + 0.86, BAL.z1], [2 * BAL.x + 0.09, 0.08, 0.08], 'timber'),
  ...[1, -1].map(s => box([s * BAL.x, BAL.floor + 0.86, (BAL.z0 + 0.1 + BAL.z1) / 2], [0.08, 0.08, BAL.z1 - BAL.z0 - 0.1], 'timber')),
  box([0, BAL.floor + 0.5, BAL.z1 + 0.05], [1.6, 0.5, 0.03], 'team'),
  box([0, BAL.floor + 0.22, BAL.z1 + 0.05], [1.6, 0.08, 0.03], 'teamDark'),
  box([0, 4.6, TZ + 0.02], [1.0, 1.9, 0.06], 'timber'),
  box([0, 4.6, TZ + 0.045], [0.8, 1.7, 0.04], 'glass'),
  box([0, 4.6, TZ + 0.065], [0.05, 1.7, 0.03], 'timber'),
  box([0, 5.65, TZ + 0.06], [1.3, 0.14, 0.1], 'stoneDark'),
];

export default {
  name: 'town-hall', static: true, joints: [], palette: PALETTE, parts: PARTS, clips: [],
  preview: '25,90,155', previewGap: 400,
  withAt: [0, TZ + 1.8],
  previewZoom: 1.7,
};
