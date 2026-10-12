// Orc ballista: a siege engine of the orcs — a giant crossbow on a crude four-wheeled cart, 2.3 m
// across the bow, 2.6 m long with the ram spikes, 2.55 m to the skull on the banner pole. Dark
// rough-hewn timber, iron hubs, a spiked ram and a tusked skull on a team-coloured hide
// mantlet at the front, team-coloured hide skirts on the sides, bone horns on the bow tips, a red-
// finned bolt 1.6 m long, a windlass at the rear of the stock, a banner of team-coloured hide strips.
// Faces +Z (the glTF front, where it shoots), +X is its left. No crew: it is a machine.
// The bow turns on a post (`mount`, yaw), its arms (`bowL`, `bowR`) bend back when drawn, the
// string is two spans meeting at the claw (`nock`) that slides along the stock. Bind pose: released.
// Clips: "idle" (drawn and loaded, the bow turns looking for a target), "run" (rolls forward, the
// wheels make one turn per cycle), "attack" (the claw lets go, the arms snap forward, the bolt flies
// flat and fast, the windlass draws the bow again, a new bolt slides onto the stock) — looped;
// "death" (the bow lets go, a front wheel breaks off, the frame drops onto that corner, the bow is
// torn off its post and crashes down with one arm broken, the bolt and the banner fall) — once.
import { DEG, add, loopClip, norm, onceClip, qmul, rotX, rotY, rotZ } from '../unit-glb.mjs';
import { I, SIDES, along, clamp01, machine, ratchet, smooth, spike } from './siege-kit.mjs';

const R = 0.40;                    // wheel radius = axle height
const DRAW = 35;                   // arm angle when drawn (deg, back)
const PULL = 1.40;                 // claw travel when drawn (m, back along the stock)

const JOINTS = [
  { name: 'body', at: [0, R, 0], parent: -1 },
  { name: 'wheelFL', at: [0.72, R, 0.75], parent: 0 },
  { name: 'wheelFR', at: [-0.72, R, 0.75], parent: 0 },
  { name: 'wheelHL', at: [0.72, R, -0.75], parent: 0 },
  { name: 'wheelHR', at: [-0.72, R, -0.75], parent: 0 },
  { name: 'mount', at: [0, 1.10, 0.05], parent: 0 },      // the bow on its post (yaw), torn off in death
  { name: 'bowL', at: [0.06, 1.20, 0.95], parent: 5 },
  { name: 'bowR', at: [-0.06, 1.20, 0.95], parent: 5 },
  { name: 'nock', at: [0, 1.33, 0.95], parent: 5 },       // the claw holding the string, slides along Z
  { name: 'winch', at: [0, 1.33, -0.85], parent: 5 },
  { name: 'bolt', at: [0, 1.33, 0.95], parent: 0 },       // its rear end; on the body: loaded or in flight every frame
  { name: 'pole', at: [-0.50, 0.70, -1.05], parent: 0 },
  { name: 'banner', at: [-0.50, 2.25, -1.05], parent: 11 },
];
const J = Object.fromEntries(JOINTS.map((j, i) => [j.name, i]));

// The orc wood, bone and iron of tools/defense/orc-common.mjs; "team" and "teamDark" as everywhere.
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
const NOCK_AT = JOINTS[J.nock].at;

