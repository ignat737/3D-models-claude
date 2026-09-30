// Orc: a low-poly brute with a two-handed great axe, 2.0 m tall (head box top 1.95 m, a head above
// the 1.75 m humans): green skin, tusks, mohawk, spiked team pauldrons, a team sash across the bare
// chest, a haft of 1.7 m. Own broader, taller skeleton (the humanoid joints scaled 1.15 up, shoulders
// 0.37 m off the axis, longer arms), the same joint names and clips as the humans. Faces +Z.
// Clips: "idle" (axe planted), "run" (axe slanted across the body), "attack" (looped overhead chop
// with a step) and "death" (once, stays down).
import { DEG, add, loopClip, onceClip, qmul, qrot, rig, rotX, rotY, rotZ, tween } from '../unit-glb.mjs';
import { B, SIDES, armAngles, deathBody, idleBody, runBody } from './humanoid.mjs';

const SY = 1.15;          // height of the skeleton against the human one
const HAND = 0.34;        // forearm joint -> fist centre
const BUTT = 0.20;        // axe: fist (bind) -> butt along the haft
const SPACING = 0.30;     // right fist -> left fist along the haft
const SINK = 0.02;        // a planted butt goes this deep: the ground under it may slope away

const AT = {
  hips: [0, 1.035, 0], torso: [0, 1.10, 0], head: [0, 1.70, 0],
  armL: [0.37, 1.61, 0], foreL: [0.37, 1.24, 0], armR: [-0.37, 1.61, 0], foreR: [-0.37, 1.24, 0],
  legL: [0.14, 1.035, 0], shinL: [0.14, 0.54, 0], legR: [-0.14, 1.035, 0], shinR: [-0.14, 0.54, 0],
};
const PARENT = { hips: -1, torso: 0, head: 1, armL: 1, foreL: 3, armR: 1, foreR: 5, legL: 0, shinL: 7, legR: 0, shinR: 9 };
const BODY = Object.keys(B).map(name => ({ name, at: AT[name], parent: PARENT[name] }));
const FIST_R = [-0.37, 1.24 - HAND, 0];
const JOINTS = [...BODY, { name: 'axe', at: FIST_R, parent: B.foreR }];
const { J, worldOf, aimJoint, reach } = rig(JOINTS);

// "team" and "teamDark" are the faction colours: recolour those two texels for another player.
const PALETTE = [
  { name: 'skin', hex: '#6f9a45' },
  { name: 'skinDark', hex: '#557a33' },
  { name: 'eye', hex: '#f2c230' },
  { name: 'tusk', hex: '#ece3c8' },
  { name: 'team', hex: '#2f5da8' },
  { name: 'teamDark', hex: '#22447d' },
  { name: 'hair', hex: '#1f1a17' },
  { name: 'iron', hex: '#5b6067' },
  { name: 'steel', hex: '#9aa3ab' },
  { name: 'blade', hex: '#d8dee3' },
  { name: 'leather', hex: '#5a3a22' },
  { name: 'cloth', hex: '#4a3b2f' },
  { name: 'wood', hex: '#8a5d33' },
];

const axeAt = (y, z = 0) => add(FIST_R, [0, y, z]);

