// Archer: a low-poly longbowman, 1.75 m tall (1.82 with the hood): team hood and mantle, olive
// tunic, quiver on the back, a longbow in the left fist whose string follows the drawing hand.
// Faces +Z (the glTF front). Clips: "idle", "run", "attack" (looped: an arrow from the quiver,
// nock, draw to the cheek, loose) and "death" (once, stays down).
import { DEG, add, dot, fromTo, lerp, loopClip, norm, onceClip, qconj, qmul, qrot, rig, rotX, rotY, rotZ, sub, tween } from '../unit-glb.mjs';
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
  ...[[-0.025, 0], [0.025, 0.01], [0, -0.025]].map(([dx, dz]) => quiver([dx, 0.29, dz], { s: [0.03, 0.07, 0.03], color: 'feather' })),
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
const ARROW_IN_QUIVER = qrot(QUIVER_Q, [0, -1, 0]);     // point down the quiver, feathers at the fist
const ARROW_BACK = [0, 0, -1];                        // turn in the vertical plane behind the head
const ARROW_UP = [0, 1, 0];                           // point upwards after leaving the quiver
const ARROW_FORWARD = [0, 0, 1];                       // swing forward outside the hood
const DRAW = [-0.23, 1.54, 0.08];                        // anchor: the fist outside the hood at the right cheek
const withArrow = (pose, aim, scale, slide) => {
  aimJoint(pose, 'arrow', aim, slide);
  pose['arrow.scale'] = scale;
  return pose;
};

// Keep the elbow a hinge: the generic IK's shortest rotations can roll the forearm when
// the upper arm points up. Align the upper arm's roll with the bend plane, then flex only X.
const reachDrawingHand = (pose, target, pole) => {
  reach(pose, 'armR', 'foreR', target, pole, HAND);
  const shoulder = worldOf(pose, J.armR).p, elbow = worldOf(pose, J.foreR).p;
  const upper = norm(sub(elbow, shoulder)), fore = norm(sub(worldOf(pose, J.arrow).p, elbow));
  const aim = fromTo([0, -1, 0], upper), localFore = qrot(qconj(aim), fore);
  aimJoint(pose, 'armR', qmul(aim, rotY(Math.atan2(localFore[0], localFore[2]))));
  pose['foreR.rotation'] = rotX(-Math.acos(Math.max(-1, Math.min(1, dot(upper, fore)))));
};

// Attack key poses: torso yaw ty, left fist (the bow grip) l*, bow pitch bp, right fist key h*,
// elbow pole e*. Raise the elbow with the hand instead of keeping it behind the waist.
// atNock pulls the right fist to the string's rest point, draw — how much the string follows
// the right fist, arrow — its scale. raise/forward/onBow turn the arrow in stages: down the
// quiver -> upwards through the space behind the head -> forward beside the head -> along the bow. slide
// puts the fist below the fletching while retrieving, then at the nock for shooting.
const READY = { u: 0, ty: -15, lx: 0.16, ly: 1.18, lz: 0.40, bp: 40, hx: -0.12, hy: 1.12, hz: 0.22, ex: -1, ey: 0.1, ez: -0.8, atNock: 0, draw: 0, arrow: 0.02, raise: 0, forward: 0, onBow: 0, slide: 0 };
// Hold the torso and bow still during retrieval. Reuse these poses in reverse so both the
// hand and elbow retrace their path, with the fist clearing the hood before reaching back.
const LIFT = { ...READY, hx: -0.40, hy: 1.65, hz: 0.22, ey: 0.8, ez: -0.2 };
const OVERHEAD = { ...READY, hx: -0.28, hy: 1.87, hz: -0.04, ey: 1, ez: -0.2 };
const BEHIND = { ...OVERHEAD, hx: -0.14, hy: 1.76, hz: -0.30 };
const GRAB = { ...BEHIND, hx: -0.04, hy: 1.50, hz: -0.23 };
// Nocking happens with the bow still close: the right hand must reach the string at rest.
const NOCKED = { ...READY, u: 0.64, ty: -30, lx: 0.02, ly: 1.38, lz: 0.42, bp: 5, hx: 0.02, hy: 1.38, hz: 0.30, atNock: 1, arrow: 1, onBow: 1 };
const FULL = { ...NOCKED, u: 0.80, ty: -40, lx: -0.06, ly: 1.50, lz: 0.60, bp: 0, hx: DRAW[0], hy: DRAW[1], hz: DRAW[2], atNock: 0, draw: 1 };