const PARTS = [
  // Frame: two rails, three cross beams, axles on blocks.
  ...SIDES.map(k => ({ c: [0.50 * k, 0.62, 0], s: [0.16, 0.16, 2.30], joint: J.body, color: 'wood' })),
  ...[1.05, 0.05, -1.05].map(z => ({ c: [0, 0.62, z], s: [1.16, 0.12, 0.14], joint: J.body, color: 'woodDark' })),
  ...[0.75, -0.75].flatMap(z => [
    { c: [0, R, z], s: [1.56, 0.08, 0.08], joint: J.body, color: 'iron' },
    ...SIDES.map(k => ({ c: [0.50 * k, 0.50, z], s: [0.12, 0.12, 0.14], joint: J.body, color: 'woodDark' })),
  ]),
  // Wheels: thick slices of log on square iron hubs.
  ...WHEELS.flatMap(name => [
    along(JOINTS[J[name]].at, 0.12, [R, R], 8, J[name], 'woodDark'),
    along(JOINTS[J[name]].at, 0.18, [0.10, 0.10], 4, J[name], 'iron'),
  ]),
  // Side skirts of team-coloured hide with a red war-paint stripe.
  ...SIDES.flatMap(k => [
    { c: [0.59 * k, 0.60, 0], s: [0.02, 0.24, 0.62], joint: J.body, color: 'team' },
    { c: [0.606 * k, 0.60, 0], s: [0.012, 0.06, 0.50], joint: J.body, color: 'red' },
  ]),
  // Front: a spiked ram, the hide mantlet with a tusked skull.
  { c: [0, 0.60, 1.22], s: [1.10, 0.16, 0.16], joint: J.body, color: 'woodDark' },
  ...[0.38, 0, -0.38].map(x => spike([x, 0.60, 1.30], [0, 0.12, 1], 0.45, 0.06, J.body, 'char')),
  { c: [0, 0.88, 1.20], s: [1.00, 0.40, 0.05], joint: J.body, color: 'team' },
  ...SIDES.map(k => ({ c: [0.42 * k, 0.88, 1.231], s: [0.08, 0.40, 0.012], joint: J.body, color: 'teamDark' })),
  { c: [0, 0.93, 1.29], s: [0.24, 0.22, 0.14], joint: J.body, color: 'bone' },
  { c: [0, 0.79, 1.30], s: [0.17, 0.07, 0.12], joint: J.body, color: 'bone' },
  ...SIDES.map(k => ({ c: [0.06 * k, 0.95, 1.366], s: [0.06, 0.06, 0.012], joint: J.body, color: 'char' })),
  ...SIDES.map(k => ({ c: [0.075 * k, 0.76, 1.345], s: [0.035, 0.13, 0.035], joint: J.body, color: 'bone' })),
  // Post with an iron turntable; the bow turns on it.
  { c: [0, 0.89, 0.05], h: 0.38, r: [0.11, 0.09], n: 6, joint: J.body, color: 'woodDark' },
  { c: [0, 1.09, 0.05], h: 0.02, r: [0.17, 0.17], n: 6, joint: J.body, color: 'iron' },
  // Stock with the iron bracket of the arms, the claw and the windlass at the rear.
  { c: [0, 1.18, 0.05], s: [0.16, 0.14, 2.00], joint: J.mount, color: 'wood' },
  { c: [0, 1.16, 1.00], s: [0.28, 0.14, 0.14], joint: J.mount, color: 'iron' },
  { c: [0, 1.30, 0.89], s: [0.14, 0.10, 0.10], joint: J.nock, color: 'iron' },
  ...SIDES.map(k => ({ c: [0.12 * k, 1.30, -0.85], s: [0.04, 0.14, 0.10], joint: J.mount, color: 'woodDark' })),
  along([0, 1.33, -0.85], 0.40, [0.07, 0.07], 6, J.winch, 'woodDark'),
  ...SIDES.flatMap(k => [
    { c: [0.22 * k, 1.33, -0.85], s: [0.03, 0.30, 0.04], joint: J.winch, color: 'woodLight' },
    { c: [0.22 * k, 1.33, -0.85], s: [0.03, 0.04, 0.30], joint: J.winch, color: 'woodLight' },
  ]),
  // Bow arms: tapering logs with an iron band, bone horns on the tips; the string is two spans.
  ...SIDES.flatMap((k) => {
    const joint = k > 0 ? J.bowL : J.bowR;
    return [
      along([0.595 * k, 1.20, 0.95], 1.07, k > 0 ? [0.045, 0.075] : [0.075, 0.045], 6, joint, 'wood'),
      { c: [0.45 * k, 1.20, 0.95], s: [0.07, 0.17, 0.17], joint, color: 'iron' },
      spike([1.11 * k, 1.20, 0.95], [k, 0.3, 0.8], 0.30, 0.055, joint, 'bone'),
      { span: [[1.10 * k, 1.21, 0.95], NOCK_AT], joints: [joint, J.nock], w: 0.025, color: 'rope' },
    ];
  }),
  // Bolt: a shaft, an iron head, red fins.
  { c: [0, 1.33, 1.60], h: 1.30, r: [0.035, 0.035], n: 6, q: rotX(90 * DEG), joint: J.bolt, color: 'woodLight' },
  spike([0, 1.33, 2.25], [0, 0, 1], 0.26, 0.07, J.bolt, 'iron'),
  { c: [0, 1.33, 1.08], s: [0.17, 0.012, 0.22], joint: J.bolt, color: 'red' },
  { c: [0, 1.375, 1.08], s: [0.012, 0.09, 0.22], joint: J.bolt, color: 'red' },
  // Banner pole on the right rail: a skull on top, a bone bar to the rear, hide strips hanging from it.
  { c: [-0.50, 1.55, -1.05], s: [0.07, 1.70, 0.07], joint: J.pole, color: 'woodDark' },
  { c: [-0.50, 2.47, -1.05], s: [0.16, 0.15, 0.16], joint: J.pole, color: 'bone' },
  { c: [-0.50, 2.25, -1.40], s: [0.06, 0.06, 0.72], joint: J.pole, color: 'bone' },
  ...[[-0.15, 0.62, 'team'], [-0.38, 0.78, 'teamDark'], [-0.61, 0.52, 'team']].map(([dz, len, color]) =>
    ({ c: [-0.50, 2.22 - len / 2, -1.05 + dz - 0.06], s: [0.03, len, 0.19], joint: J.banner, color })),
  { c: [-0.479, 1.95, -1.49], s: [0.012, 0.13, 0.13], joint: J.banner, color: 'red' },
];

