// Battering ram: a human siege engine — an oak penthouse on four solid wheels, 3.6 m long, 2.0 m wide
// over the wheels, 3.6 m to the top of the pennant. Team-coloured hide on the roof and the sides with
// a gold cross, a ridge beam, an iron-capped oak log 3.2 m long hung on two pairs of hangers under
// the ridge. Faces +Z (the glTF front, where the log hits), +X is its left. No crew: it is a machine.
// Skeleton and clips come from ram-kit.mjs: idle, run, attack (the log is drawn back and swung into
// the wall at HIT_TIME), death (a wheel breaks off, the frame tips, the roof flies off clockwise seen
// from the front, the front hanger tears away, the log drops its nose to the ground on the rear
// hanger, the pennant lies on the ground).
import { qmul, rotX, rotY, rotZ, DEG } from '../unit-glb.mjs';
import { SIDES, along, beam, spike } from './siege-kit.mjs';
import { makeRam, ramIndex, ramJoints } from './ram-kit.mjs';

const R = 0.40, WX = 0.92, WZ = 1.05;
const PIVOT_Y = 2.40;             // the hangers' axles, just under the ridge beam
const RX = 0.72, PX = 0.72;       // rails and posts
const HANG = [0.65, -0.55];       // z of the two hanger stations
const JOINTS = ramJoints({ R, WX, WZ, pivotY: PIVOT_Y, logY: 1.25, hang: HANG, beam: { x: 0.32, y: 0.70, z: 1.45 }, roofY: 2.20, pole: [0.72, 0.78, -1.62], flagY: 3.25 });
const J = ramIndex(JOINTS);

const PALETTE = [
  { name: 'wood', hex: '#8b5a2b' },
  { name: 'woodDark', hex: '#5e3b1c' },
  { name: 'woodLight', hex: '#b5895a' },
  { name: 'iron', hex: '#4a4f55' },
  { name: 'team', hex: '#2f5da8' },
  { name: 'teamDark', hex: '#22447d' },
  { name: 'trim', hex: '#e2b545' },
];

const WHEELS = ['wheelFL', 'wheelFR', 'wheelHL', 'wheelHR'];
const SLOPE = Math.atan2(0.5, 0.95);

