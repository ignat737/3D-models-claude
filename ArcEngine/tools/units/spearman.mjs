// Spearman: a low-poly foot soldier with a 2.6 m spear, 1.75 m tall (1.89 with the kettle hat):
// team-coloured quilted gambeson, full beard, the spear two-handed. Faces +Z (the glTF front).
// Clips: "idle" (butt on the ground), "run" (spear slanted forward in both hands), "attack"
// (looped thrust with a step) and "death" (once, stays down).
import { DEG, add, loopClip, onceClip, qmul, qrot, rig, rotX, rotY, rotZ, tween } from '../unit-glb.mjs';
import { B, BODY, FIST_R, HAND, armAngles, deathBody, face, idleBody, limbs, runBody } from './humanoid.mjs';

const GRIP = 0.80;      // butt -> right fist along the shaft (bind pose: the spear upright)
const SPACING = 0.30;   // right fist -> left fist along the shaft: the left arm must reach across
const SINK = 0.02;      // a planted butt goes this deep: the ground under it may slope away
const JOINTS = [...BODY, { name: 'spear', at: FIST_R, parent: B.foreR }];
const { J, worldOf, aimJoint, reach } = rig(JOINTS);

// "team" and "teamDark" are the faction colours: recolour those two texels for another player.
const PALETTE = [
  { name: 'skin', hex: '#d9996b' },
  { name: 'hair', hex: '#3b2a1e' },
  { name: 'eye', hex: '#2b1d14' },
  { name: 'team', hex: '#2f5da8' },
  { name: 'teamDark', hex: '#22447d' },
  { name: 'trim', hex: '#e2b545' },
  { name: 'gambeson', hex: '#cdb88f' },
  { name: 'steel', hex: '#9aa3ab' },
  { name: 'blade', hex: '#d8dee3' },
  { name: 'leather', hex: '#6a4325' },
  { name: 'cloth', hex: '#4d4238' },
  { name: 'wood', hex: '#9b6b3c' },
];

const spearAt = y => add(FIST_R, [0, y, 0]);

const PARTS = [
  ...face(),
  // Full beard, moustache, hair at the back.
  { c: [0, 1.515, 0.05], s: [0.25, 0.08, 0.16], joint: B.head, color: 'hair' },
  { c: [0, 1.558, 0.125], s: [0.14, 0.022, 0.03], joint: B.head, color: 'hair' },
  { c: [0, 1.60, -0.115], s: [0.25, 0.16, 0.03], joint: B.head, color: 'hair' },
  // Kettle hat: wide brim, dome, leather band, top.
  { c: [0, 1.705, 0], h: 0.025, r: [0.27, 0.25], n: 10, joint: B.head, color: 'steel' },
  { c: [0, 1.78, 0], h: 0.13, r: [0.175, 0.115], n: 8, joint: B.head, color: 'steel' },
  { c: [0, 1.732, 0], h: 0.03, r: [0.182, 0.18], n: 8, joint: B.head, color: 'leather' },
  { c: [0, 1.865, 0], h: 0.04, r: [0.115, 0.04], n: 8, joint: B.head, color: 'steel' },
  // Gambeson with quilting seams front and back, collar, belt and buckle.
  { c: [0, 1.20, 0], s: [0.41, 0.50, 0.23], joint: B.torso, color: 'team' },
  { c: [0, 1.47, 0], s: [0.17, 0.07, 0.17], joint: B.torso, color: 'gambeson' },
  ...[1.08, 1.20, 1.32].flatMap(y => [0.117, -0.117].map(z => ({ c: [0, y, z], s: [0.37, 0.018, 0.006], joint: B.torso, color: 'teamDark' }))),
  { c: [0, 0.975, 0], s: [0.43, 0.07, 0.25], joint: B.torso, color: 'leather' },
  { c: [0, 0.975, 0.128], s: [0.07, 0.05, 0.01], joint: B.torso, color: 'trim' },
  { c: [0, 0.87, 0], s: [0.38, 0.14, 0.22], joint: B.hips, color: 'team' },
  ...limbs({ upper: 'team', fore: 'gambeson', fist: 'leather', thigh: 'cloth', flap: 'team', shin: 'cloth', boot: 'leather' }),
  // Spear, bind pose upright through the right fist: butt cap, shaft, team ribbon, socket, blade.
  { c: spearAt(-GRIP + 0.03), h: 0.06, r: [0.026, 0.026], n: 6, joint: J.spear, color: 'steel' },
  { c: spearAt(-GRIP + 1.13), h: 2.14, r: [0.022, 0.019], n: 6, joint: J.spear, color: 'wood' },
  { c: spearAt(1.36), s: [0.05, 0.06, 0.05], joint: J.spear, color: 'team' },
  { c: spearAt(1.44), h: 0.08, r: [0.024, 0.028], n: 6, joint: J.spear, color: 'steel' },
  { c: spearAt(1.51), h: 0.06, r: [0.02, 0.05], n: 4, sq: 0.25, joint: J.spear, color: 'blade' },
  { c: spearAt(1.66), h: 0.24, r: [0.05, 0.003], n: 4, sq: 0.25, joint: J.spear, color: 'blade' },
];

