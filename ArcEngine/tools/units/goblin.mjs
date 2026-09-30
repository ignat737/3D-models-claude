// Goblin spear thrower: a low-poly scrapper 1.6 m tall (the ear tips), big head and ears, a long
// nose, yellow eyes, a team tunic and headband, a bundle of spare javelins on the back and a
// 1.5 m javelin in the right fist. Own body: the humanoid joints scaled (0.8 wide, 0.88 tall).
// Faces +Z. Clips: "idle" (javelin planted), "run" (javelin carried forward), "attack" (looped:
// draw back, hurl the javelin — it flies off and vanishes — pull a new one from the back) and
// "death" (once, stays down).
import { DEG, add, loopClip, onceClip, qmul, qrot, rig, rotX, rotY, rotZ, tween } from '../unit-glb.mjs';
import { B, SIDES, armAngles, deathBody, idleBody, runBody } from './humanoid.mjs';
import { scaledBody, stoop } from './scaled.mjs';

const { BODY, FIST_R, HAND, S, limbs, grow } = scaledBody(0.8, 0.88, 0.8);
const GRIP = 0.748;   // butt -> right fist along the shaft (the fist height: the bind butt touches y = 0)
const SINK = 0.02;    // a planted butt goes this deep: the ground under it may slope away
const HIPS = 0.88 * 0.90;
const JOINTS = [...BODY, { name: 'spear', at: FIST_R, parent: B.foreR }];
const { J, worldOf, aimJoint, reach } = rig(JOINTS);

// "team" and "teamDark" are the faction colours: recolour those two texels for another player.
const PALETTE = [
  { name: 'skin', hex: '#9bb544' },
  { name: 'skinDark', hex: '#7d963a' },
  { name: 'eye', hex: '#f2d22e' },
  { name: 'pupil', hex: '#1d1a14' },
  { name: 'tusk', hex: '#ece3c8' },
  { name: 'team', hex: '#2f5da8' },
  { name: 'teamDark', hex: '#22447d' },
  { name: 'leather', hex: '#5a3a22' },
  { name: 'cloth', hex: '#4a3b2f' },
  { name: 'wood', hex: '#9b6b3c' },
  { name: 'steel', hex: '#9aa3ab' },
  { name: 'blade', hex: '#d8dee3' },
];

const spearAt = y => add(FIST_R, [0, y, 0]);
// Spare javelins strapped on the back, leaning: rod and head are laid out upright and share one
// rotation about the rod centre, so the head stays on the end of its rod.
const rod = (x, a, z) => {
  const c = [x, 1.12, z], q = rotZ(a * DEG);
  return [
    { c, h: 0.80, r: [0.014, 0.014], n: 6, q, joint: B.torso, color: 'wood' },
    { c: add(c, [0, 0.44, 0]), h: 0.09, r: [0.024, 0.003], n: 4, q, pivot: c, joint: B.torso, color: 'steel' },
  ];
};

