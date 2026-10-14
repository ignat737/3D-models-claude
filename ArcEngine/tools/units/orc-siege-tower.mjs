// Orc siege tower: a siege engine of the orcs — a squat, heavy tower of dark rough-hewn timber on
// four thick log wheels, hide panels of the team colour with red war paint, a tusked skull on the
// front, a spiked bumper, a fighting deck fenced by a hide parapet with sharpened stakes (the
// "crown"), a rear ladder, a drawbridge raised against the front (a hide shield with a skull, planked
// on the back) and a banner of hide strips on a skull pole. Faces +Z (the glTF front, where the
// drawbridge falls), +X is its left. No crew: it is a machine.
// Clips: "idle" (the tower creaks, the banner waves), "run" (rolls forward, the wheels make one turn
// per cycle, the tower rocks on the bumps), "attack" (the drawbridge drops onto the wall, bounces,
// lies flat, and is winched up again) — looped; "death" (a wheel breaks off, the chassis drops onto
// that corner, the crown, the drawbridge, a hide panel and the banner fall off, the debris lies on
// the ground) — once.
// Bind pose: the drawbridge raised, everything attached.
import { DEG, loopClip, norm, onceClip, qmul, rotX, rotY, rotZ } from '../unit-glb.mjs';
import { I, SIDES, along, beam, clamp01, machine, smooth, spike } from './siege-kit.mjs';

const R = 0.48;                    // wheel radius = axle height
const WX = 1.16, WZ = 0.92;        // wheel centres: x, |z|
const XW = 0.95, ZW = 1.0;         // the wall planes: the corner posts stand at (±XW, ±ZW)
const DECK = 3.0;                  // the fighting deck height
const BRIDGE = [0, DECK + 0.12, 1.13];   // the drawbridge hinge: its bottom edge

const JOINTS = [
  { name: 'body', at: [0, R, 0], parent: -1 },
  { name: 'wheelFL', at: [WX, R, WZ], parent: 0 },
  { name: 'wheelFR', at: [-WX, R, WZ], parent: 0 },
  { name: 'wheelHL', at: [WX, R, -WZ], parent: 0 },
  { name: 'wheelHR', at: [-WX, R, -WZ], parent: 0 },
  { name: 'crown', at: [0, DECK, 0], parent: 0 },          // the parapet with its stakes and post tops
  { name: 'bridge', at: BRIDGE, parent: 0 },               // hinged at its bottom edge
  { name: 'hide', at: [XW + 0.01, 2.48, 0], parent: 0 },   // the left upper hide panel
  { name: 'pole', at: [-0.70, DECK + 0.04, -0.85], parent: 0 },
  { name: 'flag', at: [-0.70, 4.85, -0.85], parent: 8 },
];
const J = Object.fromEntries(JOINTS.map((j, i) => [j.name, i]));

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

// A tusked skull looking along +Z: cranium, jaw, eye sockets, two tusks. `front` is the z of the
// surface it sits on, `s` its scale.
const skull = (x, y, front, s, joint) => {
  const z = front + 0.07 * s;
  return [
    { c: [x, y, z], s: [0.30 * s, 0.26 * s, 0.14 * s], joint, color: 'bone' },
    { c: [x, y - 0.165 * s, z - 0.01 * s], s: [0.20 * s, 0.08 * s, 0.11 * s], joint, color: 'bone' },
    ...SIDES.map(k => ({ c: [x + 0.075 * k * s, y + 0.02 * s, z + 0.07 * s + 0.006], s: [0.07 * s, 0.07 * s, 0.012], joint, color: 'char' })),
    ...SIDES.map(k => ({ c: [x + 0.095 * k * s, y - 0.2 * s, z + 0.02 * s], s: [0.035 * s, 0.13 * s, 0.035 * s], joint, color: 'bone' })),
  ];
};