const M = machine({ name: 'orc-ballista', joints: JOINTS, palette: PALETTE, parts: PARTS });
const { worldOf, aimJoint, placeJoint, bindT, ground } = M;
const LIVE = JOINTS.map((_, i) => i).filter(i => i !== J.bolt);

// Lowest point of the parts on the given joints (all but the bolt by default) under a pose.
export const lowest = (pose, joints = LIVE) => M.lowest(pose, joints);

// The bow drawn by k (1 — drawn, 0 — released, < 0 — the arms whip past straight).
const NOCK_T = bindT('nock');
function bow(pose, k) {
  pose['bowL.rotation'] = rotY(DRAW * k * DEG);
  pose['bowR.rotation'] = rotY(-DRAW * k * DEG);
  pose['nock.translation'] = add(NOCK_T, [0, 0, -PULL * k]);
  return pose;
}
// A bolt with its rear end in the claw (scale: shown 1 / hidden 0.02 — never 0, see the units skill).
function loadBolt(pose, scale) {
  const nock = worldOf(pose, J.nock);
  aimJoint(pose, 'bolt', nock.q);
  placeJoint(pose, 'bolt', nock.p);
  if (scale !== undefined) pose['bolt.scale'] = [scale, scale, scale];
  return pose;
}

// Idle: drawn and loaded; the bow turns slowly on its post looking for a target, the banner sways.
const idle = t => loadBolt(ground(bow({
  'mount.rotation': rotY(14 * Math.sin(t) * DEG),
  'winch.rotation': I,
  'banner.rotation': qmul(rotZ(5 * Math.sin(t + 1) * DEG), rotX((4 + 4 * Math.sin(t)) * DEG)),
}, 1), LIVE));

