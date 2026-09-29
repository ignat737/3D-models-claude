// Archer: a low-poly longbowman, 1.75 m tall (1.82 with the hood): team hood and mantle, olive
// tunic, quiver on the back, a longbow in the left fist whose string follows the drawing hand.
// Faces +Z (the glTF front). Clips: "idle", "run", "attack" (looped: an arrow from the quiver,
// nock, draw to the cheek, loose) and "death" (once, stays down).
import { DEG, add, fromTo, lerp, loopClip, norm, onceClip, qmul, qrot, rig, rotX, rotY, rotZ, sub, tween } from '../unit-glb.mjs';
import { B, BODY, FIST_L, FIST_R, HAND, SIDES, armAngles, deathBody, face, idleBody, limbs, runBody } from './humanoid.mjs';

const NOCK_Z = -0.12;   // brace height: the string runs this far behind the grip
const JOINTS = [
  ...BODY,
  { name: 'bow', at: FIST_L, parent: B.foreL },
  { name: 'nock', at: add(FIST_L, [0, 0, NOCK_Z]), parent: BODY.length },   // middle of the string
  { name: 'arrow', at: FIST_R, parent: B.foreR },
];
const { J, worldOf, aimJoint, reach, placeJoint } = rig(JOINTS);

// "team" and "teamDark" are the faction colours: recolour those two texels for another player.
const PALETTE = [
  { name: 'skin', hex: '#d9996b' },
  { name: 'hair', hex: '#8a5a32' },
  { name: 'eye', hex: '#2b1d14' },
  { name: 'team', hex: '#2f5da8' },
  { name: 'teamDark', hex: '#22447d' },
  { name: 'trim', hex: '#e2b545' },
  { name: 'tunic', hex: '#6f6b3c' },
  { name: 'leather', hex: '#6a4325' },
  { name: 'cloth', hex: '#4d4238' },
  { name: 'wood', hex: '#9a6433' },
  { name: 'string', hex: '#ece5cf' },
  { name: 'steel', hex: '#aab2ba' },
  { name: 'feather', hex: '#f3efe4' },
];

// A box from point a to point b (a bow limb, a strap); d also pads the length to close the joints.
const beam = (a, b, w, d, color, joint) => ({ c: lerp(a, b, 0.5), s: [w, Math.hypot(...sub(b, a)) + d, d], q: fromTo([0, 1, 0], sub(b, a)), joint, color });
const bowAt = (y, z) => add(FIST_L, [0, y, z]);
const arrowAt = y => add(FIST_R, [0, y, 0]);
const QUIVER = [0.03, 1.22, -0.16], QUIVER_Q = rotZ(22 * DEG);   // top over the right shoulder
const quiver = (d, part) => ({ ...part, c: add(QUIVER, d), joint: B.torso, q: QUIVER_Q, pivot: QUIVER });