const limbs = SIDES.flatMap((k) => {
  const arm = k > 0 ? B.armL : B.armR, fore = k > 0 ? B.foreL : B.foreR;
  const leg = k > 0 ? B.legL : B.legR, shin = k > 0 ? B.shinL : B.shinR;
  return [
    { c: [0.385 * k, 1.665, 0], s: [0.26, 0.12, 0.26], joint: arm, color: 'teamDark' },
    { c: [0.40 * k, 1.78, 0], h: 0.12, r: [0.05, 0.006], n: 4, joint: arm, color: 'iron' },
    { c: [0.37 * k, 1.425, 0], s: [0.16, 0.37, 0.16], joint: arm, color: 'skin' },
    { c: [0.37 * k, 1.12, 0], s: [0.15, 0.24, 0.15], joint: fore, color: 'skin' },
    { c: [0.37 * k, 1.06, 0], s: [0.18, 0.16, 0.18], joint: fore, color: 'iron' },
    { c: [0.37 * k, 0.90, 0], s: [0.17, 0.14, 0.17], joint: fore, color: 'skin' },
    { c: [0.14 * k, 0.785, 0], s: [0.19, 0.49, 0.19], joint: leg, color: 'cloth' },
    { c: [0.13 * k, 0.80, 0.115], s: [0.18, 0.36, 0.02], joint: leg, color: 'team' },
    { c: [0.13 * k, 0.80, -0.115], s: [0.18, 0.36, 0.02], joint: leg, color: 'team' },
    { c: [0.14 * k, 0.39, 0], s: [0.17, 0.30, 0.17], joint: shin, color: 'skin' },
    { c: [0.14 * k, 0.19, 0], s: [0.20, 0.20, 0.20], joint: shin, color: 'leather' },
    { c: [0.14 * k, 0.05, 0.04], s: [0.20, 0.10, 0.28], joint: shin, color: 'leather' },
  ];
});

const PARTS = [
  // Head: heavy brow, yellow eyes, flat nose, a jutting jaw with two tusks, ears, mohawk.
  { c: [0, 1.81, 0.04], s: [0.30, 0.27, 0.29], joint: B.head, color: 'skin' },
  { c: [0, 1.875, 0.19], s: [0.31, 0.055, 0.06], joint: B.head, color: 'skinDark' },
  ...SIDES.map(k => ({ c: [0.07 * k, 1.835, 0.192], s: [0.05, 0.03, 0.012], joint: B.head, color: 'eye' })),
  { c: [0, 1.785, 0.21], s: [0.08, 0.06, 0.05], joint: B.head, color: 'skinDark' },
  { c: [0, 1.715, 0.15], s: [0.28, 0.11, 0.17], joint: B.head, color: 'skin' },
  ...SIDES.map(k => ({ c: [0.095 * k, 1.80, 0.225], s: [0.035, 0.09, 0.035], joint: B.head, color: 'tusk' })),
  ...SIDES.flatMap(k => [
    { c: [0.185 * k, 1.84, -0.02], s: [0.07, 0.10, 0.06], joint: B.head, color: 'skin' },
    { c: [0.225 * k, 1.925, -0.02], s: [0.05, 0.07, 0.04], joint: B.head, color: 'skin' },
  ]),
  { c: [0, 1.965, 0.0], s: [0.06, 0.06, 0.26], joint: B.head, color: 'hair' },
  { c: [0, 2.005, -0.06], s: [0.05, 0.04, 0.14], joint: B.head, color: 'hair' },
  // Torso: bare chest and belly, a team sash across it (front and back), belt with a bone buckle.
  { c: [0, 1.46, 0], s: [0.56, 0.40, 0.30], joint: B.torso, color: 'skin' },
  { c: [0, 1.19, 0], s: [0.44, 0.14, 0.27], joint: B.torso, color: 'skin' },
  { c: [0, 1.42, 0.156], s: [0.10, 0.62, 0.012], q: rotZ(35 * DEG), joint: B.torso, color: 'team' },
  { c: [0, 1.42, -0.156], s: [0.10, 0.62, 0.012], q: rotZ(-35 * DEG), joint: B.torso, color: 'team' },
  { c: [0, 1.08, 0], s: [0.47, 0.08, 0.29], joint: B.torso, color: 'leather' },
  { c: [0, 1.08, 0.148], s: [0.09, 0.06, 0.012], joint: B.torso, color: 'tusk' },
  { c: [0, 0.97, 0], s: [0.44, 0.16, 0.26], joint: B.hips, color: 'cloth' },
  ...limbs,
  // Great axe, bind pose upright through the right fist: butt cap, haft with two leather grips and
  // a team ribbon, iron socket, a broad crescent bit facing +Z, a spike behind it and one on top.
  { c: axeAt(-BUTT + 0.025), h: 0.05, r: [0.04, 0.04], n: 6, joint: J.axe, color: 'steel' },
  { c: axeAt(0.65), h: 1.70, r: [0.032, 0.032], n: 6, joint: J.axe, color: 'wood' },
  { c: axeAt(0), h: 0.16, r: [0.038, 0.038], n: 6, joint: J.axe, color: 'leather' },
  { c: axeAt(SPACING), h: 0.16, r: [0.038, 0.038], n: 6, joint: J.axe, color: 'leather' },
  { c: axeAt(1.02), s: [0.07, 0.07, 0.07], joint: J.axe, color: 'team' },
  { c: axeAt(1.36), s: [0.09, 0.24, 0.09], joint: J.axe, color: 'iron' },
  { c: axeAt(1.36, 0.10), s: [0.05, 0.24, 0.12], joint: J.axe, color: 'iron' },
  { c: axeAt(1.36, 0.21), s: [0.035, 0.46, 0.12], joint: J.axe, color: 'steel' },
  { c: axeAt(1.36, 0.285), s: [0.022, 0.54, 0.03], joint: J.axe, color: 'blade' },
  { c: axeAt(1.36, -0.12), h: 0.14, r: [0.04, 0.006], n: 4, q: rotX(-90 * DEG), joint: J.axe, color: 'iron' },
  { c: axeAt(1.56), h: 0.12, r: [0.035, 0.006], n: 4, joint: J.axe, color: 'iron' },
];

