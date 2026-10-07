// Swordsman: a low-poly medieval foot soldier for a strategy game, 1.75 m tall (1.89 with the
// helmet): conical nasal helmet, beard, mail shirt under a team-blue tabard with a gold cross,
// team pauldrons, round shield in the left fist, arming sword in the right fist. Faces +Z
// (the glTF front). Clips: "idle", "run", "attack" (looped) and "death" (once, stays down);
// the mounted set seats him astride a horse: root at the saddle joint of horse.mjs
// (Model3D.mount), feet in its stirrups. "ride", "rideRun", "rideAttack", "rideRunAttack" (looped)
// and "rideDeath" (once) pair with the horse's idle, run, attack, runAttack and death — same length.
import { DEG, add, lerp, qconj, qmul, qrot, rig, rotX, rotY, rotZ, sub, loopClip, onceClip, tween } from '../unit-glb.mjs';
import { deathPose as horseDeath, saddleFrame } from './horse.mjs';
import { B, BODY, FIST_L, FIST_R, HAND, SIDES, armAngles, deathBody, face, idleBody, limbs, runBody } from './humanoid.mjs';

const JOINTS = [
  ...BODY,
  { name: 'sword', at: FIST_R, parent: B.foreR },
  { name: 'shield', at: FIST_L, parent: B.foreL },   // centre grip in the left fist
];
const { J, worldOf, aimJoint, pointJoint, reach } = rig(JOINTS);

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
// hanging along the flanks, the shield in front of the chest, the sword upright.
const SEAT = 0.13;
const SEATED = { lz: 8, lx: -37, flx: -75, rz: -8, rx: -32, frx: -70, sx: -30 };
const DEAD_ARMS = { lz: 55, lx: -10, flx: -25, rz: -58, rx: -2, frx: -10, sx: 90 };
const mix = (a, b, k) => Object.fromEntries(Object.keys(a).map(key => [key, a[key] + (b[key] - a[key]) * k]));
const nlerp = (a, b, k) => {
  const sign = a[0] * b[0] + a[1] * b[1] + a[2] * b[2] + a[3] * b[3] < 0 ? -1 : 1, q = lerp(a, b.map(v => v * sign), k);
  return q.map(v => v / Math.hypot(...q));
};
const smooth = x => { const k = Math.min(1, Math.max(0, x)); return k * k * (3 - 2 * k); };

// o: lean (torso forward, deg), ty (torso turn), bob (hips spring), arm — the arm angles.
const ride = (t, o) => {
  const lean = o.lean + (o.sway === undefined ? 1.5 : o.sway) * Math.sin(t);
  const pose = {
    'hips.translation': [0, SEAT + (o.bob || 0), 0],
    'torso.rotation': qmul(rotY((o.ty || 0) * DEG), rotX(lean * DEG)),
    'head.rotation': qmul(rotY((o.look === undefined ? 5 * Math.sin(t) : o.look) * DEG), rotX(-0.7 * lean * DEG)),
  };
  for (const k of SIDES) {
    const side = k > 0 ? 'L' : 'R';
    pointJoint(pose, 'leg' + side, [0.65 * k, -0.35, 0.7]);
    pointJoint(pose, 'shin' + side, [0.12 * k, -1, -0.25]);
  }
  arms(o.arm || { ...SEATED, lx: -35 - o.lean, rx: -30 - o.lean }, pose);
  return aimJoint(pose, 'shield', qmul(rotY(-15 * DEG), rotX(o.lean * DEG)));
};