const PARTS = [
  ...face(),
  // Chin beard, moustache, a fringe under the hood.
  { c: [0, 1.515, 0.09], s: [0.17, 0.05, 0.08], joint: B.head, color: 'hair' },
  { c: [0, 1.556, 0.125], s: [0.11, 0.02, 0.025], joint: B.head, color: 'hair' },
  { c: [0, 1.688, 0.112], s: [0.22, 0.035, 0.03], joint: B.head, color: 'hair' },
  // Hood: crown (an octagon covering the head box corners), sides, back, brim; mantle on the shoulders.
  { c: [0, 1.765, -0.005], h: 0.11, r: [0.185, 0.10], n: 8, joint: B.head, color: 'team' },
  ...SIDES.map(k => ({ c: [0.135 * k, 1.61, -0.015], s: [0.035, 0.22, 0.25], joint: B.head, color: 'team' })),
  { c: [0, 1.60, -0.135], s: [0.30, 0.26, 0.035], joint: B.head, color: 'team' },
  { c: [0, 1.712, 0.118], s: [0.30, 0.045, 0.035], joint: B.head, color: 'teamDark' },
  { c: [0, 1.435, 0], s: [0.46, 0.08, 0.27], joint: B.torso, color: 'team' },
  ...[0.125, -0.125].map(z => ({ c: [0, 1.37, z], s: [0.20, 0.08, 0.025], joint: B.torso, color: 'team' })),
  // Tunic, belt with buckle, pouch, the quiver strap across the chest.
  { c: [0, 1.20, 0], s: [0.38, 0.50, 0.21], joint: B.torso, color: 'tunic' },
  { c: [0, 0.975, 0], s: [0.40, 0.07, 0.24], joint: B.torso, color: 'leather' },
  { c: [0, 0.975, 0.123], s: [0.06, 0.05, 0.01], joint: B.torso, color: 'trim' },
  { c: [-0.15, 0.915, 0.10], s: [0.09, 0.10, 0.06], joint: B.torso, color: 'leather' },
  beam([0.17, 0.98, 0.112], [-0.19, 1.40, 0.112], 0.045, 0.012, 'leather', B.torso),
  { c: [0, 0.87, 0], s: [0.36, 0.14, 0.21], joint: B.hips, color: 'cloth' },
  // Quiver: body, rim, fletchings sticking out.
  quiver([0, 0, 0], { h: 0.50, r: [0.05, 0.065], n: 6, color: 'leather' }),
  quiver([0, 0.245, 0], { h: 0.03, r: [0.07, 0.07], n: 6, color: 'teamDark' }),
  ...[[-0.025, 0], [0.025, 0.01], [0, -0.025]].map(([dx, dz], i) => quiver([dx, 0.29, dz], { s: [0.03, 0.07, 0.03], color: i === 2 ? 'team' : 'feather' })),
  ...limbs({ upper: 'tunic', fore: 'leather', fist: 'skin', thigh: 'cloth', flap: 'tunic', shin: 'cloth', boot: 'leather' }),
  // Longbow: leather grip, limbs of two segments bending away from the string, the string in two
  // spans meeting at the nock joint — it stretches when the nock follows the drawing hand.
  { c: FIST_L, s: [0.04, 0.16, 0.05], joint: J.bow, color: 'leather' },
  ...[1, -1].flatMap(k => [
    beam(bowAt(0.06 * k, 0), bowAt(0.34 * k, -0.03), 0.032, 0.04, 'wood', J.bow),
    beam(bowAt(0.34 * k, -0.03), bowAt(0.62 * k, NOCK_Z), 0.026, 0.032, 'wood', J.bow),
  ]),
  { span: [bowAt(0.62, NOCK_Z), bowAt(0, NOCK_Z)], joints: [J.bow, J.nock], w: 0.008, color: 'string' },
  { span: [bowAt(0, NOCK_Z), bowAt(-0.62, NOCK_Z)], joints: [J.nock, J.bow], w: 0.008, color: 'string' },
  // Arrow, built along +Y from its nock in the right fist: shaft, head, crossed fletching.
  { c: arrowAt(0.34), h: 0.64, r: [0.008, 0.008], n: 4, joint: J.arrow, color: 'wood' },
  { c: arrowAt(0.695), h: 0.07, r: [0.02, 0.002], n: 4, joint: J.arrow, color: 'steel' },
  { c: arrowAt(0.09), s: [0.045, 0.10, 0.004], joint: J.arrow, color: 'feather' },
  { c: arrowAt(0.09), s: [0.004, 0.10, 0.045], joint: J.arrow, color: 'feather' },
];

// The arrow is hidden by a tiny scale, never 0: a zero-scaled skinned normal normalizes to NaN,
// and the HDR pipeline spreads one NaN over the whole frame.
const HIDDEN = [0.02, 0.02, 0.02];
const BOW_DOWN = rotX(18 * DEG);                         // bow at the side, top tilted forward
const ARROW_DOWN = fromTo([0, 1, 0], [0, -1, 0.3]);
const ARROW_UP = norm([0.1, 1, -0.2]);                   // just pulled out of the quiver
const DRAW = [-0.16, 1.54, 0.05];                        // anchor: the fist at the right cheek
const withArrow = (pose, aim, scale) => {
  aimJoint(pose, 'arrow', aim);
  pose['arrow.scale'] = scale;
  return pose;
};

// Attack key poses: torso yaw ty, left fist (the bow grip) l*, bow pitch bp, right fist key h*;
// atNock pulls the right fist to the string's rest point, draw — how much the string follows
// the right fist, arrow — its scale, onBow — the arrow turns from "up" to "along the bow".
const READY = { u: 0, ty: -15, lx: 0.16, ly: 1.18, lz: 0.40, bp: 40, hx: -0.12, hy: 1.12, hz: 0.22, atNock: 0, draw: 0, arrow: 0.02, onBow: 0 };
// Nocking happens with the bow still close: the right hand must reach the string at rest.
const NOCKED = { u: 0.40, ty: -30, lx: 0.02, ly: 1.38, lz: 0.42, bp: 5, hx: 0.02, hy: 1.38, hz: 0.30, atNock: 1, draw: 0, arrow: 1, onBow: 1 };
const FULL = { u: 0.64, ty: -40, lx: -0.06, ly: 1.50, lz: 0.60, bp: 0, hx: DRAW[0], hy: DRAW[1], hz: DRAW[2], atNock: 0, draw: 1, arrow: 1, onBow: 1 };

