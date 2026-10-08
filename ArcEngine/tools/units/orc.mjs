// Orc: a low-poly brute with a two-handed great axe, 2.0 m tall (head box top 1.95 m, a head above
// the 1.75 m humans): green skin, tusks, mohawk, spiked team pauldrons, a team sash across the bare
// chest, a haft of 1.7 m. Own broader, taller skeleton (the humanoid joints scaled 1.15 up, shoulders
// 0.37 m off the axis, longer arms), the same joint names and clips as the humans. Faces +Z.
// Clips: "idle" (axe planted), "run" (axe slanted across the body), "attack" (looped overhead chop
// with a step) and "death" (once, stays down).
import { DEG, add, cross, dot, loopClip, norm, onceClip, qconj, qmul, qrot, rig, rotX, rotY, rotZ, sub } from '../unit-glb.mjs';
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

// Keep each arm's lateral axis facing outward as it passes vertical. A shortest-arc
// aim alone flips its twist at the overhead pose, making glTF interpolation lose the grip.
function steadyArm(pose, upper, fore) {
  const upright = (q, reference = [1, 0, 0]) => {
    const y = qrot(q, [0, 1, 0]), x = qrot(q, [1, 0, 0]);
    const lateral = norm(sub(reference, y.map(v => v * dot(reference, y))));
    return qmul(q, rotY(Math.atan2(dot(y, cross(x, lateral)), dot(x, lateral))));
  };
  const u = worldOf(pose, J[upper]), f = worldOf(pose, J[fore]);
  const parent = worldOf(pose, JOINTS[J[upper]].parent);
  pose[upper + '.rotation'] = qmul(qconj(parent.q), upright(u.q));
  pose[fore + '.rotation'] = qmul(qconj(worldOf(pose, J[upper]).q), upright(f.q, fore === 'foreL' ? [0, 0, 1] : [1, 0, 0]));
}

// Both hands on the haft: the right fist at fist (model space), the axe at aim, the left fist
// SPACING further along the haft.
function bothHands(pose, fist, aim, poleR = [-1, -0.6, -0.4], poleL = [1, -0.8, 0.2], steady = false) {
  reach(pose, 'armR', 'foreR', fist, poleR, HAND);
  if (steady) steadyArm(pose, 'armR', 'foreR');
  aimJoint(pose, 'axe', aim, 0);
  reach(pose, 'armL', 'foreL', add(worldOf(pose, J.axe).p, qrot(aim, [0, SPACING, 0])), poleL, HAND);
  if (steady) steadyArm(pose, 'armL', 'foreL');
  return pose;
}

// Head up and tilted toward the body's centre (lat) and forward (pitch): the edge keeps facing
// forward while the haft is upright, and turns down as the haft swings forward.
const tilt = (lat, pitch) => qmul(rotZ(-lat * DEG), rotX(pitch * DEG));

const HUNCH = 8;   // degrees of stoop in idle
// Raise the hands to the crown, with the axe still tilted upward behind the head.
// Reverse at that single, limited wind-up pose without a hold, then chop forward and down.
const CHOP = [
  { u: 0, hx: -0.361, hy: 1.244, hz: 0.323, lat: 24.853, pitch: 10.023, ty: -12.05, lean: 10.897, step: 0.3, hips: 1, prx: -1, pry: -0.8, prz: 0, plx: 1, ply: -0.8, plz: 0.2 },
  { u: 0.2, hx: -0.36315, hy: 1.50546, hz: 0.45374, lat: 47.87237, pitch: 16.18085, ty: -24.55319, lean: 3.59382, step: 0.09958, hips: 1.0351, prx: -1, pry: -0.77076, prz: 0.00664, plx: 1, ply: -0.7919, plz: 0.22429 },
  { u: 0.34, hx: -0.30956, hy: 1.74395, hz: 0.45534, lat: 54.54041, pitch: -36.53213, ty: -23.55842, lean: -7.13039, step: 0.05781, hips: 1.04344, prx: -1, pry: -0.5723, prz: -0.33444, plx: 1, ply: -0.73802, plz: 0.10119 },
  { u: 0.45, hx: 0.02, hy: 2.04, hz: 0.35, lat: 20, pitch: -65, ty: 0, lean: 0, step: 0.08, hips: 1.045, prx: -1, pry: -0.2, prz: 0.8, plx: 1, ply: 0, plz: -0.8 },
  { u: 0.57, hx: -0.09093, hy: 1.93428, hz: 0.46816, lat: 57.7769, pitch: -26.76639, ty: -7.65629, lean: -3.25597, step: 0.26979, hips: 1.02965, prx: -1, pry: 0.3081, prz: -0.29521, plx: 1, ply: 0.41945, plz: 0.93289 },
  { u: 0.67, hx: -0.298, hy: 1.297, hz: 0.376, lat: 17.274, pitch: 46.014, ty: -28.329, lean: 16.97, step: 0.952, hips: 0.972, prx: -1, pry: -0.8, prz: 0, plx: 1, ply: -0.8, plz: 0.2 },
  { u: 0.74, hx: -0.28807, hy: 1.1162, hz: 0.46044, lat: 13.82388, pitch: 90.37189, ty: -30.47577, lean: 30.86586, step: 0.99968, hips: 0.96107, prx: -1, pry: -0.8, prz: 0, plx: 1, ply: -0.8, plz: 0.2 },
  { u: 0.82, hx: -0.28434, hy: 1.07507, hz: 0.4752, lat: 13.2409, pitch: 94.97487, ty: -31.1123, lean: 34.65873, step: 0.94689, hips: 0.96319, prx: -1, pry: -0.8, prz: 0, plx: 1, ply: -0.8, plz: 0.2 },
  { u: 1, hx: -0.361, hy: 1.244, hz: 0.323, lat: 24.853, pitch: 10.023, ty: -12.05, lean: 10.897, step: 0.3, hips: 1, prx: -1, pry: -0.8, prz: 0, plx: 1, ply: -0.8, plz: 0.2 },
];