const PARTS = [
  // Chassis: two rails, three cross beams, axles on blocks, solid wheels with iron hubs.
  ...SIDES.map(k => ({ c: [RX * k, 0.70, 0], s: [0.16, 0.22, 3.40], joint: J.body, color: 'wood' })),
  ...[0, -1.45].map(z => ({ c: [0, 0.70, z], s: [1.28, 0.16, 0.14], joint: J.body, color: 'woodDark' })),
  // The front cross beam is two halves joined by an iron collar split in two; the log falls on it in death.
  ...SIDES.flatMap(k => [
    { c: [0.32 * k, 0.70, 1.45], s: [0.64, 0.16, 0.14], joint: k > 0 ? J.beamL : J.beamR, color: 'woodDark' },
    { c: [0.11 * k, 0.70, 1.45], s: [0.22, 0.20, 0.18], joint: k > 0 ? J.beamL : J.beamR, color: 'iron' },
  ]),
  ...[WZ, -WZ].flatMap(z => [
    { c: [0, R, z], s: [1.96, 0.09, 0.09], joint: J.body, color: 'iron' },
    ...SIDES.map(k => ({ c: [RX * k, 0.525, z], s: [0.14, 0.105, 0.14], joint: J.body, color: 'woodDark' })),
  ]),
  ...WHEELS.flatMap(name => [
    along(JOINTS[J[name]].at, 0.16, [R, R], 8, J[name], 'woodDark'),
    along(JOINTS[J[name]].at, 0.22, [0.10, 0.10], 6, J[name], 'iron'),
  ]),
  // Posts, top plates, the ridge beam the log hangs from.
  ...SIDES.flatMap(kx => SIDES.map(kz => ({ c: [PX * kx, 1.50, 1.15 * kz], s: [0.14, 1.40, 0.14], joint: J.body, color: 'wood' }))),
  ...SIDES.map(k => ({ c: [PX * k, 2.25, 0], s: [0.16, 0.12, 2.70], joint: J.body, color: 'woodDark' })),
  { c: [0, 2.55, 0], s: [0.14, 0.14, 2.80], joint: J.body, color: 'woodDark' },
  ...[1.15, -1.15].map(z => ({ c: [0, 2.40, z], s: [0.10, 0.50, 0.10], joint: J.body, color: 'wood' })),
  // Sides: planks below, team-coloured hide hanging from the roof with a gold cross; the log shows between.
  ...SIDES.flatMap(k => [
    { c: [0.78 * k, 0.90, 0], s: [0.04, 0.24, 2.30], joint: J.body, color: 'wood' },
    { c: [0.78 * k, 1.95, 0], s: [0.04, 0.50, 2.30], joint: J.body, color: 'team' },
    { c: [0.802 * k, 1.95, 0], s: [0.012, 0.36, 0.09], joint: J.body, color: 'trim' },
    { c: [0.802 * k, 1.99, 0], s: [0.012, 0.09, 0.30], joint: J.body, color: 'trim' },
  ]),
  // Roof: two hide slopes with dark battens, a gold stripe on the ridge.
  ...SIDES.flatMap(k => [
    { c: [0.475 * k, 2.45, 0], s: [1.07, 0.07, 2.70], joint: J.roof, color: 'team', q: rotZ(-SLOPE * k) },
    { c: [0.05 * k + 0.8 * k, 2.30, 0], s: [0.10, 0.05, 2.74], joint: J.roof, color: 'teamDark', q: rotZ(-SLOPE * k) },
  ]),
  { c: [0, 2.715, 0], s: [0.16, 0.06, 2.76], joint: J.roof, color: 'trim' },
  // The log: oak trunk, iron bands at the hangers, an iron cap and a pointed head; hangers and a bar on top.
  { c: [0, 1.25, 0.15], h: 3.20, r: [0.19, 0.19], n: 8, q: rotX(90 * DEG), joint: J.log, color: 'wood' },
  ...HANG.map(z => ({ c: [0, 1.25, z], h: 0.12, r: [0.215, 0.215], n: 8, q: rotX(90 * DEG), joint: J.log, color: 'iron' })),
  { c: [0, 1.25, 1.80], h: 0.16, r: [0.22, 0.22], n: 8, q: rotX(90 * DEG), joint: J.log, color: 'iron' },
  spike([0, 1.25, 1.88], [0, 0, 1], 0.34, 0.19, J.log, 'iron'),
  ...HANG.flatMap((z, i) => [
    ...SIDES.map(k => ({ c: [0.17 * k, 1.90, z], s: [0.05, 1.00, 0.05], joint: i ? J.hangR : J.hangF, color: 'iron' })),
  ]),
  // Each hanger pair turns on an iron axle held under the ridge beam by a stem between the two hangers.
  ...HANG.flatMap(z => [
    { c: [0, PIVOT_Y, z], s: [0.50, 0.05, 0.05], joint: J.body, color: 'iron', hinge: true },
    { c: [0, PIVOT_Y + 0.05, z], s: [0.10, 0.10, 0.10], joint: J.body, color: 'iron' },
  ]),
  // Pennant on a pole at the rear-left corner.
  { c: [0.72, 2.14, -1.62], s: [0.05, 2.72, 0.05], joint: J.pole, color: 'woodDark' },
  { c: [0.72, 3.51, -1.62], s: [0.08, 0.05, 0.08], joint: J.pole, color: 'trim' },
  { c: [0.72, 3.30, -1.93], s: [0.015, 0.30, 0.56], joint: J.flag, color: 'team' },
  { c: [0.72, 3.30, -1.93], s: [0.025, 0.06, 0.56], joint: J.flag, color: 'trim' },
];

const ram = makeRam({
  name: 'battering-ram', joints: JOINTS, palette: PALETTE, parts: PARTS,
  debris: {
    wheel: { at: [-0.5, 3.0], q: qmul(rotY(25 * DEG), rotZ(90 * DEG)) },
    roof: { at: [2.8, -0.3], q: qmul(rotY(-15 * DEG), rotZ(-98 * DEG)) },
    beamL: { at: [1.45, 1.9], q: rotY(25 * DEG) },
    beamR: { at: [-1.45, 2.1], q: rotY(-20 * DEG) },
    pole: { at: [1.5, -3.2], q: qmul(rotY(-10 * DEG), rotZ(90 * DEG)) },
  },
  beam: { top: 0.80, z: 1.45, halfZ: 0.09 },
  extras: {
    preview: 'idle@0.6,attack@0.8,attack@1.5,run@0.4,death@2.4',
    previewGap: 150, previewZoom: 1.3, previewHeading: 70,
  },
});

export const { lowest, DEBRIS_JOINTS, HIT_TIME } = ram;
export default ram.unit;