// The skeleton is 1.15 times as tall: the hips track moves with it.
function grow(pose) {
  const h = pose['hips.translation'];
  if (h) pose['hips.translation'] = [h[0], h[1] * SY, h[2] * SY];
  return pose;
}

// Forward stoop on top of a body pose: the torso leans (deg), the head stays level.
function stoop(pose, deg) {
  pose['torso.rotation'] = qmul(pose['torso.rotation'] || [0, 0, 0, 1], rotX(deg * DEG));
  pose['head.rotation'] = qmul(pose['head.rotation'] || [0, 0, 0, 1], rotX(-0.8 * deg * DEG));
  return pose;
}

// The axe at the world rotation aim, the butt slid down to the ground.
function plant(pose, aim) {
  const fist = worldOf(pose, J.axe).p, up = qrot(aim, [0, 1, 0]);
  return aimJoint(pose, 'axe', aim, BUTT + (-SINK - fist[1]) / up[1]);
}

// Both hands on the haft: the right fist at fist (model space), the axe at aim, the left fist
// SPACING further along the haft.
function bothHands(pose, fist, aim) {
  reach(pose, 'armR', 'foreR', fist, [-1, -0.6, -0.4], HAND);
  aimJoint(pose, 'axe', aim, 0);
  reach(pose, 'armL', 'foreL', add(worldOf(pose, J.axe).p, qrot(aim, [0, SPACING, 0])), [1, -0.8, 0.2], HAND);
  return pose;
}

// Head up and tilted toward the body's centre (lat) and forward (pitch): the edge keeps facing
// forward while the haft is upright, and turns down as the haft swings forward.
const tilt = (lat, pitch) => qmul(rotZ(-lat * DEG), rotX(pitch * DEG));