const CLIPS = [
  // Bow down at the left side, the right hand free, a slow look around.
  loopClip('idle', 2.4, 12, t => withArrow(aimJoint(armAngles({ lz: 8, lx: -14 - 2 * Math.sin(t), flx: -30, rz: -7, rx: -6 + 1.5 * Math.sin(t), frx: -18 }, idleBody(t)),
    'bow', BOW_DOWN), ARROW_DOWN, HIDDEN)),
  // Run: the bow swings with the left arm, the right arm pumps.
  loopClip('run', 0.64, 16, t => withArrow(aimJoint(armAngles({ lz: 10, lx: -12 + 22 * Math.sin(t), flx: -50, rz: -10, rx: -12 - 28 * Math.sin(t), frx: -55 }, runBody(t)),
    'bow', rotX((22 + 6 * Math.sin(t)) * DEG)), ARROW_DOWN, HIDDEN)),
  // Attack: ready -> hand to the quiver -> arrow out -> nock -> draw to the cheek -> hold ->
  // loose (the arrow vanishes, the string snaps back) -> ready. Looped while shooting.
  loopClip('attack', 1.5, 60, (t) => {
    const p = tween(t / (2 * Math.PI), [
      READY,
      { ...LIFT, u: 5 / 60 },
      { ...OVERHEAD, u: 10 / 60 },
      { ...BEHIND, u: 13 / 60 },
      { ...GRAB, u: 16 / 60, slide: -0.19 },
      { ...GRAB, u: 18 / 60, arrow: 1, slide: -0.19 },
      { ...BEHIND, u: 21 / 60, arrow: 1, raise: 1 },
      { ...OVERHEAD, u: 24 / 60, arrow: 1, raise: 1 },
      { ...LIFT, u: 29 / 60, arrow: 1, raise: 1, forward: 1 },
      { ...READY, u: 34 / 60, arrow: 1, raise: 1, forward: 1, onBow: 1 },
      NOCKED,
      { ...NOCKED, u: 0.66, draw: 1 },
      FULL,
      { ...FULL, u: 0.84 },
      { ...FULL, u: 0.86, hx: -0.20, hy: 1.56, hz: -0.03, draw: 0, arrow: 0.02 },
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
    reachDrawingHand(pose, lerp([p.hx, p.hy, p.hz], rest, p.atNock), [p.ex, p.ey, p.ez]);
    const fist = worldOf(pose, J.arrow).p;
    placeJoint(pose, 'nock', lerp(rest, fist, p.draw));
    const inQuiver = qrot(worldOf(pose, J.torso).q, ARROW_IN_QUIVER);
    // A vertical arc behind the hood: going directly from down to up would swing sideways
    // along the quiver's tilt, or pass through a zero direction at the halfway point.
    const raised = p.raise < 0.5
      ? norm(lerp(inQuiver, ARROW_BACK, p.raise * 2))
      : norm(lerp(ARROW_BACK, ARROW_UP, p.raise * 2 - 1));
    const forward = norm(lerp(raised, ARROW_FORWARD, p.forward));
    // Bring the nock towards the fist before the backward arc so the feathers stay clear
    // of the back of the hood while the arrow pivots upwards.
    const slide = p.slide * (1 - p.raise) ** 2;
    return withArrow(pose, fromTo([0, 1, 0], lerp(forward, norm(sub(grip, fist)), p.onBow)), [p.arrow, p.arrow, p.arrow], slide);
  }),
  // Death: the knees buckle, then he falls on his back and stays there (play with loop: false).
  onceClip('death', 1.3, 13, (u) => {
    const { b, fall, pose: body } = deathBody(u);
    const pose = armAngles({ lz: 8 + 45 * fall, lx: -14, flx: -30 + 10 * fall, rz: -7 - 50 * fall, rx: -6 + 10 * b, frx: -18 + 10 * fall }, body);
    aimJoint(pose, 'bow', qmul(worldOf(pose, J.hips).q, rotX((18 - 22 * fall) * DEG)));   // ends along the body
    return withArrow(pose, ARROW_DOWN, HIDDEN);
  }),
];

export default { name: 'archer', joints: JOINTS, palette: PALETTE, parts: PARTS, clips: CLIPS, preview: 'idle@0.6,attack@1.2' };
