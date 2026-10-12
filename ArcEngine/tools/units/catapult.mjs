// Catapult: a human siege engine for a strategy game — a wheeled onager, 3.1 m long, 1.6 m wide,
// 2.45 m to the cup when fired. Oak frame on four solid wheels, a torsion skein with bronze washers,
// a throwing arm with a leather cup, a stop beam with a team-coloured cushion, a windlass at the
// rear, a team-coloured mantlet with a gold cross at the front, a pile of spare stones and a
// pennant. Faces +Z (the glTF front, where it shoots), +X is its left. No crew: it is a machine.
// Bind pose: the arm upright against the cushion (just fired); every clip starts cocked.
// Clips: "idle" (cocked and loaded, the pennant waves), "run" (rolls forward, the wheels make one
// turn per cycle), "attack" (release, the arm hits the cushion, the stone flies, the windlass
// cocks the arm again, a new stone appears in the cup) — looped; "death" (a wheel breaks off, the
// frame drops onto that corner, the arm snaps, the stop beam racks, the mantlet and the pennant
// fall off, the debris lies on the ground) — once.
import { DEG, add, loopClip, norm, onceClip, qmul, qrot, rotX, rotY, rotZ, sub } from '../unit-glb.mjs';
import { I, SIDES, along, beam, clamp01, machine, ratchet, smooth } from './siege-kit.mjs';

const R = 0.42;                    // wheel radius = axle height
const PIVOT = [0, 0.74, 0.35];     // the arm's axle in the skein
const COCKED = -80;                // arm angle when cocked (deg, back toward the windlass); 0 — upright

const JOINTS = [
  { name: 'body', at: [0, R, 0], parent: -1 },
  { name: 'wheelFL', at: [0.72, R, 0.95], parent: 0 },
  { name: 'wheelFR', at: [-0.72, R, 0.95], parent: 0 },
  { name: 'wheelHL', at: [0.72, R, -0.85], parent: 0 },
  { name: 'wheelHR', at: [-0.72, R, -0.85], parent: 0 },
  { name: 'arm', at: PIVOT, parent: 0 },
  { name: 'armTip', at: [0, 1.69, 0.35], parent: 5 },     // where the arm snaps in death
  { name: 'stone', at: [0, 2.24, 0.66], parent: 0 },      // on the body: placed in the cup or in flight every frame
  { name: 'stand', at: [-0.50, 0.73, 0.56], parent: 0 },  // the stop beam's frame, hinged at its right foot
  { name: 'winch', at: [0, 1.10, -1.38], parent: 0 },
  { name: 'pole', at: [0, 0.72, -1.52], parent: 0 },
  { name: 'flag', at: [0, 1.98, -1.52], parent: 10 },
  { name: 'board', at: [0, 0.67, 1.46], parent: 0 },      // the mantlet, hinged at its bottom edge
];
const J = Object.fromEntries(JOINTS.map((j, i) => [j.name, i]));

// "team" and "teamDark" are the faction colours, the same texels as on the infantry.
const PALETTE = [
  { name: 'wood', hex: '#8b5a2b' },
  { name: 'woodDark', hex: '#5e3b1c' },
  { name: 'woodLight', hex: '#b5895a' },
  { name: 'iron', hex: '#4a4f55' },
  { name: 'bronze', hex: '#b0803a' },
  { name: 'rope', hex: '#c9b27c' },
  { name: 'leather', hex: '#6a4325' },
  { name: 'stone', hex: '#8f8c85' },
  { name: 'team', hex: '#2f5da8' },
  { name: 'teamDark', hex: '#22447d' },
  { name: 'trim', hex: '#e2b545' },
];

const WHEELS = ['wheelFL', 'wheelFR', 'wheelHL', 'wheelHR'];

