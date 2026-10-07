// Goblin wolf rider: the wolf and the goblin in ONE model (one mesh, one material, one skeleton),
// assembled from wolf.mjs and goblin.mjs — nothing is drawn here. The goblin's joints (prefixed
// `rider_`) hang on the wolf's `body`: he sits astride its back, thighs forward and out, one fist
// on the harness strap, the javelin in the other, and rides rigidly with the wolf. The clips are
// the wolf's, with the rider acting on top of them: "idle" (he looks around), "run" (he rides the
// bounce), "attack" (he thrusts the javelin as the wolf pounces), "throw" (the wolf stands, he
// hurls the javelin and takes a new one from the bundle), "runThrow" (the same at a run) — looped;
// "death" — once (the wolf rolls onto its right side, the goblin is thrown over its back and lies
// beside it). Faces +Z.
import { DEG, add, lerp, loopClip, qconj, qmul, qrot, rig, rotX, rotY, rotZ, sub, tween } from '../unit-glb.mjs';
import { SIDES, armAngles } from './humanoid.mjs';
import goblin from './goblin.mjs';
import wolf, { SCALE, deathPose, idle as wolfIdle, run as wolfRun } from './wolf.mjs';

const N = wolf.joints.length;
const BODY = wolf.joints.findIndex(j => j.name === 'body');
const rider = name => 'rider_' + name;
const HAND = 0.27 * 0.88;   // the goblin's forearm joint -> fist (goblin.mjs scales the humanoid by 0.88)

// The goblin's hips sit at HIPS (model space) on the wolf's back; every goblin joint and part moves
// by SHIFT from its own coordinates.
const HIPS = [0, 0.97 * SCALE, 0.03 * SCALE];
const SHIFT = sub(HIPS, goblin.joints[0].at);

const JOINTS = [
  ...wolf.joints,
  ...goblin.joints.map(j => ({ name: rider(j.name), at: add(j.at, SHIFT), parent: j.parent < 0 ? BODY : j.parent + N })),
];

// One 4x4 palette (16 colours): equal hex values are one texel; the goblin's near-duplicates
// (eyes, tusks, pupils, cloth) take the wolf's texels to stay within 16.
const ALIAS_TO = { eye: 'eye', tusk: 'fang', pupil: 'paw', cloth: 'leather' };
const PALETTE = [...wolf.palette];
const alias = {};
for (const c of goblin.palette) {
  const same = ALIAS_TO[c.name] ? PALETTE.find(p => p.name === ALIAS_TO[c.name]) : PALETTE.find(p => p.hex === c.hex);
  if (same) alias[c.name] = same.name;
  else {
    PALETTE.push(c);
    alias[c.name] = c.name;
  }
}

const shift = (p) => {
  const out = { ...p, color: alias[p.color] };
  if (p.span) {
    out.span = p.span.map(v => add(v, SHIFT));
    out.joints = p.joints.map(j => j + N);
  } else {
    out.c = add(p.c, SHIFT);
    if (p.pivot) out.pivot = add(p.pivot, SHIFT);
    out.joint = p.joint + N;
  }
  return out;
};
const PARTS = [...wolf.parts, ...goblin.parts.map(shift)];

// --- The rider's poses. Written in the goblin's own coordinates (his hips at bind), which are
// the wolf body's frame minus SHIFT, so a point on the wolf is target - SHIFT.
const G = rig(goblin.joints), W = rig(wolf.joints), ALL = rig(JOINTS);
const own = p => sub(p, SHIFT);
const nlerp = (a, b, k) => {
  const sign = a[0] * b[0] + a[1] * b[1] + a[2] * b[2] + a[3] * b[3] < 0 ? -1 : 1, q = lerp(a, b.map(v => v * sign), k);
  return q.map(v => v / Math.hypot(...q));
};
const smooth = x => { const k = Math.min(1, Math.max(0, x)); return k * k * (3 - 2 * k); };

const STRAP_GRIP = [0.10, 0.96, 0.20].map(v => v * SCALE);   // the left fist on top of the harness strap
const JAVELIN_GRIP = [-0.30, 1.05, 0.24].map(v => v * SCALE);
const JAVELIN_AIM = lean => qmul(rotY(8 * DEG), rotX((50 + 0.4 * lean) * DEG));