const PARTS = [
  // Chassis: two rails, three cross beams; axles on blocks under the rails; thick log wheels on
  // square iron hubs.
  ...SIDES.map(k => ({ c: [0.85 * k, 0.72, 0], s: [0.16, 0.24, 2.60], joint: J.body, color: 'wood' })),
  ...[1.20, 0, -1.20].map(z => ({ c: [0, 0.72, z], s: [1.56, 0.18, 0.14], joint: J.body, color: 'woodDark' })),
  ...[WZ, -WZ].flatMap(z => [
    { c: [0, R, z], s: [2.30, 0.09, 0.09], joint: J.body, color: 'iron' },
    ...SIDES.map(k => ({ c: [0.85 * k, 0.5625, z], s: [0.14, 0.105, 0.14], joint: J.body, color: 'woodDark' })),
  ]),
  ...WHEELS.flatMap(name => [
    along(JOINTS[J[name]].at, 0.20, [R, R], 8, J[name], 'woodDark'),
    along(JOINTS[J[name]].at, 0.26, [0.11, 0.11], 4, J[name], 'iron'),
  ]),
  // Spiked bumper at the front.
  { c: [0, 0.72, 1.40], s: [1.00, 0.26, 0.20], joint: J.body, color: 'woodDark' },
  ...[0.36, 0, -0.36].map(x => spike([x, 0.72, 1.50], [0, 0.1, 1], 0.38, 0.07, J.body, 'char')),
  // Corner posts up to the deck.
  ...SIDES.flatMap(kx => SIDES.map(kz => ({ c: [XW * kx, 1.92, ZW * kz], s: [0.16, 2.16, 0.16], joint: J.body, color: 'wood' }))),
  // Walls between the posts: dark planks below, team-coloured hide above, red war paint; diagonal braces.
  { c: [-XW, 1.43, 0], s: [0.08, 1.06, 1.84], joint: J.body, color: 'woodDark' },
  { c: [XW, 1.43, 0], s: [0.08, 1.06, 1.84], joint: J.body, color: 'woodDark' },
  { c: [-XW - 0.01, 2.48, 0], s: [0.07, 1.04, 1.84], joint: J.body, color: 'team' },
  { c: [XW + 0.01, 2.48, 0], s: [0.07, 1.04, 1.84], joint: J.hide, color: 'team' },
  { c: [0, 1.43, -ZW], s: [1.70, 1.06, 0.08], joint: J.body, color: 'woodDark' },
  { c: [0, 2.48, -ZW], s: [1.70, 1.04, 0.07], joint: J.body, color: 'team' },
  { c: [0, 1.43, ZW], s: [1.70, 1.06, 0.08], joint: J.body, color: 'woodDark' },
  { c: [0, 2.48, ZW], s: [1.70, 1.04, 0.07], joint: J.body, color: 'team' },
  ...SIDES.flatMap(k => [
    beam([(XW + 0.03) * k, 0.95, -0.85], [(XW + 0.03) * k, 1.95, 0.85], 0.07, J.body, 'wood'),
    beam([(XW + 0.03) * k, 0.95, 0.85], [(XW + 0.03) * k, 1.95, -0.85], 0.07, J.body, 'wood'),
  ]),
  { c: [XW + 0.046, 2.50, 0], s: [0.012, 0.16, 1.60], joint: J.hide, color: 'red' },
  { c: [-XW - 0.046, 2.50, 0], s: [0.012, 0.16, 1.60], joint: J.body, color: 'red' },
  { c: [0, 2.50, -ZW - 0.041], s: [1.10, 0.16, 0.012], joint: J.body, color: 'red' },
  { c: [0, 2.82, ZW + 0.041], s: [1.50, 0.10, 0.012], joint: J.body, color: 'red' },
  ...skull(0, 2.38, ZW + 0.035, 1.25, J.body),
  // Ring beams at the foot of the hide and under the deck; the deck itself.
  ...[1.98, DECK].flatMap(y => [
    ...SIDES.map(k => ({ c: [XW * k, y, 0], s: [0.20, 0.12, 2.20], joint: J.body, color: 'woodDark' })),
    ...SIDES.map(k => ({ c: [0, y, ZW * k], s: [1.90, 0.12, 0.20], joint: J.body, color: 'woodDark' })),
  ]),
  { c: [0, DECK, 0], s: [1.90, 0.08, 2.0], joint: J.body, color: 'woodLight' },
  // Ladder up the back: rope rungs.
  ...SIDES.map(k => ({ c: [0.30 * k, 1.95, -1.14], s: [0.07, 2.20, 0.06], joint: J.body, color: 'wood' })),
  ...[1.25, 1.75, 2.25, 2.75].map(y => ({ c: [0, y, -1.14], s: [0.67, 0.05, 0.06], joint: J.body, color: 'rope' })),
  // Crown: bone-tipped post tops, hide parapets with sharpened stakes, two stubs beside the drawbridge.
  ...SIDES.flatMap(kx => SIDES.flatMap(kz => [
    { c: [XW * kx, 3.46, ZW * kz], s: [0.16, 0.80, 0.16], joint: J.crown, color: 'wood' },
    spike([XW * kx, 3.86, ZW * kz], [0, 1, 0], 0.50, 0.09, J.crown, 'bone'),
  ])),
  ...SIDES.flatMap(k => [
    { c: [XW * k, 3.31, 0], s: [0.10, 0.50, 1.84], joint: J.crown, color: 'team' },
    ...[-0.55, 0, 0.55].map(z => spike([XW * k, 3.56, z], [0, 1, 0], 0.55, 0.07, J.crown, 'woodLight')),
    { c: [0.80 * k, 3.31, ZW], s: [0.20, 0.50, 0.10], joint: J.crown, color: 'team' },
    spike([0.45 * k, 3.56, -ZW], [0, 1, 0], 0.55, 0.07, J.crown, 'woodLight'),
  ]),
  { c: [0, 3.31, -ZW], s: [1.70, 0.50, 0.10], joint: J.crown, color: 'team' },
  // Drawbridge raised against the front: a hide shield with a skull, dark side strips; the back is a deck.
  { c: [0, 3.72, 1.13], s: [1.30, 1.20, 0.08], joint: J.bridge, color: 'team' },
  ...SIDES.map(k => ({ c: [0.64 * k, 3.72, 1.13], s: [0.07, 1.20, 0.11], joint: J.bridge, color: 'teamDark' })),
  ...skull(0, 3.80, 1.17, 1.30, J.bridge),
  { c: [0, 3.72, 1.069], s: [1.12, 1.0, 0.012], joint: J.bridge, color: 'woodLight' },
  ...[3.40, 4.04].map(y => ({ c: [0, y, 1.068], s: [1.12, 0.06, 0.014], joint: J.bridge, color: 'char' })),
  // Banner on a skull pole in the rear-right corner of the deck, a bone bar with hide strips.
  { c: [-0.70, 3.99, -0.85], s: [0.07, 1.90, 0.07], joint: J.pole, color: 'woodDark' },
  { c: [-0.70, 5.02, -0.85], s: [0.16, 0.15, 0.16], joint: J.pole, color: 'bone' },
  { c: [-0.70, 4.82, -1.18], s: [0.06, 0.06, 0.70], joint: J.flag, color: 'bone' },
  ...[[-0.15, 0.62, 'team'], [-0.38, 0.78, 'teamDark'], [-0.61, 0.52, 'team']].map(([dz, len, color]) =>
    ({ c: [-0.70, 4.79 - len / 2, -0.85 + dz - 0.06], s: [0.03, len, 0.19], joint: J.flag, color })),
  { c: [-0.679, 4.50, -1.52], s: [0.012, 0.13, 0.13], joint: J.flag, color: 'red' },
];