const PARTS = [
  // Head: skull, brow, big yellow eyes with pupils, a long nose, a jutting jaw with two teeth,
  // long ears swept up, a team headband with a knot.
  { c: [0, 1.425, 0], s: [0.30, 0.27, 0.27], joint: B.head, color: 'skin' },
  { c: [0, 1.495, 0.14], s: [0.30, 0.04, 0.05], joint: B.head, color: 'skinDark' },
  ...SIDES.flatMap(k => [
    { c: [0.075 * k, 1.45, 0.138], s: [0.07, 0.055, 0.015], joint: B.head, color: 'eye' },
    { c: [0.075 * k, 1.45, 0.148], s: [0.022, 0.04, 0.006], joint: B.head, color: 'pupil' },
    { c: [0.07 * k, 1.335, 0.16], s: [0.028, 0.05, 0.025], joint: B.head, color: 'tusk' },
    { c: [0.235 * k, 1.54, -0.01], s: [0.20, 0.045, 0.11], q: rotZ(28 * k * DEG), joint: B.head, color: 'skin' },
  ]),
  { c: [0, 1.40, 0.19], s: [0.06, 0.07, 0.11], joint: B.head, color: 'skin' },
  { c: [0, 1.375, 0.25], s: [0.05, 0.04, 0.03], joint: B.head, color: 'skinDark' },
  { c: [0, 1.335, 0.075], s: [0.22, 0.06, 0.16], joint: B.head, color: 'skinDark' },
  { c: [0, 1.50, 0], s: [0.32, 0.05, 0.29], joint: B.head, color: 'teamDark' },
  { c: [0, 1.50, -0.17], s: [0.06, 0.06, 0.05], joint: B.head, color: 'teamDark' },
  { c: [0.02, 1.43, -0.19], s: [0.035, 0.12, 0.02], q: rotZ(8 * DEG), joint: B.head, color: 'teamDark' },
  // Tunic, bare neck, belt with a bone buckle, a loincloth on the hips.
  S({ c: [0, 1.20, 0], s: [0.40, 0.50, 0.22], joint: B.torso, color: 'team' }),
  S({ c: [0, 1.47, 0], s: [0.13, 0.06, 0.13], joint: B.torso, color: 'skin' }),
  S({ c: [0, 0.975, 0], s: [0.42, 0.07, 0.26], joint: B.torso, color: 'leather' }),
  S({ c: [0, 0.975, 0.133], s: [0.07, 0.05, 0.01], joint: B.torso, color: 'tusk' }),
  S({ c: [0, 0.87, 0], s: [0.38, 0.14, 0.22], joint: B.hips, color: 'cloth' }),
  ...limbs({ upper: 'skin', fore: 'leather', fist: 'skin', thigh: 'cloth', flap: 'leather', shin: 'skin', boot: 'leather' }),
  // Two spare javelins and a strap across the chest.
  ...rod(-0.03, 16, -0.135), ...rod(0.05, 22, -0.165),
  S({ c: [0, 1.17, 0.113], s: [0.05, 0.56, 0.008], q: rotZ(-42 * DEG), joint: B.torso, color: 'leather' }),
  // Javelin, bind pose upright through the right fist: butt cap, shaft, leather grip, team ribbon,
  // socket, blade.
  { c: spearAt(-GRIP + 0.02), h: 0.04, r: [0.022, 0.022], n: 6, joint: J.spear, color: 'steel' },
  { c: spearAt(-0.174), h: 1.148, r: [0.018, 0.016], n: 6, joint: J.spear, color: 'wood' },
  { c: spearAt(0), h: 0.14, r: [0.03, 0.03], n: 6, joint: J.spear, color: 'leather' },
  { c: spearAt(0.30), s: [0.045, 0.07, 0.045], joint: J.spear, color: 'team' },
  { c: spearAt(0.43), h: 0.06, r: [0.022, 0.028], n: 6, joint: J.spear, color: 'steel' },
  { c: spearAt(0.49), h: 0.05, r: [0.02, 0.042], n: 4, sq: 0.25, joint: J.spear, color: 'blade' },
  { c: spearAt(0.615), h: 0.20, r: [0.042, 0.003], n: 4, sq: 0.25, joint: J.spear, color: 'blade' },
];

// Hidden by a tiny scale, never 0: a zero-scaled skinned normal normalizes to NaN.
const HIDDEN = 0.02;
const FRAMES = 36;

// The javelin in the right fist at the world rotation aim, the butt slid down to the ground.
function plant(pose, aim) {
  const fist = worldOf(pose, J.spear).p, up = qrot(aim, [0, 1, 0]);
  return aimJoint(pose, 'spear', aim, GRIP + (-SINK - fist[1]) / up[1]);
}

const sc = (pose, s) => Object.assign(pose, { 'spear.scale': [s, s, s] });

// Attack key poses: right fist h*, javelin pitch (90 — level) and yaw, torso yaw ty and lean,
// lunge step, the left arm lx/flx (balance, then a pointing arm).
const GUARD = { u: 0, hx: -0.22, hy: 1.00, hz: 0.18, pitch: 75, yaw: 6, ty: -15, lean: 8, step: 0, hips: HIPS, lx: -35, flx: -30 };
const THROW = [
  GUARD,
  { u: 0.30, hx: -0.24, hy: 1.26, hz: -0.26, pitch: 62, yaw: 4, ty: -50, lean: -2, step: 0.25, hips: HIPS - 0.01, lx: -85, flx: -10 },
  { u: 0.50, hx: -0.20, hy: 1.34, hz: 0.38, pitch: 55, yaw: 2, ty: 10, lean: 20, step: 1, hips: HIPS - 0.04, lx: -20, flx: -40 },
  { u: 0.62, hx: -0.14, hy: 1.05, hz: 0.50, pitch: 45, yaw: 0, ty: 25, lean: 26, step: 1, hips: HIPS - 0.05, lx: 10, flx: -20 },
  { u: 0.85, hx: -0.26, hy: 1.26, hz: -0.14, pitch: 85, yaw: 0, ty: -20, lean: 6, step: 0.2, hips: HIPS - 0.01, lx: -30, flx: -30 },
  { ...GUARD, u: 1 },
];
// The javelin vanishes the frame it leaves the hand (0-19 draw and hurl, 20-30 the hand is empty)
// and a new one is in the fist when it comes back from the bundle (31).
const SHOWN = i => (i >= 20 && i <= 30 ? HIDDEN : 1);