// The spear in the right fist at the world rotation aim, the butt slid down to the ground.
function plant(pose, aim) {
  const fist = worldOf(pose, J.spear).p, up = qrot(aim, [0, 1, 0]);
  return aimJoint(pose, 'spear', aim, GRIP + (-SINK - fist[1]) / up[1]);
}

// Both hands on the shaft: the right fist at fist (model space), the spear at aim, the left fist
// SPACING further along the shaft.
function bothHands(pose, fist, aim) {
  reach(pose, 'armR', 'foreR', fist, [-1, -0.6, -0.4], HAND);
  aimJoint(pose, 'spear', aim, 0);
  reach(pose, 'armL', 'foreL', add(worldOf(pose, J.spear).p, qrot(aim, [0, SPACING, 0])), [1, -0.8, 0.2], HAND);
  return pose;
}

// The spear is held at the right side, the rear fist OUTSIDE the torso box (half-width 0.205 m
// plus the shaft): a fist in front of the belly puts the shaft through the chest. The torso turns
// right (ty < 0) so the left hand reaches the shaft, which points forward and inward (ac).
// Poses found by a search: shaft >= 1 cm clear of the body boxes, both fists on the shaft.
const GUARD = { u: 0, ty: -30, ac: 20, lean: 4, hx: -0.30, hy: 1.04, hz: 0.0, pitch: 86, step: 0.3, hips: 0.88 };

const CLIPS = [
  // At ease: the spear upright in the right hand, butt on the ground, the left arm relaxed.
  loopClip('idle', 2.4, 12, (t) => {
    const pose = armAngles({ lz: 8, lx: -8 - 2 * Math.sin(t), flx: -20, rz: 0, rx: 0, frx: 0 }, idleBody(t));
    reach(pose, 'armR', 'foreR', [-0.30, 1.08 + 0.006 * Math.sin(t), 0.16], [-0.5, -0.5, -1], HAND);
    return plant(pose, qmul(rotZ(4 * DEG), rotX(-2 * DEG)));
  }),
  // Run: the spear slanted forward and up at the right side, in both hands, torso turned right.
  loopClip('run', 0.64, 16, t => bothHands({ ...runBody(t), 'torso.rotation': qmul(rotY(-20 * DEG), rotX(9 * DEG)) },
    [-0.30, 0.98 + 0.035 * Math.abs(Math.sin(t)), 0.0], qmul(rotY(10 * DEG), rotX((55 + 3 * Math.sin(2 * t)) * DEG)))),
  // Attack: guard (spear level at the hip) -> draw back -> thrust with a lunge -> hold -> guard.
  loopClip('attack', 1.0, 20, (t) => {
    const p = tween(t / (2 * Math.PI), [
      GUARD,
      { u: 0.35, ty: -40, ac: 20, lean: -4, hx: -0.30, hy: 1.04, hz: -0.10, pitch: 88, step: 0.3, hips: 0.89 },
      { u: 0.5, ty: -20, ac: 20, lean: 14, hx: -0.22, hy: 1.04, hz: 0.25, pitch: 84, step: 1, hips: 0.85 },
      { u: 0.62, ty: -20, ac: 20, lean: 12, hx: -0.22, hy: 1.04, hz: 0.24, pitch: 84, step: 1, hips: 0.85 },
      { ...GUARD, u: 1 },
    ]);
    return bothHands({
      'hips.translation': [0, p.hips, 0],
      'torso.rotation': qmul(rotY(p.ty * DEG), rotX(p.lean * DEG)),
      'head.rotation': qmul(rotY(-0.9 * p.ty * DEG), rotX(-0.8 * p.lean * DEG)),
      'legL.rotation': qmul(rotZ(5 * DEG), rotX(-22 * DEG * p.step)),
      'legR.rotation': qmul(rotZ(-5 * DEG), rotX(14 * DEG * p.step)),
      'shinL.rotation': rotX(18 * DEG * p.step),
      'shinR.rotation': rotX(8 * DEG * p.step),
    }, [p.hx, p.hy, p.hz], qmul(rotY(p.ac * DEG), rotX(p.pitch * DEG)));
  }),
  // Death: the knees buckle, he falls on his back, the spear stays along the body, its tip a few
  // degrees up: flat along the model, a 2.6 m spear sinks into any rise of the ground.
  onceClip('death', 1.3, 13, (u) => {
    const { b, fall, pose: body } = deathBody(u);
    const pose = armAngles({ lz: 8 + 45 * fall, lx: -8, flx: -20 + 10 * fall, rz: -8 - 50 * fall, rx: -40 + 30 * b, frx: -50 + 30 * fall }, body);
    return aimJoint(pose, 'spear', qmul(worldOf(pose, J.hips).q, rotX((-4 + 12 * fall) * DEG)), 0);
  }),
];

export default { name: 'spearman', joints: JOINTS, palette: PALETTE, parts: PARTS, clips: CLIPS, preview: 'idle@0.6,attack@0.5' };
