// Orc battering ram: a siege engine of the orcs — a squat penthouse of dark rough-hewn timber on four
// thick log wheels, 3.8 m long, 2.3 m wide over the wheels, 3.9 m to the skull on the banner pole.
// Team-coloured hide on the roof and the sides with red war paint and bone skulls, a ridge of bone
// spikes, a spiked front. The log is a whole trunk 3.6 m long, iron-banded, hung on ropes, with a
// tusked skull for a head. Faces +Z (the glTF front, where the log hits), +X is its left. No crew.
// Skeleton and clips come from ram-kit.mjs (like the human battering-ram.mjs): idle, run, attack (the
// log is drawn back and swung into the wall at HIT_TIME), death.
import { DEG, qmul, rotX, rotY, rotZ } from '../unit-glb.mjs';
import { SIDES, along, spike } from './siege-kit.mjs';
import { makeRam, ramIndex, ramJoints } from './ram-kit.mjs';

const R = 0.46, WX = 1.04, WZ = 1.15;
const RX = 0.82;                  // rails and posts
const HANG = [0.70, -0.60];       // z of the two hanger stations
const PIVOT_Y = 2.55, LOG_Y = 1.30;
const JOINTS = ramJoints({ R, WX, WZ, pivotY: PIVOT_Y, logY: LOG_Y, hang: HANG, roofY: 2.40, pole: [0.82, 0.80, -1.85], flagY: 3.50 });
const J = ramIndex(JOINTS);

// The orc wood, bone and iron of orc-ballista.mjs; "team" and "teamDark" as everywhere.
const PALETTE = [
  { name: 'wood', hex: '#5a3c26' },
  { name: 'woodDark', hex: '#3f2a1a' },
  { name: 'woodLight', hex: '#77532f' },
  { name: 'char', hex: '#26201c' },
  { name: 'bone', hex: '#d8cfb3' },
  { name: 'iron', hex: '#4a4d52' },
  { name: 'red', hex: '#8a2a20' },
  { name: 'rope', hex: '#a8946a' },
  { name: 'team', hex: '#2f5da8' },
  { name: 'teamDark', hex: '#22447d' },
];

const WHEELS = ['wheelFL', 'wheelFR', 'wheelHL', 'wheelHR'];
const SLOPE = Math.atan2(0.55, 1.08);
const HEAD_Z = 2.20;              // the skull's centre on the log