const PARTS = [
  // Frame: two rails, three cross beams, a plank floor at the front under the spare stones.
  ...SIDES.map(k => ({ c: [0.55 * k, 0.66, -0.06], s: [0.14, 0.14, 2.98], joint: J.body, color: 'wood' })),
  ...[1.36, -0.30, -1.49].map(z => ({ c: [0, 0.66, z], s: [0.96, 0.12, 0.12], joint: J.body, color: 'wood' })),
  { c: [0, 0.70, 1.00], s: [0.96, 0.05, 0.56], joint: J.body, color: 'woodLight' },
  { c: [0.17, 0.83, 1.00], h: 0.20, r: [0.12, 0.09], n: 6, joint: J.body, color: 'stone' },
  { c: [-0.16, 0.83, 0.98], h: 0.20, r: [0.12, 0.09], n: 6, joint: J.body, color: 'stone' },
  // Axles under the rails on blocks; solid wheels with iron hubs turn on their own joints.
  ...[0.95, -0.85].flatMap(z => [
    { c: [0, R, z], s: [1.56, 0.09, 0.09], joint: J.body, color: 'iron' },
    ...SIDES.map(k => ({ c: [0.55 * k, 0.525, z], s: [0.12, 0.13, 0.14], joint: J.body, color: 'woodDark' })),
  ]),
  ...WHEELS.flatMap(name => [
    along(JOINTS[J[name]].at, 0.10, [R, R], 8, J[name], 'woodDark'),
    along(JOINTS[J[name]].at, 0.16, [0.10, 0.10], 6, J[name], 'iron'),
  ]),
  // Torsion skein between the rails, bronze washers outside them.
  along(PIVOT, 0.96, [0.12, 0.12], 6, J.body, 'rope'),
  ...SIDES.map(k => along([0.645 * k, PIVOT[1], PIVOT[2]], 0.05, [0.17, 0.17], 8, J.body, 'bronze')),
  // Throwing arm (upright in bind) with an iron band; the upper part with its cup snaps off in death.
  { c: [0, 1.165, 0.35], s: [0.13, 1.05, 0.13], joint: J.arm, color: 'wood' },
  { c: [0, 1.40, 0.35], s: [0.145, 0.06, 0.145], joint: J.arm, color: 'iron' },
  { c: [0, 2.025, 0.35], s: [0.12, 0.67, 0.12], joint: J.armTip, color: 'wood' },
  { c: [0, 1.72, 0.35], s: [0.15, 0.10, 0.14], joint: J.armTip, color: 'iron' },
  { c: [0, 2.24, 0.48], h: 0.14, r: [0.09, 0.19], n: 6, q: rotX(90 * DEG), joint: J.armTip, color: 'leather' },
  { c: [0, 2.24, 0.66], h: 0.22, r: [0.13, 0.10], n: 6, joint: J.stone, color: 'stone' },
  // Stop beam on two uprights braced to the front; the cushion the arm hits is team-coloured.
  ...SIDES.map(k => ({ c: [0.50 * k, 1.175, 0.56], s: [0.12, 0.89, 0.12], joint: J.stand, color: 'wood' })),
  { c: [0, 1.62, 0.56], s: [1.20, 0.16, 0.16], joint: J.stand, color: 'wood' },
  { c: [0, 1.635, 0.54], s: [0.60, 0.30, 0.21], joint: J.stand, color: 'team' },
  ...SIDES.map(k => ({ c: [0.20 * k, 1.635, 0.54], s: [0.05, 0.312, 0.222], joint: J.stand, color: 'teamDark' })),
  ...SIDES.map(k => beam([0.50 * k, 1.45, 0.62], [0.50 * k, 0.76, 1.28], 0.10, J.stand, 'wood')),
  // Windlass at the rear: posts on the rails, a drum with a rope coil, two crossed handspikes per side.
  ...SIDES.map(k => ({ c: [0.55 * k, 0.94, -1.38], s: [0.10, 0.42, 0.12], joint: J.body, color: 'wood' })),
  along([0, 1.10, -1.38], 1.00, [0.085, 0.085], 6, J.winch, 'woodDark'),
  along([0, 1.10, -1.38], 0.50, [0.10, 0.10], 6, J.winch, 'rope'),
  ...SIDES.flatMap(k => [
    { c: [0.635 * k, 1.10, -1.38], s: [0.035, 0.46, 0.05], joint: J.winch, color: 'woodLight' },
    { c: [0.635 * k, 1.10, -1.38], s: [0.035, 0.05, 0.46], joint: J.winch, color: 'woodLight' },
  ]),
  // Pennant on a pole at the rear, a gold stripe along it.
  { c: [0, 1.37, -1.52], s: [0.045, 1.30, 0.045], joint: J.pole, color: 'woodDark' },
  { c: [0, 2.045, -1.52], s: [0.07, 0.05, 0.07], joint: J.pole, color: 'trim' },
  { c: [0, 1.83, -1.79], s: [0.015, 0.30, 0.50], joint: J.flag, color: 'team' },
  { c: [0, 1.83, -1.79], s: [0.025, 0.06, 0.50], joint: J.flag, color: 'trim' },
  // Mantlet across the front with the gold cross of the human faction.
  { c: [0, 0.98, 1.46], s: [1.10, 0.62, 0.06], joint: J.board, color: 'team' },
  { c: [0, 1.00, 1.496], s: [0.10, 0.48, 0.012], joint: J.board, color: 'trim' },
  { c: [0, 1.04, 1.496], s: [0.42, 0.10, 0.012], joint: J.board, color: 'trim' },
];

