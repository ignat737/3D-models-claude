// Goblin wolf rider: the wolf and the goblin in ONE model (one mesh, one material, one skeleton),
// assembled from wolf.mjs and goblin.mjs — nothing is drawn here. The goblin's joints (prefixed
// `rider_`) hang on the wolf's `body`: he sits astride its back, thighs forward and out, one fist
// on the harness strap, the javelin in the other, and rides rigidly with the wolf. The clips are
// the wolf's: "idle", "run", "attack" — looped; "death" — once (the wolf rolls onto its right
// side, the goblin is thrown over its back and lies beside it). Faces +Z.
import { DEG, add, lerp, qconj, qmul, qrot, rig, rotX, rotY, sub } from '../unit-glb.mjs';
import { SIDES, armAngles } from './humanoid.mjs';
import goblin from './goblin.mjs';
import wolf, { SCALE, deathPose } from './wolf.mjs';

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

// Seated astride: lean — the torso's forward lean, look — a turn of the head (degrees).
function seated(lean, look = 0) {
  const pose = {
    'torso.rotation': rotX(lean * DEG),
    'head.rotation': qmul(rotY(look * DEG), rotX(-0.7 * lean * DEG)),
  };
  for (const k of SIDES) {
    const side = k > 0 ? 'L' : 'R';
    G.pointJoint(pose, 'leg' + side, [0.65 * k, -0.35, 0.7]);
    G.pointJoint(pose, 'shin' + side, [0.12 * k, -1, -0.25]);
  }
  G.reach(pose, 'armL', 'foreL', own(STRAP_GRIP), [1, -0.2, -0.6], HAND);
  G.reach(pose, 'armR', 'foreR', own(JAVELIN_GRIP), [-1, -0.3, -0.3], HAND);
  return G.aimJoint(pose, 'spear', JAVELIN_AIM(lean), 0);
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
  const from = seated(14), pose = {
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

const RIDER_LEAN = { idle: 10, run: 22, attack: 16 };

const CLIPS = wolf.clips.map((c) => {
  const tracks = new Map(c.tracks), frames = c.times.length;
  for (let i = 0; i < frames; i++) {
    const pose = c.loop
      ? seated(RIDER_LEAN[c.name])
      : riderDeathGrounded(i / (frames - 1), Object.fromEntries([...c.tracks].map(([key, v]) => [key, v[i]])));
    for (const [name, value] of Object.entries(named(pose))) {
      if (!tracks.has(name)) tracks.set(name, []);
      tracks.get(name).push(value);
    }
  }
  return { ...c, tracks };
});

export default {
  name: 'goblin-wolf-rider', joints: JOINTS, palette: PALETTE, parts: PARTS, clips: CLIPS,
  preview: 'idle@0.6,run@0.12,attack@0.4,death@1.1',
  previewGap: 70,
  maxTriangles: 1300,   // two models in one: wolf 528 + goblin 700
};