// Monotone Hermite interpolation keeps each control inside its two key values. Unlike
// smoothstep per stop, matching tangents let the motion flow through the intermediate poses.
// The wind-up has one turning point and immediately reverses into the strike.
function chopPose(u) {
  let i = 0;
  while (i < CHOP.length - 2 && u > CHOP[i + 1].u) i++;
  const a = CHOP[i], b = CHOP[i + 1], h = b.u - a.u, t = (u - a.u) / h;
  const out = {};
  for (const key of Object.keys(a)) {
    if (key === 'u') continue;
    const d = CHOP.slice(1).map((p, j) => (p[key] - CHOP[j][key]) / (p.u - CHOP[j].u));
    const slope = j => {
      const last = CHOP.length - 1, left = j === 0 ? d[last - 1] : d[j - 1], right = j === last ? d[0] : d[j];
      if (left * right <= 0) return 0;
      const hl = j === 0 ? 1 - CHOP[last - 1].u : CHOP[j].u - CHOP[j - 1].u;
      const hr = j === last ? CHOP[1].u : CHOP[j + 1].u - CHOP[j].u;
      const w1 = 2 * hr + hl, w2 = hr + 2 * hl;
      return (w1 + w2) / (w1 / left + w2 / right);
    };
    out[key] = (2*t*t*t - 3*t*t + 1)*a[key] + (t*t*t - 2*t*t + t)*h*slope(i)
      + (-2*t*t*t + 3*t*t)*b[key] + (t*t*t - t*t)*h*slope(i + 1);
  }
  return out;
}

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
  loopClip('attack', 1.1, 120, (t) => {
    const p = chopPose(t / (2 * Math.PI));
    return bothHands({
      'hips.translation': [0, p.hips, 0],
      'torso.rotation': qmul(rotY(p.ty * DEG), rotX(p.lean * DEG)),
      'head.rotation': qmul(rotY(-0.9 * p.ty * DEG), rotX(-0.8 * p.lean * DEG)),
      'legL.rotation': qmul(rotZ(5 * DEG), rotX(-24 * DEG * p.step)),
      'legR.rotation': qmul(rotZ(-5 * DEG), rotX(16 * DEG * p.step)),
      'shinL.rotation': rotX(18 * DEG * p.step),
      'shinR.rotation': rotX(8 * DEG * p.step),
    }, [p.hx, p.hy, p.hz], tilt(p.lat, p.pitch), [p.prx, p.pry, p.prz], [p.plx, p.ply, p.plz], true);
  }),
  // Death: the knees buckle, he falls on his back, the axe lies along the body rolled onto its
  // flat, the head a few degrees up: flat along the model it sinks into any rise of the ground.
  onceClip('death', 1.4, 14, (u) => {
    const { b, fall, pose: body } = deathBody(u);
    const pose = armAngles({ lz: 8 + 45 * fall, lx: -8, flx: -20 + 10 * fall, rz: -8 - 50 * fall, rx: -40 + 30 * b, frx: -50 + 30 * fall }, grow(body));
    return aimJoint(pose, 'axe', qmul(worldOf(pose, J.hips).q, qmul(rotX((-4 + 12 * fall) * DEG), rotY(90 * DEG * fall))), 0);
  }),
];

export default { name: 'orc', joints: JOINTS, palette: PALETTE, parts: PARTS, clips: CLIPS, preview: 'idle@0.6,attack@0.495,attack@0.82' };