const M = machine({ name: 'catapult', joints: JOINTS, palette: PALETTE, parts: PARTS });
const { worldOf, aimJoint, placeJoint, bindT, ground } = M;
const LIVE = JOINTS.map((_, i) => i).filter(i => i !== J.stone);

// Lowest point of the parts on the given joints (all but the stone by default) under a pose.
export const lowest = (pose, joints = LIVE) => M.lowest(pose, joints);

// The stone in the cup (scale: shown 1 / hidden 0.02 — never 0, see the units skill).
const IN_CUP = sub(JOINTS[J.stone].at, JOINTS[J.armTip].at);
function loadStone(pose, scale) {
  const tip = worldOf(pose, J.armTip);
  aimJoint(pose, 'stone', tip.q);
  placeJoint(pose, 'stone', add(tip.p, qrot(tip.q, IN_CUP)));
  if (scale !== undefined) pose['stone.scale'] = [scale, scale, scale];
  return pose;
}

// Idle: cocked and loaded, the arm creaks a little, the pennant waves.
const idle = t => loadStone(ground({
  'arm.rotation': rotX((COCKED + 0.6 * Math.sin(t)) * DEG),
  'flag.rotation': rotY((14 * Math.sin(t) + 5 * Math.sin(3 * t + 1)) * DEG),
}, LIVE));

// Run: one wheel turn per cycle (2πR = 2.64 m). The octagonal wheels roll on their corners, so
// the frame bumps 8 times per turn (ground()); the arm rattles with the bumps, the pennant streams.
const run = (t) => {
  const wheel = rotX(t);
  return loadStone(ground({
    'body.rotation': qmul(rotZ(0.8 * Math.sin(2 * t) * DEG), rotX(0.5 * Math.sin(4 * t) * DEG)),
    ...Object.fromEntries(WHEELS.map(w => [w + '.rotation', wheel])),
    'arm.rotation': rotX((COCKED + 1.2 * Math.sin(8 * t)) * DEG),
    'flag.rotation': rotY((10 * Math.sin(4 * t) + 4 * Math.sin(6 * t + 1)) * DEG),
  }, LIVE));
};

// Attack, 3 s in 90 keys: hold, release (key 5), the arm hits the cushion (key 10, 0.33 s) and the
// stone leaves the cup at 40° up, 20 m/s; the frame kicks, the arm bounces back and settles; the
// windlass unwinds during the swing and cranks the arm down again in six pulls (0.30–0.84); a new
// stone appears in the cup (0.84–0.90). The windlass ends where it began: the loop has no seam.
const F = 90, DURATION = 3.0, U_FIRE = 5 / F, U_HIT = 10 / F, U_GONE = 18 / F, WIND = 450;
const winding = u => ratchet(clamp01((u - 0.30) / 0.54));
function armAngle(u) {
  if (u < U_FIRE) return COCKED;
  if (u < U_HIT) return COCKED * (1 - ((u - U_FIRE) / (U_HIT - U_FIRE)) ** 2);
  const d = u - U_HIT;
  if (d < 0.07) return -9 * Math.sin(Math.PI * d / 0.07);
  if (d < 0.12) return -2.5 * Math.sin(Math.PI * (d - 0.07) / 0.05);
  return COCKED * winding(u);
}
const HIT = worldOf(loadStone(ground({ 'arm.rotation': I }, LIVE)), J.stone);
const LAUNCH = [0, 20 * Math.sin(40 * DEG), 20 * Math.cos(40 * DEG)];
function attack(t) {
  const u = t / (2 * Math.PI), d = u - U_HIT;
  const kick = d >= 0 && d < 0.06 ? Math.sin(Math.PI * d / 0.06) : 0;
  const pose = ground({
    'body.rotation': rotX(4 * kick * DEG),
    'arm.rotation': rotX(armAngle(u) * DEG),
    'winch.rotation': rotX((-WIND * smooth((u - U_FIRE) / 0.105) + WIND * winding(u)) * DEG),
    'flag.rotation': rotY((14 * Math.sin(t) + 5 * Math.sin(3 * t + 1) + 12 * kick) * DEG),
  }, LIVE, 0.07 * kick);
  if (d <= 1e-9 || u > U_GONE + 1e-9) return loadStone(pose, u <= U_HIT + 1e-9 ? 1 : 0.02 + 0.98 * smooth((u - 0.84) / 0.06));
  // In flight (shown up to key 17, hidden at key 18 — far away, not on its way back to the cup).
  const s = d * DURATION;
  aimJoint(pose, 'stone', qmul(rotX(-540 * s * DEG), HIT.q));
  placeJoint(pose, 'stone', add(HIT.p, add(LAUNCH.map(v => v * s), [0, -4.9 * s * s, 0])));
  const shown = u < U_GONE - 1e-9 ? 1 : 0.02;
  pose['stone.scale'] = [shown, shown, shown];
  return pose;
}

