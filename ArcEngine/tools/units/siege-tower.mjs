// Siege tower: a human siege engine for a strategy game — a wooden tower on four solid wheels,
// 2.4 m long, 2.3 m wide (over the wheels), 4.4 m to the top of the drawbridge, 5.4 m to the pennant.
// Oak chassis, two planked storeys under team-coloured hide panels with a gold cross, a fighting deck
// with a crenellated parapet (the "crown"), a rear ladder, a drawbridge raised against the front
// (a team-coloured shield with a gold cross) and a pennant. Faces +Z (the glTF front, where the
// drawbridge falls), +X is its left. No crew: it is a machine.
// Clips: "idle" (the tower creaks, the pennant waves), "run" (rolls forward, the wheels make one turn
// per cycle, the tower rocks on the bumps) — looped; "death" (a wheel breaks off, the chassis drops
// onto that corner, the crown, the drawbridge, a hide panel and the pennant fall off, the debris lies
// on the ground) — once. No "attack": the tower does not shoot (`noAttack: true` tells the tests).
// Bind pose: the drawbridge raised, everything attached.
import { DEG, loopClip, norm, onceClip, qmul, rotX, rotY, rotZ } from '../unit-glb.mjs';
import { I, SIDES, along, beam, clamp01, machine, smooth } from './siege-kit.mjs';

const R = 0.45;                    // wheel radius = axle height
const WX = 1.08, WZ = 0.88;        // wheel centres: x, |z|
const POST = [0.88, 1.0];          // the corner posts: x, |z|
const DECK = 3.1;                  // the fighting deck height
const BRIDGE = [0, 3.17, 1.07];    // the drawbridge hinge: its bottom edge

const JOINTS = [
  { name: 'body', at: [0, R, 0], parent: -1 },
  { name: 'wheelFL', at: [WX, R, WZ], parent: 0 },
  { name: 'wheelFR', at: [-WX, R, WZ], parent: 0 },
  { name: 'wheelHL', at: [WX, R, -WZ], parent: 0 },
  { name: 'wheelHR', at: [-WX, R, -WZ], parent: 0 },
  { name: 'crown', at: [0, DECK, 0], parent: 0 },          // the parapet with its merlons and post tops
  { name: 'bridge', at: BRIDGE, parent: 0 },               // hinged at its bottom edge
  { name: 'hide', at: [0.89, 2.55, 0], parent: 0 },        // the left upper hide panel
  { name: 'pole', at: [0.70, 3.14, -0.85], parent: 0 },
  { name: 'flag', at: [0.70, 5.05, -0.85], parent: 8 },
];
const J = Object.fromEntries(JOINTS.map((j, i) => [j.name, i]));

// "team" and "teamDark" are the faction colours, the same texels as on the infantry.
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

// A gold cross decal on a vertical face: `axis` 0 — the face looks along X, 2 — along Z; `d` is the
// decal's centre (the face plus half of its thickness, negative on the -X side).
const cross = (axis, d, c, joint) => {
  const at = (u, v) => (axis === 0 ? [d, v, c[0] + u] : [c[0] + u, v, d]);
  const size = (w, h) => (axis === 0 ? [0.012, h, w] : [w, h, 0.012]);
  return [
    { c: at(0, c[1]), s: size(0.10, 0.80), joint, color: 'trim' },
    { c: at(0, c[1] + 0.06), s: size(0.46, 0.10), joint, color: 'trim' },
  ];
};

