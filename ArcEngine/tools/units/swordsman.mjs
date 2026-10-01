// Swordsman: a low-poly medieval foot soldier for a strategy game, 1.75 m tall (1.89 with the
// helmet): conical nasal helmet, beard, mail shirt under a team-blue tabard with a gold cross,
// team pauldrons, round shield in the left fist, arming sword in the right fist. Faces +Z
// (the glTF front). Clips: "idle", "run", "attack" (looped) and "death" (once, stays down);
// "ride" and "rideRun" (looped) seat him astride a horse: root at the saddle joint of horse.mjs
// (Model3D.mount), feet in its stirrups.
import { DEG, qmul, rig, rotX, rotY, rotZ, loopClip, onceClip, tween } from '../unit-glb.mjs';
import { B, BODY, FIST_L, FIST_R, SIDES, armAngles, deathBody, face, idleBody, limbs, runBody } from './humanoid.mjs';

const JOINTS = [
  ...BODY,
  { name: 'sword', at: FIST_R, parent: B.foreR },
  { name: 'shield', at: FIST_L, parent: B.foreL },   // centre grip in the left fist
];
const { J, worldOf, aimJoint, pointJoint } = rig(JOINTS);

// "team" and "teamDark" are the faction colours: recolour those two texels for another player.
const PALETTE = [
  { name: 'skin', hex: '#d9996b' },
  { name: 'hair', hex: '#6b4a2e' },
  { name: 'eye', hex: '#2b1d14' },
  { name: 'team', hex: '#2f5da8' },
  { name: 'teamDark', hex: '#22447d' },
  { name: 'trim', hex: '#e2b545' },
  { name: 'mail', hex: '#7d858d' },
  { name: 'steel', hex: '#aab2ba' },
  { name: 'blade', hex: '#d8dee3' },
  { name: 'leather', hex: '#6a4325' },
  { name: 'cloth', hex: '#4d4238' },
  { name: 'wood', hex: '#9b6b3c' },
];

const FIST = FIST_R;
// Disc centre just in front of the left fist: the boss covers the hand, the forearm stays behind
// the disc whatever the arm does (a forearm-strapped shield is pierced by the fist on a raised arm).
const SHIELD = [0.27, 0.85, 0.09];
const ALONG_FIST = rotX(90 * DEG);   // parts built along +Y, turned to point forward (+Z)
// The sword is also turned 90° about its own axis first: the edges face up and down in the bind
// pose, the crossguard stands vertical.
const SWORD_Q = qmul(ALONG_FIST, rotY(90 * DEG));
const sword = (d, part) => ({ ...part, c: [FIST[0], FIST[1] + d, FIST[2]], joint: J.sword, q: SWORD_Q, pivot: FIST });
const shield = (d, part) => ({ ...part, c: [SHIELD[0], SHIELD[1] + d, SHIELD[2]], joint: J.shield, q: ALONG_FIST, pivot: SHIELD });