// Mounted attack key poses (rideAttack, rideRunAttack), u in [0, 1) on the 18-frame grid: guard ->
// raise the sword outside the right shoulder -> cock it behind the head -> chop forward (fast, over
// 2 frames) -> hold the arm fully extended, blade level -> follow-through downwards -> back to guard.
// hx/hy/hz: the fist (model space); pitch: the blade (positive tips it down; its yaw stays 0:
// aimJoint keeps it in the vertical plane); ty/tx: torso turn and lean. Between frames the pose is
// linear, so the extended hold keeps ty constant (the blade stays forward). The foot attack has its
// own keys: FOOT_ATTACK.
const F = k => k / 18;
const SWORD_ATTACK = [
  { u: F(0), hx: -0.38, hy: 1.18, hz: 0.24, pitch: -45, ty: 0, tx: 4, ext: 0 },
  { u: F(2), hx: -0.42, hy: 1.50, hz: 0.10, pitch: -90, ty: -10, tx: 0, ext: 0 },
  { u: F(4), hx: -0.50, hy: 1.76, hz: -0.12, pitch: -140, ty: -28, tx: -8, ext: 0 },
  { u: F(6), hx: -0.52, hy: 1.78, hz: -0.16, pitch: -150, ty: -34, tx: -10, ext: 0 },
  { u: F(7), hx: -0.36, hy: 1.68, hz: 0.20, pitch: -100, ty: -15, tx: 0, ext: 0 },
  { u: F(8), hx: -0.24, hy: 1.52, hz: 0.44, pitch: -45, ty: 4, tx: 8, ext: 0.6 },
  { u: F(9), hx: -0.17, hy: 1.40, hz: 0.58, pitch: -4, ty: 12, tx: 10, ext: 1 },
  { u: F(10), hx: -0.17, hy: 1.38, hz: 0.58, pitch: 0, ty: 12, tx: 10, ext: 1 },
  { u: F(11), hx: -0.17, hy: 1.34, hz: 0.57, pitch: 6, ty: 12, tx: 10, ext: 1 },
  { u: F(12), hx: -0.22, hy: 1.15, hz: 0.50, pitch: 40, ty: 10, tx: 12, ext: 0.7 },
  { u: F(14), hx: -0.34, hy: 1.12, hz: 0.34, pitch: 10, ty: 10, tx: 8, ext: 0 },
  { u: F(16), hx: -0.38, hy: 1.14, hz: 0.28, pitch: -30, ty: 3, tx: 5, ext: 0 },
];
SWORD_ATTACK.push({ ...SWORD_ATTACK[0], u: 1 });

// Monotone cubic (PCHIP) through the stops, periodic: no stop in the middle of a swing, no
// overshoot at the extremes, a hold stays a hold.
const curve = (u, stops) => {
  const n = stops.length - 1, at = i => {
    const w = Math.floor(i / n), s = stops[((i % n) + n) % n];
    return { u: s.u + w, s };
  };
  let i = 0;
  while (i < n - 1 && u > stops[i + 1].u) i++;
  const [p0, a, b, p3] = [at(i - 1), at(i), at(i + 1), at(i + 2)], h = b.u - a.u, t = (u - a.u) / h;
  const out = {};
  for (const key of Object.keys(stops[0])) {
    if (key === 'u') continue;
    const d0 = (a.s[key] - p0.s[key]) / (a.u - p0.u), d1 = (b.s[key] - a.s[key]) / h, d2 = (p3.s[key] - b.s[key]) / (p3.u - b.u);
    const tangent = (l, r, wl, wr) => (l * r <= 0 ? 0 : (wl + wr) / (wl / l + wr / r));
    const ma = tangent(d0, d1, a.u - p0.u, h) * h, mb = tangent(d1, d2, h, p3.u - b.u) * h;
    const t2 = t * t, t3 = t2 * t;
    out[key] = (2 * t3 - 3 * t2 + 1) * a.s[key] + (t3 - 2 * t2 + t) * ma + (-2 * t3 + 3 * t2) * b.s[key] + (t3 - t2) * mb;
  }
  return out;
};
const ARM = 0.549;   // shoulder -> fist with the arm straight (the full reach is 0.55 m)
const swingSword = (pose, p, seated = false) => {
  const target = [seated ? Math.min(p.hx, -0.43) : p.hx, p.hy + (seated ? SEAT - BODY[B.hips].at[1] : 0), p.hz * (seated ? 0.85 : 1)];
  // ext: the fist goes to the point straight ahead of the shoulder, the arm fully straight and
  // in line with the blade (the shoulder moves with the torso, so it is taken from the pose).
  const S = worldOf(pose, J.armR).p;
  reach(pose, 'armR', 'foreR', lerp(target, [S[0], S[1], S[2] + ARM], p.ext), [-1, -0.2, -0.6], HAND);
  return aimJoint(pose, 'sword', rotX(p.pitch * DEG));
};

// Cut forward in a vertical plane just outside the horse's head and neck, then recover.
const mountedAttack = (t, lean, bob) => {
  const p = curve(t / (2 * Math.PI), SWORD_ATTACK);
  const pose = ride(0, { lean: lean + p.tx, sway: 0, ty: p.ty, look: -0.7 * p.ty, bob, arm: { ...SEATED, lx: -35 - lean } });
  return swingSword(pose, p, true);
};