const STRAP_OWN = own(STRAP_GRIP), JAVELIN_OWN = own(JAVELIN_GRIP);

// Seated astride; every angle in degrees. lean/ty — torso forward lean and turn, look/nod — head
// turn and tilt on top of the counter-lean that keeps it level; hand/aim — the right fist (own
// coordinates) and the javelin's world rotation; free — the left arm leaves the strap by w (0..1)
// and swings to lx/flx.
function ride({ lean = 10, ty = 0, look = 0, nod = 0, hand = JAVELIN_OWN, aim = JAVELIN_AIM(lean), free = null } = {}) {
  const pose = {
    'torso.rotation': qmul(rotY(ty * DEG), rotX(lean * DEG)),
    'head.rotation': qmul(rotY(look * DEG), rotX((nod - 0.7 * lean) * DEG)),
  };
  for (const k of SIDES) {
    const side = k > 0 ? 'L' : 'R';
    G.pointJoint(pose, 'leg' + side, [0.65 * k, -0.35, 0.7]);
    G.pointJoint(pose, 'shin' + side, [0.12 * k, -1, -0.25]);
  }
  G.reach(pose, 'armL', 'foreL', STRAP_OWN, [1, -0.2, -0.6], HAND);
  if (free && free.w > 0) {
    const arm = armAngles({ lz: 10, lx: free.lx, flx: free.flx, rz: 0, rx: 0, frx: 0 }, {});
    for (const j of ['armL', 'foreL']) pose[j + '.rotation'] = nlerp(pose[j + '.rotation'], arm[j + '.rotation'], free.w);
  }
  G.reach(pose, 'armR', 'foreR', hand, [-1, -0.3, -0.3], HAND);
  return G.aimJoint(pose, 'spear', aim, 0);
}

// Thrown by the falling wolf: sits through the buckle (u < 0.3), flies off over its back, lands
// on his back beside it. The pose is in the body's frame, which rolls with the wolf, so the world
// path (hips position and turn) is converted into it every frame. lift raises the whole rider.
const LAND = { p: [-1.05, 0.2, -0.1], q: rotX(-86 * DEG) };
const DEAD = armAngles({ lz: 53, lx: -8, flx: -10, rz: -58, rx: -10, frx: -20 }, {});
function riderDeath(u, lift = 0) {
  const S = W.worldOf(deathPose(u), BODY), k = smooth((u - 0.3) / 0.45), inv = qconj(S.q);
  const sitting = add(S.p, qrot(S.q, sub(HIPS, wolf.joints[BODY].at)));
  const P = add(lerp(sitting, LAND.p, k), [0, 0.7 * Math.sin(Math.PI * k) + lift, 0]), Q = nlerp(S.q, LAND.q, k);
  const from = ride({ lean: 14 }), pose = {
    'hips.translation': qrot(inv, sub(P, S.p)),
    'hips.rotation': qmul(inv, Q),
    'torso.rotation': nlerp(from['torso.rotation'], rotX(-12 * DEG), k),
    'head.rotation': nlerp(from['head.rotation'], rotX(10 * DEG), k),
  };
  for (const j of ['legL', 'legR', 'shinL', 'shinR']) pose[j + '.rotation'] = nlerp(from[j + '.rotation'], rotX(-12 * DEG), k);
  for (const j of ['armL', 'foreL', 'armR', 'foreR']) pose[j + '.rotation'] = nlerp(from[j + '.rotation'], DEAD[j + '.rotation'], k);
  const lying = qmul(G.worldOf(pose, 0).q, rotX(8 * DEG));
  return G.aimJoint(pose, 'spear', nlerp(JAVELIN_AIM(14), lying, k), 0);
}