const CLIPS = [
  // At ease: the javelin planted in the right hand, a nervous look around.
  loopClip('idle', 1.8, 12, (t) => {
    const pose = stoop(armAngles({ lz: 8, lx: -6 - 3 * Math.sin(t), flx: -20, rz: 0, rx: 0, frx: 0 }, grow(idleBody(t))), 7 + 2 * Math.sin(t));
    pose['head.rotation'] = rotY(14 * DEG * Math.sin(t));
    reach(pose, 'armR', 'foreR', [-0.27, 0.80 + 0.006 * Math.sin(t), 0.14], [-0.5, -0.5, -1], HAND);
    return plant(pose, qmul(rotZ(3 * DEG), rotX(-2 * DEG)));
  }),
  // Run: a quick scamper, the javelin slanted forward at the right side, the left arm pumping.
  loopClip('run', 0.5, 12, (t) => {
    const pose = stoop(armAngles({ lz: 10, lx: 28 * Math.sin(t), flx: -70, rz: 0, rx: 0, frx: 0 }, grow(runBody(t))), 6);
    reach(pose, 'armR', 'foreR', [-0.25, 0.85 + 0.03 * Math.abs(Math.sin(t)), 0.26], [-1, -0.6, -0.4], HAND);
    return aimJoint(pose, 'spear', qmul(rotY(8 * DEG), rotX((62 + 4 * Math.sin(2 * t)) * DEG)), 0);
  }),
  // Attack: guard -> draw back with the torso turned right -> hurl with a lunge -> follow through
  // -> reach behind for the next javelin -> guard.
  loopClip('attack', 0.9, FRAMES, (t) => {
    const i = Math.round(t / (2 * Math.PI) * FRAMES) % FRAMES;
    const p = tween(t / (2 * Math.PI), THROW);
    const pose = armAngles({ lz: 10, lx: p.lx, flx: p.flx, rz: 0, rx: 0, frx: 0 }, {
      'hips.translation': [0, p.hips, 0],
      'torso.rotation': qmul(rotY(p.ty * DEG), rotX(p.lean * DEG)),
      'head.rotation': qmul(rotY(-0.9 * p.ty * DEG), rotX(-0.8 * p.lean * DEG)),
      'legL.rotation': qmul(rotZ(5 * DEG), rotX(-26 * DEG * p.step)),
      'legR.rotation': qmul(rotZ(-5 * DEG), rotX(16 * DEG * p.step)),
      'shinL.rotation': rotX(20 * DEG * p.step),
      'shinR.rotation': rotX(8 * DEG * p.step),
    });
    reach(pose, 'armR', 'foreR', [p.hx, p.hy, p.hz], [-1, -0.6, -0.3], HAND);
    aimJoint(pose, 'spear', qmul(rotY(p.yaw * DEG), rotX(p.pitch * DEG)), 0);
    return sc(pose, SHOWN(i));
  }),
  // Death: the knees buckle, he falls on his back, the javelin stays along the body, its tip a few
  // degrees up.
  onceClip('death', 1.2, 12, (u) => {
    const { b, fall, pose: body } = deathBody(u);
    const pose = armAngles({ lz: 8 + 45 * fall, lx: -8, flx: -20 + 10 * fall, rz: -8 - 50 * fall, rx: -40 + 30 * b, frx: -50 + 30 * fall }, grow(body));
    return aimJoint(pose, 'spear', qmul(worldOf(pose, J.hips).q, rotX((-4 + 12 * fall) * DEG)), 0);
  }),
];

export default { name: 'goblin', joints: JOINTS, palette: PALETTE, parts: PARTS, clips: CLIPS, preview: 'idle@0.6,attack@0.3,attack@0.45' };