const PARTS = [
  ...face(),
  // Beard, moustache, hair at the back.
  { c: [0, 1.515, 0.05], s: [0.25, 0.075, 0.16], joint: J.head, color: 'hair' },
  { c: [0, 1.558, 0.125], s: [0.13, 0.022, 0.03], joint: J.head, color: 'hair' },
  { c: [0, 1.57, -0.115], s: [0.25, 0.15, 0.03], joint: J.head, color: 'hair' },
  // Helmet: rim, dome, spike, nasal guard. Octagons, wide enough to hide the face box corners.
  { c: [0, 1.66, 0], h: 0.035, r: [0.20, 0.20], n: 8, joint: J.head, color: 'steel' },
  { c: [0, 1.735, 0], h: 0.115, r: [0.19, 0.15], n: 8, joint: J.head, color: 'steel' },
  { c: [0, 1.84, 0], h: 0.095, r: [0.15, 0.025], n: 8, joint: J.head, color: 'steel' },
  { c: [0, 1.605, 0.17], s: [0.035, 0.11, 0.02], joint: J.head, color: 'steel' },
  // Torso: mail shirt and collar, tabard front and back with a gold cross, belt and buckle.
  { c: [0, 1.20, 0], s: [0.40, 0.50, 0.22], joint: J.torso, color: 'mail' },
  { c: [0, 1.47, 0], s: [0.13, 0.06, 0.13], joint: J.torso, color: 'mail' },
  { c: [0, 1.16, 0.115], s: [0.30, 0.46, 0.02], joint: J.torso, color: 'team' },
  { c: [0, 1.16, -0.115], s: [0.30, 0.46, 0.02], joint: J.torso, color: 'team' },
  { c: [0, 1.19, 0.128], s: [0.05, 0.24, 0.006], joint: J.torso, color: 'trim' },
  ...SIDES.map(k => ({ c: [0.0525 * k, 1.23, 0.128], s: [0.055, 0.05, 0.006], joint: J.torso, color: 'trim' })),
  { c: [0, 0.975, 0], s: [0.42, 0.07, 0.26], joint: J.torso, color: 'leather' },
  { c: [0, 0.975, 0.133], s: [0.07, 0.05, 0.01], joint: J.torso, color: 'trim' },
  { c: [0, 0.87, 0], s: [0.38, 0.14, 0.22], joint: J.hips, color: 'mail' },
  ...limbs({ pauldron: 'teamDark', upper: 'mail', fore: 'leather', fist: 'leather', thigh: 'cloth', flap: 'team', shin: 'cloth', boot: 'leather' }),
  // Sword, bind pose pointing forward from the fist: grip, pommel, crossguard, blade, tip.
  sword(0, { h: 0.15, r: [0.02, 0.02], n: 6, color: 'leather' }),
  sword(-0.09, { s: [0.045, 0.04, 0.045], color: 'steel' }),
  sword(0.09, { s: [0.22, 0.035, 0.05], color: 'steel' }),
  sword(0.4075, { h: 0.60, r: [0.036, 0.03], n: 4, sq: 0.22, color: 'blade' }),
  sword(0.7675, { h: 0.12, r: [0.03, 0.004], n: 4, sq: 0.22, color: 'blade' }),
  // Round shield facing forward: wooden disc, painted face, gold stripe, steel boss.
  shield(0, { h: 0.04, r: [0.30, 0.30], n: 10, color: 'wood' }),
  shield(0.022, { h: 0.01, r: [0.27, 0.27], n: 10, color: 'team' }),
  shield(0.029, { s: [0.05, 0.008, 0.50], color: 'trim' }),
  shield(0.035, { h: 0.04, r: [0.08, 0.05], n: 8, color: 'steel' }),
];

// The sword points along the forearm at sx = +90°, straight forward from a hanging fist at 0°.
const arms = (p, pose) => Object.assign(armAngles(p, pose), { 'sword.rotation': rotX(p.sx * DEG) });
const SHIELD_AIM = rotY(-12 * DEG);   // facing forward, turned a little towards the body

// Seated astride: the hips just above the root (the saddle top), thighs forward and out, shins
// hanging along the flanks, the shield in front of the chest, the sword upright. lean — torso
// forward, bob — the hips' spring against the horse's gait.
const SEAT = 0.13;
const ride = (t, lean, bob) => {
  const pose = {
    'hips.translation': [0, SEAT + bob, 0],
    'torso.rotation': rotX((lean + 1.5 * Math.sin(t)) * DEG),
    'head.rotation': qmul(rotY(5 * DEG * Math.sin(t)), rotX(-0.7 * lean * DEG)),
  };
  for (const k of SIDES) {
    const side = k > 0 ? 'L' : 'R';
    pointJoint(pose, 'leg' + side, [0.65 * k, -0.35, 0.7]);
    pointJoint(pose, 'shin' + side, [0.12 * k, -1, -0.25]);
  }
  Object.assign(arms({ lz: 8, lx: -35 - lean, flx: -75, rz: -8, rx: -30 - lean, frx: -70, sx: -30 }, pose));
  return aimJoint(pose, 'shield', qmul(rotY(-15 * DEG), rotX(lean * DEG)));
};