// Death. The front-right wheel breaks off and the frame tips about the diagonal between the
// rear-right and front-left wheels until its bare corner touches the ground.
const DIAG = norm([1.44, 0, 1.80]);
const tilt = a => [DIAG[0] * Math.sin(a / 2), 0, DIAG[2] * Math.sin(a / 2), Math.cos(a / 2)];
const BASE = [J.body, J.wheelFL, J.wheelHL, J.wheelHR];
const TILT = M.tiltAngle(DIAG, [J.body], BASE.slice(1));
const WHEEL_OFF = 0.06;

// Everything still attached: the frame jolts and tips, the arm slams into the cushion (0.10–0.18),
// the stop beam racks to the right, the windlass spins free.
function attached(u) {
  const jolt = u < 0.10 ? 3 * Math.sin(Math.PI * u / 0.10) : 0;
  const k = clamp01((u - 0.08) / 0.22);
  const tipped = u < 0.30 ? TILT * k * k : u < 0.40 ? TILT * (1 - 0.15 * Math.sin(Math.PI * (u - 0.30) / 0.10)) : TILT;
  const arm = u < 0.10 ? COCKED : COCKED * (1 - clamp01((u - 0.10) / 0.08) ** 2);
  const rack = 12 * smooth((u - 0.18) / 0.22);
  const spin = u < 0.10 ? 0 : -900 * (1 - (1 - clamp01((u - 0.10) / 0.60)) ** 2);
  const pose = {
    'body.rotation': qmul(tilt(tipped), rotZ(jolt * DEG)),
    'arm.rotation': qmul(rotZ(rack * DEG), rotX(arm * DEG)),
    'stand.rotation': rotZ(rack * DEG),
    'winch.rotation': rotX(spin * DEG),
    'flag.rotation': I,
  };
  for (const name of ['wheelFR', 'armTip', 'board', 'pole']) {
    pose[name + '.rotation'] = I;
    pose[name + '.translation'] = bindT(name);
  }
  return loadStone(ground(pose, u < WHEEL_OFF ? [...BASE, J.wheelFR] : BASE));
}

// Loose pieces (siege-kit debris): x, z and the world rotation of their rest on the ground.
const DEBRIS = M.debris([
  { name: 'wheelFR', from: WHEEL_OFF, to: 0.36, at: [-1.40, 1.32], q: qmul(rotY(25 * DEG), rotZ(90 * DEG)), arc: 0.25 },
  { name: 'stone', from: 0.18, to: 0.40, at: [-0.35, 2.55], q: qmul(rotY(40 * DEG), rotZ(80 * DEG)), arc: 0.4 },
  { name: 'armTip', from: 0.18, to: 0.46, at: [1.15, 0.42], q: qmul(rotY(-15 * DEG), rotX(-90 * DEG)), arc: 0.35 },
  { name: 'board', from: 0.22, to: 0.48, at: [-0.05, 1.62], q: qmul(rotY(-8 * DEG), rotX(90 * DEG)), arc: 0.05 },
  { name: 'pole', from: 0.24, to: 0.56, at: [-0.40, -1.95], q: qmul(rotY(-10 * DEG), rotZ(90 * DEG)), arc: 0.3 },
], attached);

export const deathPose = u => DEBRIS.apply(attached(u), u);

const CLIPS = [
  loopClip('idle', 2.4, 12, idle),
  loopClip('run', 1.6, 32, run),
  loopClip('attack', DURATION, F, attack),
  onceClip('death', 2.2, 44, deathPose),
];

export const DEBRIS_JOINTS = DEBRIS.list.map(d => d.name);
export const RELEASE_TIME = U_HIT * DURATION;

export default {
  name: 'catapult', joints: JOINTS, palette: PALETTE, parts: PARTS, clips: CLIPS,
  preview: 'idle@0.6,run@0.4,attack@0.45,death@2.2',
  previewGap: 100,
};