// Run: one wheel turn per cycle (2πR = 2.51 m). The octagonal wheels roll on their corners, so the
// frame bumps 8 times per turn (ground()); the bow rattles on its post, the banner streams back.
const run = (t) => {
  const wheel = rotX(t);
  return loadBolt(ground(bow({
    'body.rotation': qmul(rotZ(0.9 * Math.sin(2 * t) * DEG), rotX(0.5 * Math.sin(4 * t) * DEG)),
    ...Object.fromEntries(WHEELS.map(w => [w + '.rotation', wheel])),
    'mount.rotation': qmul(rotY(1.2 * Math.sin(4 * t) * DEG), rotX(0.8 * Math.sin(8 * t) * DEG)),
    'winch.rotation': I,
    'banner.rotation': qmul(rotZ(4 * Math.sin(2 * t) * DEG), rotX((38 + 6 * Math.sin(4 * t)) * DEG)),
  }, 1), LIVE));
};

// Attack, 2.4 s in 72 keys: hold, the claw lets go (key 3), the string drives the bolt along the
// stock and the arms reach straight at key 5 (0.17 s): the bolt leaves at 32 m/s, 3° up, and is
// hidden at key 11 (~6 m out). The arms whip past straight and settle, the cart kicks;
// the windlass draws the bow again in six pulls (0.25–0.80), a new bolt slides onto the stock
// (0.80–0.88). The windlass ends where it began: the loop has no seam.
const F = 72, DURATION = 2.4, U_FIRE = 3 / F, U_HIT = 5 / F, U_GONE = 11 / F, WIND = 540;
const winding = u => ratchet(clamp01((u - 0.25) / 0.55));
function drawAt(u) {
  if (u < U_FIRE) return 1;
  if (u < U_HIT) return 1 - ((u - U_FIRE) / (U_HIT - U_FIRE)) ** 2;
  const d = u - U_HIT;
  if (d < 0.06) return -0.05 * Math.sin(Math.PI * d / 0.06);
  if (d < 0.10) return 0.025 * Math.sin(Math.PI * (d - 0.06) / 0.04);
  return winding(u);
}
const HIT = worldOf(ground(bow({ 'mount.rotation': I }, 0), LIVE), J.nock);
const SPEED = 32, LAUNCH = 3 * DEG;
function attack(t) {
  const u = t / (2 * Math.PI), d = u - U_HIT;
  const kick = d >= 0 && d < 0.08 ? Math.sin(Math.PI * d / 0.08) : 0;
  const pose = ground(bow({
    'body.rotation': rotX(-1.5 * kick * DEG),
    'mount.rotation': I,
    'winch.rotation': rotX((WIND * winding(u) - WIND * smooth((u - U_FIRE) / 0.1)) * DEG),
    'banner.rotation': qmul(rotZ(5 * Math.sin(t + 1) * DEG), rotX((4 + 4 * Math.sin(t) + 10 * kick) * DEG)),
  }, drawAt(u)), LIVE, 0.03 * kick);
  if (d <= 1e-9 || u > U_GONE + 1e-9) return loadBolt(pose, u <= U_HIT + 1e-9 ? 1 : 0.02 + 0.98 * smooth((u - 0.80) / 0.08));
  // In flight (shown up to key 10, hidden at key 11 — far away, not on its way back to the stock).
  const s = d * DURATION, vy = SPEED * Math.sin(LAUNCH) - 9.8 * s;
  aimJoint(pose, 'bolt', qmul(rotX(-Math.atan2(vy, SPEED * Math.cos(LAUNCH))), HIT.q));
  placeJoint(pose, 'bolt', add(HIT.p, [0, SPEED * Math.sin(LAUNCH) * s - 4.9 * s * s, SPEED * Math.cos(LAUNCH) * s]));
  const shown = u < U_GONE - 1e-9 ? 1 : 0.02;
  pose['bolt.scale'] = [shown, shown, shown];
  return pose;
}