const HUNCH = 8;   // degrees of stoop in idle
// Attack key poses, one per frame of the clip (22), found by a search: haft >= 1 cm clear of the body
// boxes, both fists on the haft. hx/hy/hz — right fist, lat/pitch — haft, ty/lean — torso, step — lunge.
const CHOP = [
  { u: 0, hx: -0.384, hy: 1.366, hz: -0.039, lat: 30.93, pitch: -30, ty: -2.019, lean: 16.979, step: 0.3, hips: 1 },
  { u: 1 / 22, hx: -0.384, hy: 1.361, hz: -0.054, lat: 32.2, pitch: -32.82, ty: -1.778, lean: 14.12, step: 0.3, hips: 1 },
  { u: 2 / 22, hx: -0.347, hy: 1.388, hz: -0.107, lat: 35.118, pitch: -35.21, ty: -2.348, lean: 13.824, step: 0.3, hips: 1 },
  { u: 3 / 22, hx: -0.375, hy: 1.389, hz: -0.07, lat: 32.387, pitch: -42.83, ty: 3.628, lean: 8.47, step: 0.3, hips: 1 },
  { u: 4 / 22, hx: -0.364, hy: 1.409, hz: -0.094, lat: 33.531, pitch: -47.93, ty: 6.074, lean: 6.208, step: 0.3, hips: 1 },
  { u: 5 / 22, hx: -0.335, hy: 1.641, hz: 0.097, lat: 24.697, pitch: -54.08, ty: -24.785, lean: 1.854, step: 0.3, hips: 1 },
  { u: 6 / 22, hx: -0.329, hy: 1.627, hz: 0.098, lat: 22.465, pitch: -57.46, ty: -31.51, lean: 1.39, step: 0.3, hips: 1 },
  { u: 7 / 22, hx: -0.319, hy: 1.629, hz: 0.093, lat: 21.992, pitch: -59.99, ty: -32.795, lean: 0.593, step: 0.3, hips: 1 },
  { u: 8 / 22, hx: -0.342, hy: 1.563, hz: 0.138, lat: 16.276, pitch: -33.72, ty: -32.115, lean: 3.665, step: 0.42, hips: 1 },
  { u: 9 / 22, hx: -0.31, hy: 1.32, hz: 0.32, lat: 17.6, pitch: 27.23, ty: -33.28, lean: 16.49, step: 0.68, hips: 0.98 },
  { u: 10 / 22, hx: -0.29, hy: 1.15, hz: 0.43, lat: 14.88, pitch: 82.51, ty: -32.48, lean: 29.09, step: 0.92, hips: 0.97 },
  { u: 11 / 22, hx: -0.287, hy: 1.093, hz: 0.465, lat: 13.809, pitch: 100.79, ty: -33.415, lean: 33.88, step: 1, hips: 0.97 },
  { u: 12 / 22, hx: -0.279, hy: 1.068, hz: 0.477, lat: 12.953, pitch: 103.95, ty: -33.743, lean: 36.055, step: 1, hips: 0.96 },
  { u: 13 / 22, hx: -0.279, hy: 1.053, hz: 0.486, lat: 12.372, pitch: 106.5, ty: -34.52, lean: 38.08, step: 1, hips: 0.96 },
  { u: 14 / 22, hx: -0.278, hy: 1.04, hz: 0.484, lat: 12.197, pitch: 106.29, ty: -34.332, lean: 38.954, step: 0.99, hips: 0.96 },
  { u: 15 / 22, hx: -0.29, hy: 1.06, hz: 0.45, lat: 13.53, pitch: 94.3, ty: -32.06, lean: 36.55, step: 0.93, hips: 0.96 },
  { u: 16 / 22, hx: -0.3, hy: 1.08, hz: 0.4, lat: 14.87, pitch: 82.26, ty: -30.17, lean: 34.54, step: 0.87, hips: 0.97 },
  { u: 17 / 22, hx: -0.32, hy: 1.13, hz: 0.3, lat: 17.79, pitch: 56.07, ty: -26.07, lean: 30.22, step: 0.73, hips: 0.98 },
  { u: 18 / 22, hx: -0.36, hy: 1.177, hz: 0.261, lat: 15.189, pitch: 35.26, ty: -21.168, lean: 24.396, step: 0.63, hips: 0.98 },
  { u: 19 / 22, hx: -0.405, hy: 1.242, hz: 0.221, lat: 10.258, pitch: 11.91, ty: -15.428, lean: 18.452, step: 0.52, hips: 0.99 },
  { u: 20 / 22, hx: -0.39, hy: 1.295, hz: -0.062, lat: 22.354, pitch: -7.94, ty: -4.345, lean: 21.474, step: 0.41, hips: 0.99 },
  { u: 21 / 22, hx: -0.378, hy: 1.335, hz: -0.075, lat: 29.768, pitch: -21.16, ty: -6.993, lean: 19.507, step: 0.34, hips: 1 },
  { u: 1, hx: -0.384, hy: 1.366, hz: -0.039, lat: 30.93, pitch: -30, ty: -2.019, lean: 16.979, step: 0.3, hips: 1 },
];