const M = machine({ name: 'orc-siege-tower', joints: JOINTS, palette: PALETTE, parts: PARTS });
const { bindT, ground } = M;
const ALL = JOINTS.map((_, i) => i);

// Lowest point of the parts on the given joints (all by default) under a pose.
export const lowest = (pose, joints = ALL) => M.lowest(pose, joints);

// Idle: the tower creaks, the crown flexes a little, the drawbridge swings on its hinge, the banner waves.
const idle = t => ground({
  'body.rotation': rotZ(0.12 * Math.sin(t) * DEG),
  'crown.rotation': qmul(rotZ(0.5 * Math.sin(t) * DEG), rotX(0.3 * Math.sin(2 * t + 1) * DEG)),
  'bridge.rotation': rotX(0.7 * Math.sin(2 * t + 0.7) * DEG),
  'flag.rotation': rotY((14 * Math.sin(t) + 5 * Math.sin(3 * t + 1)) * DEG),
}, ALL);

// Run: one wheel turn per cycle (2πR = 3.02 m in 2 s = 1.51 m/s). The octagonal wheels roll on their
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

// Attack, 3.6 s in 72 keys: the drawbridge is let go (0.08), falls onto the wall (key 22, 1.1 s), bounces
// and settles flat; the tower kicks and the crown shakes at the landing; the bridge lies for a moment,
// then is winched up slowly (0.62–0.92) and the loop starts again from the raised bridge.
const F = 72, DURATION = 3.6, U_HIT = 22 / F;
function bridgeAngle(u) {
  if (u < 0.08) return 0;
  if (u < U_HIT) return 90 * ((u - 0.08) / (U_HIT - 0.08)) ** 2;
  const d = u - U_HIT;
  if (d < 0.06) return 90 - 6 * Math.sin(Math.PI * d / 0.06);
  if (d < 0.10) return 90 - 1.5 * Math.sin(Math.PI * (d - 0.06) / 0.04);
  if (u < 0.62) return 90;
  return 90 * (1 - smooth((u - 0.62) / 0.30));
}
function attack(t) {
  const u = t / (2 * Math.PI), d = u - U_HIT;
  const kick = d >= 0 && d < 0.08 ? Math.sin(Math.PI * d / 0.08) : 0;
  return ground({
    'body.rotation': qmul(rotX(1.2 * kick * DEG), rotZ(0.5 * kick * DEG)),
    'crown.rotation': qmul(rotZ(1.6 * kick * Math.cos(2 * Math.PI * 3 * d) * DEG), rotX(-0.8 * kick * DEG)),
    'bridge.rotation': rotX(bridgeAngle(u) * DEG),
    'flag.rotation': rotY((14 * Math.sin(t) + 5 * Math.sin(3 * t + 1) + 10 * kick) * DEG),
  }, ALL, 0.03 * kick);
}

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
  { name: 'wheelFR', from: WHEEL_OFF, to: 0.36, at: [-2.8, 2.3], q: qmul(rotY(25 * DEG), rotZ(90 * DEG)), arc: 0.25 },
  { name: 'bridge', from: 0.14, to: 0.44, at: [-0.2, 2.5], q: qmul(rotY(-8 * DEG), qmul(rotX(90 * DEG), rotY(180 * DEG))), arc: 0.3 },
  { name: 'crown', from: 0.20, to: 0.54, at: [-2.9, -0.4], q: qmul(rotY(30 * DEG), rotZ(98 * DEG)), arc: 0.9 },
  { name: 'hide', from: 0.26, to: 0.50, at: [2.8, -0.3], q: qmul(rotY(15 * DEG), rotZ(90 * DEG)), arc: 0.5 },
  { name: 'pole', from: 0.30, to: 0.60, at: [1.3, -3.1], q: qmul(rotY(-10 * DEG), rotZ(90 * DEG)), arc: 0.3 },
], attached);

export const deathPose = u => DEBRIS.apply(attached(u), u);

const CLIPS = [
  loopClip('idle', 2.4, 24, idle),
  loopClip('run', 2.0, 40, run),
  loopClip('attack', DURATION, F, attack),
  onceClip('death', 2.6, 52, deathPose),
];

export const DEBRIS_JOINTS = DEBRIS.list.map(d => d.name);
export const LAND_TIME = U_HIT * DURATION;

export default {
  name: 'orc-siege-tower', joints: JOINTS, palette: PALETTE, parts: PARTS, clips: CLIPS,
  maxTriangles: 1600,
  preview: 'idle@0.6,attack@0.9,attack@1.6,run@0.4,death@2.6',
  previewGap: 150,
  previewZoom: 1.5,
  previewHeading: 100,
};