// On foot: guard -> wind-up over the right shoulder (0.4) -> diagonal cut across to the front
// left with a step of the right foot (0.58) -> follow-through -> guard. Arm angles (armAngles),
// sx — the sword against the fist, ty/tx — torso turn and lean, hy — hips height.
// At the wind-up rz is POSITIVE: on a raised arm rotZ flips meaning, and the old -25° tilted the
// fist over the helmet, so the sword went through the head. +10° keeps it >= 4 cm outside.
const FOOT_GUARD = { u: 0, rx: -20, rz: -10, frx: -55, sx: 20, ty: 0, tx: 4, hy: 0.90, step: 0 };
const FOOT_ATTACK = [
  FOOT_GUARD,
  { u: 0.4, rx: -165, rz: 10, frx: -75, sx: 0, ty: -25, tx: -6, hy: 0.90, step: 0 },
  { u: 0.58, rx: -45, rz: -5, frx: -8, sx: 80, ty: 22, tx: 14, hy: 0.88, step: 1 },
  { u: 0.75, rx: -35, rz: -5, frx: -10, sx: 85, ty: 18, tx: 12, hy: 0.88, step: 1 },
  { ...FOOT_GUARD, u: 1 },
];

// Thrown by the falling horse: sits through the buckle (u < 0.3), flies off over its back, lands
// on his back on the ground beside it. The clip is in the saddle's frame, which rolls with the
// horse, so the world path (hips position and turn) is converted into it every frame.
const LAND = { p: [-1.25, 0.14, -0.45], q: rotX(-86 * DEG) };
const rideDeath = (u) => {
  const S = saddleFrame(horseDeath(u)), k = smooth((u - 0.3) / 0.45), inv = qconj(S.q);
  const sitting = add(S.p, qrot(S.q, [0, SEAT, 0]));
  const P = add(lerp(sitting, LAND.p, k), [0, 0.7 * Math.sin(Math.PI * k), 0]), Q = nlerp(S.q, LAND.q, k);
  const seated = ride(0, { lean: 2, sway: 0, look: 0 });
  const pose = {
    'hips.translation': qrot(inv, sub(P, S.p)),
    'hips.rotation': qmul(inv, Q),
    'torso.rotation': rotX(-12 * k * DEG),
    'head.rotation': rotX(10 * k * DEG),
  };
  for (const side of ['L', 'R']) {
    pose['leg' + side + '.rotation'] = nlerp(seated['leg' + side + '.rotation'], rotX(-12 * DEG), k);
    pose['shin' + side + '.rotation'] = nlerp(seated['shin' + side + '.rotation'], rotX(-12 * DEG), k);
  }
  arms(mix({ ...SEATED, lx: -37, rx: -32 }, DEAD_ARMS, k), pose);
  return aimJoint(pose, 'shield', nlerp(qmul(rotY(-15 * DEG), rotX(2 * DEG)), qmul(worldOf(pose, J.hips).q, SHIELD_AIM), k));
};

const CLIPS = [
  // Low guard: sword tip down in front, shield by the left hip, a slow look around.
  loopClip('idle', 2.4, 12, t => aimJoint(arms({ lz: 8, lx: -10 - 2 * Math.sin(t), flx: -45, rz: -8, rx: -12 + 1.5 * Math.sin(t), frx: -40, sx: 75 }, idleBody(t)), 'shield', SHIELD_AIM)),
  // Run: shield up in front, the sword carried upright and swinging with the step.
  loopClip('run', 0.64, 16, t => aimJoint(arms({ lz: 10, lx: -20 + 6 * Math.sin(t), flx: -55, rz: -10, rx: -20 - 22 * Math.sin(t), frx: -60, sx: -25 }, runBody(t)),
    'shield', qmul(rotY(-15 * DEG), rotX(3 * DEG * Math.sin(2 * t))))),
  // Attack: see FOOT_ATTACK. Looped: a unit in melee plays it over and over.
  loopClip('attack', 0.9, 18, (t) => {
    const p = tween(t / (2 * Math.PI), FOOT_ATTACK);
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
  loopClip('ride', 2.4, 12, t => ride(t, { lean: 2, bob: 0.003 * Math.sin(t) })),
  loopClip('rideRun', 0.64, 16, t => ride(t, { lean: 14, bob: 0.012 * Math.sin(2 * t) })),
  loopClip('rideAttack', 0.9, 18, t => mountedAttack(t, 2, 0)),
  loopClip('rideRunAttack', 1.28, 32, t => mountedAttack(t, 14, 0.012 * Math.sin(4 * t))),
  onceClip('rideDeath', 1.8, 24, rideDeath),
];

export default { name: 'swordsman', joints: JOINTS, palette: PALETTE, parts: PARTS, clips: CLIPS, preview: 'idle@0.6,attack@0.52' };