const PARTS = [
  // Chassis: two rails, three cross beams; axles on blocks under the rails; solid wheels with iron hubs.
  ...SIDES.map(k => ({ c: [0.82 * k, 0.72, 0], s: [0.16, 0.24, 2.6], joint: J.body, color: 'wood' })),
  ...[1.20, 0, -1.20].map(z => ({ c: [0, 0.72, z], s: [1.50, 0.18, 0.14], joint: J.body, color: 'woodDark' })),
  ...[WZ, -WZ].flatMap(z => [
    { c: [0, R, z], s: [2.20, 0.09, 0.09], joint: J.body, color: 'iron' },
    ...SIDES.map(k => ({ c: [0.82 * k, 0.5475, z], s: [0.14, 0.105, 0.14], joint: J.body, color: 'woodDark' })),
  ]),
  ...WHEELS.flatMap(name => [
    along(JOINTS[J[name]].at, 0.16, [R, R], 8, J[name], 'woodDark'),
    along(JOINTS[J[name]].at, 0.22, [0.10, 0.10], 6, J[name], 'iron'),
  ]),
  // Corner posts up to the deck.
  ...SIDES.flatMap(kx => SIDES.map(kz => ({ c: [POST[0] * kx, 1.97, POST[1] * kz], s: [0.16, 2.26, 0.16], joint: J.body, color: 'wood' }))),
  // Walls between the posts: planks below, a team-coloured hide above; diagonal braces on the sides.
  { c: [-0.88, 1.45, 0], s: [0.08, 1.10, 1.84], joint: J.body, color: 'wood' },
  { c: [0.88, 1.45, 0], s: [0.08, 1.10, 1.84], joint: J.body, color: 'wood' },
  { c: [-0.89, 2.55, 0], s: [0.07, 1.10, 1.84], joint: J.body, color: 'team' },
  { c: [0.89, 2.55, 0], s: [0.07, 1.10, 1.84], joint: J.hide, color: 'team' },
  { c: [0, 1.45, -1.0], s: [1.60, 1.10, 0.08], joint: J.body, color: 'wood' },
  { c: [0, 2.55, -1.0], s: [1.60, 1.10, 0.07], joint: J.body, color: 'team' },
  { c: [0, 1.45, 1.0], s: [1.60, 1.10, 0.08], joint: J.body, color: 'wood' },
  { c: [0, 2.55, 1.0], s: [1.60, 1.10, 0.07], joint: J.body, color: 'team' },
  ...SIDES.flatMap(k => [
    beam([0.95 * k, 0.95, -0.85], [0.95 * k, 1.95, 0.85], 0.07, J.body, 'woodDark'),
    beam([0.95 * k, 0.95, 0.85], [0.95 * k, 1.95, -0.85], 0.07, J.body, 'woodDark'),
  ]),
  // Gold crosses: both sides, the front.
  ...cross(0, 0.931, [0, 2.55], J.hide),
  ...cross(0, -0.931, [0, 2.55], J.body),
  ...cross(2, 1.041, [0, 2.55], J.body),
  // Ring beams at the foot of the hide and under the deck; the deck itself.
  ...[2.0, DECK].flatMap(y => [
    ...SIDES.map(k => ({ c: [0.88 * k, y, 0], s: [0.20, 0.12, 2.20], joint: J.body, color: 'woodDark' })),
    ...SIDES.map(k => ({ c: [0, y, 1.0 * k], s: [1.76, 0.12, 0.20], joint: J.body, color: 'woodDark' })),
  ]),
  { c: [0, DECK, 0], s: [1.76, 0.08, 2.0], joint: J.body, color: 'woodLight' },
  // Ladder up the back.
  ...SIDES.map(k => ({ c: [0.30 * k, 2.0, -1.12], s: [0.07, 2.30, 0.06], joint: J.body, color: 'woodLight' })),
  ...[1.25, 1.75, 2.25, 2.75].map(y => ({ c: [0, y, -1.12], s: [0.67, 0.05, 0.06], joint: J.body, color: 'woodLight' })),
  // Crown: tops of the posts, side and back parapets with merlons, two stubs beside the drawbridge.
  ...SIDES.flatMap(kx => SIDES.map(kz => ({ c: [POST[0] * kx, 3.605, POST[1] * kz], s: [0.16, 0.89, 0.16], joint: J.crown, color: 'wood' }))),
  ...SIDES.flatMap(k => [
    { c: [0.88 * k, 3.41, 0], s: [0.10, 0.50, 1.84], joint: J.crown, color: 'team' },
    ...[-0.7, 0, 0.7].map(z => ({ c: [0.88 * k, 3.86, z], s: [0.12, 0.40, 0.40], joint: J.crown, color: 'woodDark' })),
    { c: [0.70 * k, 3.41, 1.0], s: [0.20, 0.50, 0.10], joint: J.crown, color: 'team' },
    { c: [0.42 * k, 3.86, -1.0], s: [0.50, 0.40, 0.12], joint: J.crown, color: 'woodDark' },
  ]),
  { c: [0, 3.41, -1.0], s: [1.60, 0.50, 0.10], joint: J.crown, color: 'team' },
  // Drawbridge raised against the front: a shield with a gold cross and dark side strips.
  { c: [0, 3.77, 1.07], s: [1.20, 1.20, 0.07], joint: J.bridge, color: 'team' },
  ...SIDES.map(k => ({ c: [0.565 * k, 3.77, 1.07], s: [0.07, 1.20, 0.10], joint: J.bridge, color: 'teamDark' })),
  ...cross(2, 1.111, [0, 3.72], J.bridge),
  // Pennant on a pole in the rear-left corner of the deck.
  { c: [0.70, 4.22, -0.85], s: [0.05, 2.16, 0.05], joint: J.pole, color: 'woodDark' },
  { c: [0.70, 5.33, -0.85], s: [0.08, 0.06, 0.08], joint: J.pole, color: 'trim' },
  { c: [0.70, 5.10, -1.175], s: [0.015, 0.34, 0.60], joint: J.flag, color: 'team' },
  { c: [0.70, 5.10, -1.175], s: [0.025, 0.07, 0.60], joint: J.flag, color: 'trim' },
];

const M = machine({ name: 'siege-tower', joints: JOINTS, palette: PALETTE, parts: PARTS });
const { bindT, ground } = M;
const ALL = JOINTS.map((_, i) => i);

// Lowest point of the parts on the given joints (all by default) under a pose.
export const lowest = (pose, joints = ALL) => M.lowest(pose, joints);