// Lowest point of the rider's parts (box corners; a frustum counts as its bounding box) under a
// full pose of the combined skeleton.
export function riderMinY(pose) {
  const Wd = JOINTS.map((_, i) => ALL.worldOf(pose, i));
  let low = Infinity;
  for (const p of PARTS) {
    if (p.span || p.joint < N) continue;
    const w = Wd[p.joint], half = p.s ? p.s.map(v => v / 2) : [Math.max(...p.r), p.h / 2, Math.max(...p.r)];
    for (const sx of [-1, 1]) for (const sy of [-1, 1]) for (const sz of [-1, 1]) {
      let v = [p.c[0] + sx * half[0], p.c[1] + sy * half[1], p.c[2] + sz * half[2]];
      if (p.q) { const pv = p.pivot || p.c; v = add(pv, qrot(p.q, sub(v, pv))); }
      low = Math.min(low, add(w.p, qrot(w.q, sub(v, JOINTS[p.joint].at)))[1]);
    }
  }
  return low;
}

// Rider keys to the combined skeleton's track names.
const named = pose => Object.fromEntries(Object.entries(pose).map(([key, v]) => [rider(key.split('.')[0]) + '.' + key.split('.')[1], v]));

// The goblin never goes under the ground: a pose that dips lifts the whole rider by the dip.
function riderDeathGrounded(u, wolfPose) {
  const pose = riderDeath(u);
  const dip = riderMinY({ ...wolfPose, ...named(pose) });
  return dip < 0 ? riderDeath(u, -dip) : pose;
}

// --- Rider acting. t in [0, 2π), the same phase as the wolf's pose under it.
const sin = Math.sin;
const aimOf = (yaw, pitch, roll = 0) => qmul(rotZ(roll * DEG), qmul(rotY(yaw * DEG), rotX(pitch * DEG)));

// Idle: a slow look around, the torso turns with the head, the javelin tip sways.
const idleRider = t => ride({
  lean: 10 + 1.5 * sin(t), ty: 9 * sin(t - 0.5), look: 34 * sin(t) + 8 * sin(2 * t + 1), nod: 3 * sin(t + 0.6),
  hand: add(JAVELIN_OWN, [0.005 * sin(t), 0.008 * sin(t + 1), 0]), aim: aimOf(6, 42 + 3 * sin(t), 2 * sin(t)),
});

// Run: crouched over the neck, the torso takes up the bounce, the head stays level and forward.
const runRider = t => ride({
  lean: 22 + 4 * sin(t + 1.2), ty: 4 * sin(t), look: 3 * sin(t), nod: 4 + 3 * sin(t + 0.4),
  hand: add(JAVELIN_OWN, [0, 0.02 * Math.abs(sin(t + 0.4)), 0]), aim: aimOf(8, 52 + 5 * sin(2 * t)),
});

// Key poses: the right fist h* (own coordinates), the javelin's pitch (90 — level) and yaw, the
// torso turn ty and lean, the left arm free by w and swinging to lx/flx.
const GUARD = { u: 0, hx: JAVELIN_OWN[0], hy: JAVELIN_OWN[1], hz: JAVELIN_OWN[2], pitch: 54, yaw: 8, ty: -10, lean: 10, w: 0, lx: -30, flx: -20 };

// Attack, in step with the wolf's pounce (crouch 0.3, spring 0.5, bite 0.6): he sits back, then
// jabs the javelin forward over its head and rocks back as it lands.
const JAB = [
  GUARD,
  { u: 0.30, hx: -0.34, hy: 1.10, hz: -0.05, pitch: 62, yaw: 6, ty: -25, lean: 4, w: 0.5, lx: -60, flx: -15 },
  { u: 0.50, hx: -0.30, hy: 1.12, hz: 0.50, pitch: 78, yaw: 4, ty: 15, lean: 30, w: 1, lx: -85, flx: -30 },
  { u: 0.60, hx: -0.28, hy: 1.02, hz: 0.56, pitch: 82, yaw: 2, ty: 20, lean: 34, w: 1, lx: -70, flx: -35 },
  { u: 0.80, hx: -0.32, hy: 1.00, hz: 0.30, pitch: 62, yaw: 6, ty: 0, lean: 18, w: 0.3, lx: -45, flx: -25 },
  { ...GUARD, u: 1 },
];
const jabRider = (t) => {
  const p = tween(t / (2 * Math.PI), JAB);
  return ride({ lean: p.lean, ty: p.ty, look: -0.5 * p.ty, nod: 0, hand: [p.hx, p.hy, p.hz], aim: aimOf(p.yaw, p.pitch), free: { w: p.w, lx: p.lx, flx: p.flx } });
};