const CLIPS = [
  // At ease: the axe planted at the right side, butt on the ground, the left arm hanging.
  loopClip('idle', 2.6, 12, (t) => {
    const pose = stoop(armAngles({ lz: 10, lx: -6 - 2 * Math.sin(t), flx: -25, rz: 0, rx: 0, frx: 0 }, grow(idleBody(t))), HUNCH + 1.5 * Math.sin(t));
    reach(pose, 'armR', 'foreR', [-0.52, 1.10 + 0.006 * Math.sin(t), 0.26], [-0.5, -0.5, -1], HAND);
    return plant(pose, qmul(rotZ(3 * DEG), rotX(-2 * DEG)));
  }),
  // Run: the axe slanted across the body, head up on the left, both hands on the haft.
  loopClip('run', 0.7, 16, (t) => {
    const pose = grow(runBody(t));
    pose['torso.rotation'] = qmul(rotY(-15 * DEG), rotX(15.6 * DEG));
    pose['head.rotation'] = rotX(-12 * DEG);
    return bothHands(pose, [-0.40, 1.10 + 0.04 * Math.abs(Math.sin(t)), 0.22], tilt(33, 22 + 3 * Math.sin(2 * t)));
  }),
  // Attack: guard (axe over the right shoulder) -> wind-up -> overhead chop with a lunge -> the
  // head bites low in front -> guard. Looped: a unit in melee plays it over and over.
  loopClip('attack', 1.1, 22, (t) => {
    const p = tween(t / (2 * Math.PI), CHOP);
    return bothHands({
      'hips.translation': [0, p.hips, 0],
      'torso.rotation': qmul(rotY(p.ty * DEG), rotX(p.lean * DEG)),
      'head.rotation': qmul(rotY(-0.9 * p.ty * DEG), rotX(-0.8 * p.lean * DEG)),
      'legL.rotation': qmul(rotZ(5 * DEG), rotX(-24 * DEG * p.step)),
      'legR.rotation': qmul(rotZ(-5 * DEG), rotX(16 * DEG * p.step)),
      'shinL.rotation': rotX(18 * DEG * p.step),
      'shinR.rotation': rotX(8 * DEG * p.step),
    }, [p.hx, p.hy, p.hz], tilt(p.lat, p.pitch));
  }),
  // Death: the knees buckle, he falls on his back, the axe lies along the body rolled onto its
  // flat, the head a few degrees up: flat along the model it sinks into any rise of the ground.
  onceClip('death', 1.4, 14, (u) => {
    const { b, fall, pose: body } = deathBody(u);
    const pose = armAngles({ lz: 8 + 45 * fall, lx: -8, flx: -20 + 10 * fall, rz: -8 - 50 * fall, rx: -40 + 30 * b, frx: -50 + 30 * fall }, grow(body));
    return aimJoint(pose, 'axe', qmul(worldOf(pose, J.hips).q, qmul(rotX((-4 + 12 * fall) * DEG), rotY(90 * DEG * fall))), 0);
  }),
];

export default { name: 'orc', joints: JOINTS, palette: PALETTE, parts: PARTS, clips: CLIPS, preview: 'idle@0.6,attack@0.5' };