// Idle: the tower creaks, the crown flexes a little, the drawbridge hangs on its ropes, the pennant waves.
const idle = t => ground({
  'body.rotation': rotZ(0.12 * Math.sin(t) * DEG),
  'crown.rotation': qmul(rotZ(0.5 * Math.sin(t) * DEG), rotX(0.3 * Math.sin(2 * t + 1) * DEG)),
  'bridge.rotation': rotX(0.7 * Math.sin(2 * t + 0.7) * DEG),
  'flag.rotation': rotY((14 * Math.sin(t) + 5 * Math.sin(3 * t + 1)) * DEG),
}, ALL);

// Run: one wheel turn per cycle (2πR = 2.83 m in 2 s = 1.41 m/s). The octagonal wheels roll on their
// corners, so the frame bumps 8 times per turn (ground()); the tower rocks, the crown lags behind.
const run = (t) => {
  const wheel = rotX(t);
  return ground({
    'body.rotation': qmul(rotZ(0.6 * Math.sin(2 * t) * DEG), rotX(0.35 * Math.sin(4 * t) * DEG)),
    ...Object.fromEntries(WHEELS.map(w => [w + '.rotation', wheel])),
    'crown.rotation': qmul(rotZ(1.2 * Math.sin(2 * t - 0.6) * DEG), rotX(0.8 * Math.sin(4 * t + 0.5) * DEG)),
    'bridge.rotation': rotX(1.0 * Math.sin(4 * t + 1) * DEG),
    'flag.rotation': rotY((10 * Math.sin(4 * t) + 4 * Math.sin(6 * t + 1)) * DEG),
  }, ALL);
};

// Death. The front-right wheel breaks off and the chassis tips about the diagonal between the
// rear-right and front-left wheels until its bare corner touches the ground.
const DIAG = norm([2 * WX, 0, 2 * WZ]);
const tilt = a => [DIAG[0] * Math.sin(a / 2), 0, DIAG[2] * Math.sin(a / 2), Math.cos(a / 2)];
const BASE = [J.body, J.wheelFL, J.wheelHL, J.wheelHR];
const TILT = M.tiltAngle(DIAG, [J.body], BASE.slice(1));
const WHEEL_OFF = 0.06;

// Everything still attached: the frame jolts and tips (0.08–0.30), the crown shakes before it goes.
function attached(u) {
  const jolt = u < 0.10 ? 3 * Math.sin(Math.PI * u / 0.10) : 0;
  const k = clamp01((u - 0.08) / 0.22);
  const tipped = u < 0.30 ? TILT * k * k : u < 0.40 ? TILT * (1 - 0.15 * Math.sin(Math.PI * (u - 0.30) / 0.10)) : TILT;
  const shake = u < 0.20 ? 2.2 * Math.sin(2 * Math.PI * 1.5 * u / 0.20) * smooth(u / 0.20) : 0;
  const pose = {
    'body.rotation': qmul(tilt(tipped), rotZ(jolt * DEG)),
    'flag.rotation': I,
  };
  for (const name of ['wheelFR', 'crown', 'bridge', 'hide', 'pole']) {
    pose[name + '.rotation'] = name === 'crown' ? rotZ(shake * DEG) : I;
    pose[name + '.translation'] = bindT(name);
  }
  return ground(pose, u < WHEEL_OFF ? [...BASE, J.wheelFR] : BASE);
}

// Loose pieces (siege-kit debris): x, z and the world rotation of their rest on the ground.
const DEBRIS = M.debris([
  { name: 'wheelFR', from: WHEEL_OFF, to: 0.36, at: [-2.7, 2.2], q: qmul(rotY(25 * DEG), rotZ(90 * DEG)), arc: 0.25 },
  { name: 'bridge', from: 0.14, to: 0.44, at: [-0.2, 2.4], q: qmul(rotY(-8 * DEG), qmul(rotX(90 * DEG), rotY(180 * DEG))), arc: 0.3 },
  { name: 'crown', from: 0.20, to: 0.54, at: [-2.6, -0.4], q: qmul(rotY(30 * DEG), rotZ(165 * DEG)), arc: 0.9 },
  { name: 'hide', from: 0.26, to: 0.50, at: [2.7, -0.3], q: qmul(rotY(15 * DEG), rotZ(90 * DEG)), arc: 0.5 },
  { name: 'pole', from: 0.30, to: 0.60, at: [1.3, -2.9], q: qmul(rotY(-10 * DEG), rotZ(90 * DEG)), arc: 0.3 },
], attached);

export const deathPose = u => DEBRIS.apply(attached(u), u);

const CLIPS = [
  loopClip('idle', 2.4, 24, idle),
  loopClip('run', 2.0, 40, run),
  onceClip('death', 2.6, 52, deathPose),
];

export const DEBRIS_JOINTS = DEBRIS.list.map(d => d.name);

export default {
  name: 'siege-tower', joints: JOINTS, palette: PALETTE, parts: PARTS, clips: CLIPS,
  noAttack: true, maxTriangles: 1200,
  preview: 'idle@0.6,run@0.4,death@2.6',
  previewGap: 150,
  previewZoom: 1.5,
  previewHeading: 130,
};