const CLIPS = [
  // Low guard: sword tip down in front, shield by the left hip, a slow look around.
  loopClip('idle', 2.4, 12, t => aimJoint(arms({ lz: 8, lx: -10 - 2 * Math.sin(t), flx: -45, rz: -8, rx: -12 + 1.5 * Math.sin(t), frx: -40, sx: 75 }, idleBody(t)), 'shield', SHIELD_AIM)),
  // Run: shield up in front, the sword carried upright and swinging with the step.
  loopClip('run', 0.64, 16, t => aimJoint(arms({ lz: 10, lx: -20 + 6 * Math.sin(t), flx: -55, rz: -10, rx: -20 - 22 * Math.sin(t), frx: -60, sx: -25 }, runBody(t)),
    'shield', qmul(rotY(-15 * DEG), rotX(3 * DEG * Math.sin(2 * t))))),
  // Attack: guard -> wind-up over the shoulder -> diagonal cut with a step of the right foot ->
  // follow-through -> guard. Looped: a unit in melee plays it over and over.
  loopClip('attack', 0.9, 18, (t) => {
    const guard = { u: 0, rx: -20, rz: -10, frx: -55, sx: 20, ty: 0, tx: 4, hy: 0.90, step: 0 };
    const p = tween(t / (2 * Math.PI), [
      guard,
      { u: 0.4, rx: -165, rz: -25, frx: -75, sx: 0, ty: -25, tx: -6, hy: 0.90, step: 0 },
      { u: 0.58, rx: -45, rz: -5, frx: -8, sx: 80, ty: 22, tx: 14, hy: 0.88, step: 1 },
      { u: 0.75, rx: -35, rz: -5, frx: -10, sx: 85, ty: 18, tx: 12, hy: 0.88, step: 1 },
      { ...guard, u: 1 },
    ]);
    return aimJoint(arms({ lz: 10, lx: -20, flx: -55, rz: p.rz, rx: p.rx, frx: p.frx, sx: p.sx }, {
      'hips.translation': [0, p.hy, 0],
      'torso.rotation': qmul(rotY(p.ty * DEG), rotX(p.tx * DEG)),
      'head.rotation': rotY(-0.7 * p.ty * DEG),
      'legL.rotation': rotX(12 * DEG * p.step),
      'legR.rotation': rotX(-18 * DEG * p.step),
      'shinL.rotation': rotX(0),
      'shinR.rotation': rotX(20 * DEG * p.step),
    }), 'shield', qmul(rotY((-18 - 8 * p.step) * DEG), rotX(-4 * DEG)));
  }),
  // Death: the knees buckle, then he falls on his back and stays there (play with loop: false).
  onceClip('death', 1.3, 13, (u) => {
    const { b, fall, pose: body } = deathBody(u);
    const pose = arms({ lz: 8 + 45 * fall, lx: -10, flx: -45 + 20 * fall, rz: -8 - 50 * fall, rx: -12 + 10 * b, frx: -40 + 30 * fall, sx: 75 + 15 * fall }, body);
    return aimJoint(pose, 'shield', qmul(worldOf(pose, J.hips).q, SHIELD_AIM));
  }),
  loopClip('ride', 2.4, 12, t => ride(t, 2, 0.003 * Math.sin(t))),
  loopClip('rideRun', 0.64, 16, t => ride(t, 14, 0.012 * Math.sin(2 * t))),
];

export default { name: 'swordsman', joints: JOINTS, palette: PALETTE, parts: PARTS, clips: CLIPS, preview: 'idle@0.6,attack@0.52' };