const CLIPS = [
  // Bow down at the left side, the right hand free, a slow look around.
  loopClip('idle', 2.4, 12, t => withArrow(aimJoint(armAngles({ lz: 8, lx: -14 - 2 * Math.sin(t), flx: -30, rz: -7, rx: -6 + 1.5 * Math.sin(t), frx: -18 }, idleBody(t)),
    'bow', BOW_DOWN), ARROW_DOWN, HIDDEN)),
  // Run: the bow swings with the left arm, the right arm pumps.
  loopClip('run', 0.64, 16, t => withArrow(aimJoint(armAngles({ lz: 10, lx: -12 + 22 * Math.sin(t), flx: -50, rz: -10, rx: -12 - 28 * Math.sin(t), frx: -55 }, runBody(t)),
    'bow', rotX((22 + 6 * Math.sin(t)) * DEG)), ARROW_DOWN, HIDDEN)),
  // Attack: ready -> hand to the quiver -> arrow out -> nock -> draw to the cheek -> hold ->
  // loose (the arrow vanishes, the string snaps back) -> ready. Looped while shooting.
  loopClip('attack', 1.5, 30, (t) => {
    const p = tween(t / (2 * Math.PI), [
      READY,
      { ...READY, u: 0.16, ty: -10, ly: 1.20, bp: 35, hx: -0.14, hy: 1.58, hz: -0.20 },
      { ...READY, u: 0.22, ty: -10, ly: 1.20, bp: 35, hx: -0.14, hy: 1.62, hz: -0.16, arrow: 1 },
      NOCKED,
      { ...NOCKED, u: 0.45, draw: 1 },
      FULL,
      { ...FULL, u: 0.72 },
      { ...FULL, u: 0.75, hx: -0.20, hy: 1.56, hz: -0.03, draw: 0, arrow: 0.02 },
      { ...READY, u: 1 },
    ]);
    const pose = {
      'hips.translation': [0, 0.89, 0],
      'torso.rotation': rotY(p.ty * DEG),
      'head.rotation': rotY(-0.95 * p.ty * DEG),
      'legL.rotation': qmul(rotZ(6 * DEG), rotX(-10 * DEG)),
      'legR.rotation': qmul(rotZ(-6 * DEG), rotX(8 * DEG)),
    };
    reach(pose, 'armL', 'foreL', [p.lx, p.ly, p.lz], [1, -0.6, -0.2], HAND);
    const bowAim = qmul(rotX(p.bp * DEG), rotZ(6 * DEG));
    aimJoint(pose, 'bow', bowAim);
    const grip = worldOf(pose, J.bow).p, rest = add(grip, qrot(bowAim, [0, 0, NOCK_Z]));
    reach(pose, 'armR', 'foreR', lerp([p.hx, p.hy, p.hz], rest, p.atNock), [-1, 0.1, -0.8], HAND);
    const fist = worldOf(pose, J.arrow).p;
    placeJoint(pose, 'nock', lerp(rest, fist, p.draw));
    return withArrow(pose, fromTo([0, 1, 0], lerp(ARROW_UP, norm(sub(grip, fist)), p.onBow)), [p.arrow, p.arrow, p.arrow]);
  }),
  // Death: the knees buckle, then he falls on his back and stays there (play with loop: false).
  onceClip('death', 1.3, 13, (u) => {
    const { b, fall, pose: body } = deathBody(u);
    const pose = armAngles({ lz: 8 + 45 * fall, lx: -14, flx: -30 + 10 * fall, rz: -7 - 50 * fall, rx: -6 + 10 * b, frx: -18 + 10 * fall }, body);
    aimJoint(pose, 'bow', qmul(worldOf(pose, J.hips).q, rotX((18 - 22 * fall) * DEG)));   // ends along the body
    return withArrow(pose, ARROW_DOWN, HIDDEN);
  }),
];

export default { name: 'archer', joints: JOINTS, palette: PALETTE, parts: PARTS, clips: CLIPS, preview: 'idle@0.6,attack@1.0' };