const PARTS = [
  // Chassis: two rails, three cross beams, axles on blocks, thick log wheels on square iron hubs.
  ...SIDES.map(k => ({ c: [RX * k, 0.74, 0], s: [0.18, 0.26, 3.80], joint: J.body, color: 'wood' })),
  ...[1.60, 0, -1.60].map(z => ({ c: [0, 0.74, z], s: [1.46, 0.18, 0.16], joint: J.body, color: 'woodDark' })),
  ...[WZ, -WZ].flatMap(z => [
    { c: [0, R, z], s: [2.16, 0.10, 0.10], joint: J.body, color: 'iron' },
    ...SIDES.map(k => ({ c: [RX * k, 0.585, z], s: [0.16, 0.11, 0.16], joint: J.body, color: 'woodDark' })),
  ]),
  ...WHEELS.flatMap(name => [
    along(JOINTS[J[name]].at, 0.22, [R, R], 8, J[name], 'woodDark'),
    along(JOINTS[J[name]].at, 0.28, [0.12, 0.12], 4, J[name], 'iron'),
  ]),
  ...SIDES.map(k => spike([0.82 * k, 0.80, 1.90], [0, 0.1, 1], 0.40, 0.07, J.body, 'char')),
  // Posts, top plates, tie beams and stubs up to the ridge beam the log hangs from.
  ...SIDES.flatMap(kx => SIDES.map(kz => ({ c: [RX * kx, 1.55, 1.25 * kz], s: [0.18, 1.46, 0.18], joint: J.body, color: 'wood' }))),
  ...SIDES.map(k => ({ c: [RX * k, 2.35, 0], s: [0.20, 0.12, 2.90], joint: J.body, color: 'woodDark' })),
  ...[1.25, -1.25].flatMap(z => [
    { c: [0, 2.35, z], s: [1.64, 0.12, 0.14], joint: J.body, color: 'woodDark' },
    { c: [0, 2.55, z], s: [0.12, 0.28, 0.12], joint: J.body, color: 'wood' },
  ]),
  { c: [0, 2.72, 0], s: [0.14, 0.14, 3.00], joint: J.body, color: 'woodDark' },
  // Sides: dark planks below, team-coloured hide hanging from the roof with a red stripe and a bone skull.
  ...SIDES.flatMap(k => [
    { c: [0.89 * k, 0.94, 0], s: [0.05, 0.26, 2.50], joint: J.body, color: 'woodDark' },
    { c: [0.89 * k, 2.07, 0], s: [0.05, 0.52, 2.50], joint: J.body, color: 'team' },
    { c: [0.917 * k, 1.89, 0], s: [0.012, 0.08, 2.20], joint: J.body, color: 'red' },
    { c: [0.917 * k, 2.12, 0], s: [0.012, 0.24, 0.28], joint: J.body, color: 'bone' },
    ...SIDES.map(m => ({ c: [0.924 * k, 2.15, 0.07 * m], s: [0.012, 0.06, 0.06], joint: J.body, color: 'char' })),
  ]),
  // Roof: two hide slopes with a red stripe at the eaves, a dark ridge with a row of bone spikes.
  ...SIDES.flatMap(k => [
    { c: [0.54 * k, 2.675, 0], s: [1.21, 0.08, 3.00], joint: J.roof, color: 'team', q: rotZ(-SLOPE * k) },
    { c: [0.98 * k, 2.455, 0], s: [0.14, 0.05, 3.04], joint: J.roof, color: 'red', q: rotZ(-SLOPE * k) },
  ]),
  { c: [0, 2.97, 0], s: [0.20, 0.08, 3.10], joint: J.roof, color: 'woodDark' },
  ...[-1.2, -0.6, 0, 0.6, 1.2].map(z => spike([0, 3.01, z], [0, 1, 0], 0.42, 0.08, J.roof, 'bone')),
  // The log: a trunk with iron bands at the hangers and a red band at the rear, an iron collar and a
  // tusked skull for a head with horns and a spiked nose.
  { c: [0, LOG_Y, 0.20], h: 3.60, r: [0.23, 0.23], n: 8, q: rotX(90 * DEG), joint: J.log, color: 'wood' },
  ...HANG.map(z => ({ c: [0, LOG_Y, z], h: 0.14, r: [0.255, 0.255], n: 8, q: rotX(90 * DEG), joint: J.log, color: 'iron' })),
  { c: [0, LOG_Y, -1.40], h: 0.12, r: [0.245, 0.245], n: 8, q: rotX(90 * DEG), joint: J.log, color: 'red' },
  { c: [0, LOG_Y, 2.02], h: 0.20, r: [0.265, 0.265], n: 8, q: rotX(90 * DEG), joint: J.log, color: 'iron' },
  { c: [0, LOG_Y, HEAD_Z + 0.04], s: [0.52, 0.44, 0.40], joint: J.log, color: 'bone' },
  { c: [0, LOG_Y - 0.27, HEAD_Z + 0.04], s: [0.36, 0.10, 0.32], joint: J.log, color: 'bone' },
  ...SIDES.flatMap(k => [
    { c: [0.14 * k, LOG_Y + 0.06, HEAD_Z + 0.246], s: [0.10, 0.10, 0.012], joint: J.log, color: 'char' },
    { c: [0.14 * k, LOG_Y - 0.36, HEAD_Z + 0.16], s: [0.05, 0.16, 0.05], joint: J.log, color: 'bone' },
    spike([0.22 * k, LOG_Y + 0.20, HEAD_Z], [0.7 * k, 1, 0.2], 0.42, 0.07, J.log, 'bone'),
  ]),
  spike([0, LOG_Y - 0.02, HEAD_Z + 0.24], [0, 0, 1], 0.34, 0.10, J.log, 'char'),
  ...HANG.flatMap((z, i) => [
    ...SIDES.map(k => ({ c: [0.19 * k, 1.925, z], s: [0.05, 1.25, 0.05], joint: i ? J.hangR : J.hangF, color: 'rope' })),
    { c: [0, PIVOT_Y, z], s: [0.44, 0.06, 0.08], joint: i ? J.hangR : J.hangF, color: 'iron' },
  ]),
  // Banner on a skull pole at the rear-left corner: a bone bar with hide strips.
  { c: [0.82, 2.30, -1.85], s: [0.07, 3.00, 0.07], joint: J.pole, color: 'woodDark' },
  { c: [0.82, 3.88, -1.85], s: [0.16, 0.15, 0.16], joint: J.pole, color: 'bone' },
  { c: [0.82, 3.55, -2.20], s: [0.06, 0.06, 0.70], joint: J.flag, color: 'bone' },
  ...[[-0.15, 0.62, 'team'], [-0.38, 0.78, 'teamDark'], [-0.61, 0.52, 'team']].map(([dz, len, color]) =>
    ({ c: [0.82, 3.52 - len / 2, -1.85 + dz - 0.06], s: [0.03, len, 0.19], joint: J.flag, color })),
  { c: [0.841, 3.20, -2.34], s: [0.012, 0.13, 0.13], joint: J.flag, color: 'red' },
];

const ram = makeRam({
  name: 'orc-battering-ram', joints: JOINTS, palette: PALETTE, parts: PARTS,
  debris: {
    wheel: { at: [-0.6, 3.5], q: qmul(rotY(25 * DEG), rotZ(90 * DEG)) },
    roof: { at: [3.2, -0.3], q: qmul(rotY(15 * DEG), rotZ(98 * DEG)) },
    log: { at: [-3.1, 0.8], q: rotY(35 * DEG) },
    pole: { at: [1.8, -3.7], q: qmul(rotY(-10 * DEG), rotZ(90 * DEG)) },
  },
  extras: {
    maxTriangles: 1400,
    preview: 'idle@0.6,attack@0.8,attack@1.5,run@0.4,death@2.4',
    previewGap: 150, previewZoom: 1.3, previewHeading: 70,
  },
});

export const { lowest, DEBRIS_JOINTS, HIT_TIME } = ram;
export default ram.unit;