// Death. The bow lets go at once (a misfire), the front-left wheel breaks off and the frame tips
// about the diagonal between the front-right and rear-left wheels until its bare corner is down.
const DIAG = norm([1.44, 0, -1.50]);
const tilt = a => [DIAG[0] * Math.sin(a / 2), 0, DIAG[2] * Math.sin(a / 2), Math.cos(a / 2)];
const BASE = [J.body, J.wheelFR, J.wheelHL, J.wheelHR];
const TILT = M.tiltAngle(DIAG, [J.body], BASE.slice(1));
const WHEEL_OFF = 0.06;

// Everything still attached: the frame jolts and tips, the bow snaps straight and whips, the right
// arm breaks forward when the bow hits the ground (0.38–0.46), the windlass spins free.
function attached(u) {
  const jolt = u < 0.10 ? 3 * Math.sin(Math.PI * u / 0.10) : 0;
  const k = clamp01((u - 0.08) / 0.22);
  const tipped = u < 0.30 ? TILT * k * k : u < 0.40 ? TILT * (1 - 0.15 * Math.sin(Math.PI * (u - 0.30) / 0.10)) : TILT;
  const d = u - 0.05, draw = u < 0.05 ? 1 - (u / 0.05) ** 2 : d < 0.06 ? -0.05 * Math.sin(Math.PI * d / 0.06) : 0;
  const broken = 50 * smooth((u - 0.38) / 0.08);
  const spin = -855 * (1 - (1 - clamp01(u / 0.70)) ** 2);
  const pose = bow({
    'body.rotation': qmul(tilt(tipped), rotZ(jolt * DEG)),
    'winch.rotation': rotX(spin * DEG),
    'banner.rotation': I,
  }, draw);
  pose['bowR.rotation'] = rotY((-DRAW * draw + broken) * DEG);
  for (const name of ['wheelFR', 'wheelHL', 'wheelHR']) pose[name + '.rotation'] = I;
  for (const name of ['wheelFL', 'mount', 'pole']) {
    pose[name + '.rotation'] = I;
    pose[name + '.translation'] = bindT(name);
  }
  return loadBolt(ground(pose, u < WHEEL_OFF ? [...BASE, J.wheelFL] : BASE));
}

// Loose pieces (siege-kit debris): x, z and the world rotation of their rest on the ground.
const DEBRIS = M.debris([
  { name: 'wheelFL', from: WHEEL_OFF, to: 0.36, at: [1.55, 1.25], q: qmul(rotY(-20 * DEG), rotZ(90 * DEG)), arc: 0.25 },
  { name: 'bolt', from: 0.06, to: 0.32, at: [0.95, 2.35], q: qmul(rotY(15 * DEG), rotX(-4 * DEG)), arc: 0.3 },
  { name: 'mount', from: 0.12, to: 0.44, at: [-1.85, 2.0], q: rotY(-30 * DEG), arc: 0.45 },
  { name: 'pole', from: 0.20, to: 0.52, at: [-0.80, -1.45], q: qmul(rotY(20 * DEG), rotZ(90 * DEG)), arc: 0.3 },
], attached);

export const deathPose = u => DEBRIS.apply(attached(u), u);

const CLIPS = [
  loopClip('idle', 2.6, 13, idle),
  loopClip('run', 1.5, 30, run),
  loopClip('attack', DURATION, F, attack),
  onceClip('death', 2.4, 48, deathPose),
];

export const DEBRIS_JOINTS = DEBRIS.list.map(d => d.name);
export const RELEASE_TIME = U_HIT * DURATION;

export default {
  name: 'orc-ballista', joints: JOINTS, palette: PALETTE, parts: PARTS, clips: CLIPS,
  preview: 'idle@0.6,run@0.3,attack@0.25,death@2.4',
  previewGap: 100,
};