// Throw: draw back with the torso turned right, hurl with a lunge, follow through, reach behind for
// the next javelin. The javelin vanishes the frame it leaves the hand (20-30 of 36) and a new one is
// in the fist when it comes back from the bundle (31).
const HIDDEN = 0.02, THROW_FRAMES = 36;
const THROW = [
  GUARD,
  { u: 0.30, hx: -0.34, hy: 1.26, hz: -0.26, pitch: 62, yaw: 4, ty: -50, lean: -2, w: 1, lx: -85, flx: -10 },
  { u: 0.50, hx: -0.30, hy: 1.34, hz: 0.38, pitch: 55, yaw: 2, ty: 10, lean: 20, w: 1, lx: -20, flx: -40 },
  { u: 0.62, hx: -0.24, hy: 1.05, hz: 0.50, pitch: 45, yaw: 0, ty: 25, lean: 26, w: 1, lx: 10, flx: -20 },
  { u: 0.85, hx: -0.36, hy: 1.26, hz: -0.14, pitch: 85, yaw: 0, ty: -20, lean: 6, w: 0.6, lx: -30, flx: -30 },
  { ...GUARD, u: 1 },
];
const throwRider = extraLean => (t) => {
  const u = t / (2 * Math.PI), i = Math.round(u * THROW_FRAMES) % THROW_FRAMES, p = tween(u, THROW), lean = p.lean + extraLean * sin(Math.PI * u);
  const pose = ride({ lean, ty: p.ty, look: -0.9 * p.ty, nod: -0.1 * lean, hand: [p.hx, p.hy, p.hz], aim: aimOf(p.yaw, p.pitch), free: { w: p.w, lx: p.lx, flx: p.flx } });
  const shown = i >= 20 && i <= 30 ? HIDDEN : 1;
  pose['spear.scale'] = [shown, shown, shown];
  return pose;
};

// The wolf under a throw: planted and watchful (head level, little sway) or at a full run.
const wolfStand = t => ({ ...wolfIdle(t), 'neck.rotation': rotX(3 * DEG), 'head.rotation': rotX(0), 'jaw.rotation': rotX(2 * DEG) });
const wolfRunTwice = t => wolfRun(2 * t);

// Rider tracks (his own joint names) added to a wolf clip, one pose per key.
function withRider(clip, riderAt) {
  const tracks = new Map(clip.tracks), frames = clip.times.length - 1;
  for (let i = 0; i <= frames; i++) {
    const pose = clip.loop
      ? riderAt(2 * Math.PI * (i % frames) / frames)
      : riderDeathGrounded(i / frames, Object.fromEntries([...clip.tracks].map(([key, v]) => [key, v[i]])));
    for (const [name, value] of Object.entries(named(pose))) {
      if (!tracks.has(name)) tracks.set(name, []);
      tracks.get(name).push(value);
    }
  }
  return { ...clip, tracks };
}

const WOLF = Object.fromEntries(wolf.clips.map(c => [c.name, c]));
const CLIPS = [
  withRider(WOLF.idle, idleRider),
  withRider(WOLF.run, runRider),
  withRider(WOLF.attack, jabRider),
  withRider(loopClip('throw', 1.5, THROW_FRAMES, wolfStand), throwRider(0)),
  withRider(loopClip('runThrow', 1.5, THROW_FRAMES, wolfRunTwice), throwRider(8)),
  withRider(WOLF.death),
];

export default {
  name: 'goblin-wolf-rider', joints: JOINTS, palette: PALETTE, parts: PARTS, clips: CLIPS,
  preview: 'idle@0.6,throw@0.675,runThrow@0.675,attack@0.42,death@1.1',
  previewGap: 70,
  maxTriangles: 1300,   // two models in one: wolf 528 + goblin 700
};
