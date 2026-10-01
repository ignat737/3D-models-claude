// Wolf: a low-poly wolf for a strategy game, 0.98 m at the shoulders, 1.2 m to the ears, 1.7 m
// nose to the root of the tail (the base design 0.85 / 1.05 / 1.5 m times SCALE). Grey coat with a dark mantle along the back, pale legs and
// chest, amber eyes, white fangs, a team-coloured collar and shoulder strap. Faces +Z (the glTF front), +X is its
// left. An own skeleton like the horse's (`body`, `neck`, `head`, `jaw`, `tail`, four legs of two
// joints). Clips: "idle" (breathes, looks around), "run" (a lope) — looped; "attack" (crouches,
// springs, bites, lands) — looped; "death" (yelps, buckles, rolls onto its right side) — once.
import { DEG, add, loopClip, onceClip, qmul, qrot, rig, rotX, rotY, rotZ, sub, tween } from '../unit-glb.mjs';
import { SIDES } from './humanoid.mjs';

// Everything below is drawn at base size and scaled once by SCALE: joints, parts and the body
// translations of the clips (angles are unchanged).
export const SCALE = 1.15;
const scaled = v => v.map(x => x * SCALE);

const BASE_JOINTS = [
  { name: 'body', at: [0, 0.62, 0], parent: -1 },
  { name: 'neck', at: [0, 0.80, 0.40], parent: 0 },
  { name: 'head', at: [0, 0.82, 0.62], parent: 1 },
  { name: 'jaw', at: [0, 0.755, 0.76], parent: 2 },
  { name: 'tail', at: [0, 0.72, -0.46], parent: 0 },
  { name: 'legFL', at: [0.10, 0.61, 0.30], parent: 0 },
  { name: 'shinFL', at: [0.10, 0.32, 0.30], parent: 5 },
  { name: 'legFR', at: [-0.10, 0.61, 0.30], parent: 0 },
  { name: 'shinFR', at: [-0.10, 0.32, 0.30], parent: 7 },
  { name: 'legHL', at: [0.10, 0.61, -0.32], parent: 0 },
  { name: 'shinHL', at: [0.10, 0.32, -0.32], parent: 9 },
  { name: 'legHR', at: [-0.10, 0.61, -0.32], parent: 0 },
  { name: 'shinHR', at: [-0.10, 0.32, -0.32], parent: 11 },
];
const J = Object.fromEntries(BASE_JOINTS.map((j, i) => [j.name, i]));

// "team" and "teamDark" are the faction colours, the same texels as on the infantry.
const PALETTE = [
  { name: 'coat', hex: '#868a92' },
  { name: 'coatDark', hex: '#585b63' },
  { name: 'coatLight', hex: '#aeaba3' },
  { name: 'cream', hex: '#d9d3c3' },
  { name: 'paw', hex: '#34353a' },
  { name: 'eye', hex: '#e8b02e' },
  { name: 'fang', hex: '#f1ede2' },
  { name: 'mouth', hex: '#a3403f' },
  { name: 'team', hex: '#2f5da8' },
  { name: 'teamDark', hex: '#22447d' },
];

// Torso: chest, belly and rump, each capped by a slightly larger dark mantle box.
const TORSO = [
  { c: [0, 0.70, 0.27], s: [0.28, 0.38, 0.34] },
  { c: [0, 0.68, -0.02], s: [0.24, 0.32, 0.34] },
  { c: [0, 0.68, -0.30], s: [0.26, 0.34, 0.30] },
];
const mantle = ({ c, s }) => ({ c: [c[0], c[1] + s[1] / 2 - 0.06 + 0.006, c[2]], s: [s[0] + 0.012, 0.12, s[2] + 0.012], joint: J.body, color: 'coatDark' });

const legs = SIDES.flatMap(k => [true, false].flatMap((front) => {
  const side = k > 0 ? 'L' : 'R', x = 0.10 * k, z = front ? 0.30 : -0.32;
  const leg = J[(front ? 'legF' : 'legH') + side], shin = J[(front ? 'shinF' : 'shinH') + side];
  const upper = front ? { c: [x, 0.47, z], s: [0.11, 0.30, 0.14] } : { c: [x, 0.47, z], s: [0.13, 0.32, 0.22] };
  return [
    { ...upper, joint: leg, color: 'coat' },
    { c: [x, 0.19, z + 0.005], s: [0.08, 0.26, 0.09], joint: shin, color: 'coatLight' },
    { c: [x, 0.03, z + 0.03], s: [0.10, 0.06, 0.15], joint: shin, color: 'paw' },
  ];
}));

const BASE_PARTS = [
  ...TORSO.map(t => ({ ...t, joint: J.body, color: 'coat' })),
  ...TORSO.map(mantle),
  { c: [0, 0.60, 0.447], s: [0.17, 0.24, 0.012], joint: J.body, color: 'cream' },
  // Harness strap over the shoulders: the team colour that shows from the RTS camera.
  { c: [0, 0.70, 0.20], s: [0.30, 0.41, 0.08], joint: J.body, color: 'team' },
  { c: [0, 0.70, 0.15], s: [0.304, 0.414, 0.02], joint: J.body, color: 'teamDark' },
  // Neck with a mantle on top and the collar: team band with a dark edge and a tag at the throat.
  { c: [0, 0.80, 0.51], s: [0.22, 0.24, 0.24], joint: J.neck, color: 'coat' },
  { c: [0, 0.906, 0.51], s: [0.232, 0.12, 0.252], joint: J.neck, color: 'coatDark' },
  { c: [0, 0.80, 0.50], s: [0.236, 0.256, 0.05], joint: J.neck, color: 'team' },
  { c: [0, 0.80, 0.53], s: [0.24, 0.26, 0.02], joint: J.neck, color: 'teamDark' },
  { c: [0, 0.72, 0.482], s: [0.05, 0.08, 0.02], joint: J.neck, color: 'teamDark' },
  // Head: skull, muzzle, nose, brow, eyes, ears, fangs; the lower jaw hangs on its own joint.
  { c: [0, 0.82, 0.70], s: [0.20, 0.20, 0.20], joint: J.head, color: 'coat' },
  { c: [0, 0.785, 0.88], s: [0.11, 0.09, 0.17], joint: J.head, color: 'coatLight' },
  { c: [0, 0.80, 0.975], s: [0.06, 0.05, 0.03], joint: J.head, color: 'paw' },
  { c: [0, 0.912, 0.74], s: [0.204, 0.03, 0.12], joint: J.head, color: 'coatDark' },
  ...SIDES.map(k => ({ c: [0.055 * k, 0.865, 0.803], s: [0.05, 0.028, 0.012], joint: J.head, color: 'eye' })),
  ...SIDES.map(k => ({ c: [0.065 * k, 0.975, 0.67], h: 0.13, r: [0.055, 0.012], n: 4, joint: J.head, q: rotX(-8 * DEG), color: 'coatDark' })),
  ...SIDES.map(k => ({ c: [0.04 * k, 0.725, 0.935], s: [0.014, 0.045, 0.014], joint: J.head, color: 'fang' })),
  { c: [0, 0.745, 0.88], s: [0.09, 0.04, 0.16], joint: J.jaw, color: 'cream' },
  { c: [0, 0.768, 0.88], s: [0.075, 0.012, 0.13], joint: J.jaw, color: 'mouth' },
  ...SIDES.map(k => ({ c: [0.035 * k, 0.79, 0.94], s: [0.014, 0.04, 0.014], joint: J.jaw, color: 'fang' })),
  // Tail: a bushy hank hanging from the rump with a dark tip.
  { c: [0, 0.55, -0.46], h: 0.34, r: [0.07, 0.04], n: 5, joint: J.tail, q: rotX(18 * DEG), pivot: [0, 0.72, -0.46], color: 'coat' },
  { c: [0, 0.29, -0.46], h: 0.18, r: [0.02, 0.07], n: 5, joint: J.tail, q: rotX(18 * DEG), pivot: [0, 0.72, -0.46], color: 'coatDark' },
  ...legs,
];

const JOINTS = BASE_JOINTS.map(j => ({ ...j, at: scaled(j.at) }));
const PARTS = BASE_PARTS.map(p => ({
  ...p, c: scaled(p.c),
  ...(p.pivot && { pivot: scaled(p.pivot) }),
  ...(p.s ? { s: scaled(p.s) } : { h: p.h * SCALE, r: p.r.map(r => r * SCALE) }),
}));

const { worldOf } = rig(JOINTS);
const smooth = x => { const k = Math.min(1, Math.max(0, x)); return k * k * (3 - 2 * k); };

// Lowest and highest point of any part under a pose (box corners; a frustum counts as its
// bounding box): a fallen wolf lies on the ground, not in it.
export function extentY(pose) {
  const W = JOINTS.map((_, i) => worldOf(pose, i));
  let low = Infinity, high = -Infinity;
  for (const p of PARTS) {
    const w = W[p.joint], half = p.s ? p.s.map(v => v / 2) : [Math.max(...p.r), p.h / 2, Math.max(...p.r)];
    for (const sx of [-1, 1]) for (const sy of [-1, 1]) for (const sz of [-1, 1]) {
      let v = [p.c[0] + sx * half[0], p.c[1] + sy * half[1], p.c[2] + sz * half[2]];
      if (p.q) { const pv = p.pivot || p.c; v = add(pv, qrot(p.q, sub(v, pv))); }
      const y = add(w.p, qrot(w.q, sub(v, JOINTS[p.joint].at)))[1];
      low = Math.min(low, y);
      high = Math.max(high, y);
    }
  }
  return [low, high];
}

// Body at height y, then lowered or lifted so that the lowest point is exactly on the ground.
function grounded(pose, x = 0, z = 0) {
  pose['body.translation'] = [x, 0.62 * SCALE, z];
  pose['body.translation'][1] -= extentY(pose)[0];
  return pose;
}

// Legs by angles (degrees): f swings the leg forward, s folds the lower leg back.
const legs4 = (pose, { ff = 0, fs = 0, hf = 0, hs = 0, fr = 0 }) => {
  // fr — the right front leg lags behind the left one by that many degrees.
  for (const [name, f, s] of [['FL', ff, fs], ['FR', ff - fr, fs], ['HL', hf, hs], ['HR', hf, hs]]) {
    pose['leg' + name + '.rotation'] = rotX(-f * DEG);
    pose['shin' + name + '.rotation'] = rotX(s * DEG);
  }
  return pose;
};

// Idle: breathing, the head sweeps slowly from side to side, the tail sways.
const idle = t => legs4({
  'body.translation': scaled([0, 0.62 + 0.005 * Math.sin(t), 0]),
  'neck.rotation': qmul(rotY(14 * DEG * Math.sin(t)), rotX((4 + 3 * Math.sin(t - 1)) * DEG)),
  'head.rotation': rotX((2 * Math.sin(t + 0.6)) * DEG),
  'jaw.rotation': rotX((2 + 2 * Math.sin(t + 1.5)) * DEG),
  'tail.rotation': qmul(rotZ(10 * DEG * Math.sin(t + 1)), rotX((4 + 3 * Math.sin(t)) * DEG)),
}, {});

// Lope: front and hind pairs swing against each other, the knees fold on the way forward, the
// body rises and pitches, the head pumps and the tail streams out behind.
const swing = (t, phase, amp, mid) => {
  const a = t + phase;
  return { leg: rotX(-(mid + amp * Math.sin(a)) * DEG), shin: rotX(95 * DEG * Math.max(0, Math.cos(a - 0.3)) ** 1.5) };
};
const run = (t) => {
  const fl = swing(t, 0, 42, 8), fr = swing(t, -0.45, 42, 8);
  const hl = swing(t, Math.PI - 0.2, 38, -6), hr = swing(t, Math.PI + 0.25, 38, -6);
  return {
    'body.translation': scaled([0, 0.62 + 0.06 * Math.abs(Math.sin(t + 0.4)), 0]),
    'body.rotation': rotX((-6 * Math.sin(t + 0.4)) * DEG),
    'neck.rotation': rotX((-8 + 6 * Math.sin(t - 0.8)) * DEG),
    'head.rotation': rotX((-4 + 5 * Math.sin(t - 1.4)) * DEG),
    'jaw.rotation': rotX((10 + 8 * Math.sin(t - 0.6)) * DEG),
    'tail.rotation': qmul(rotZ(6 * DEG * Math.sin(2 * t)), rotX((66 + 8 * Math.sin(2 * t + 0.5)) * DEG)),
    'legFL.rotation': fl.leg, 'shinFL.rotation': fl.shin,
    'legFR.rotation': fr.leg, 'shinFR.rotation': fr.shin,
    'legHL.rotation': hl.leg, 'shinHL.rotation': hl.shin,
    'legHR.rotation': hr.leg, 'shinHR.rotation': hr.shin,
  };
};

// Attack: crouches and gathers (0.3), springs forward with the jaws wide open (0.5), the bite
// shuts at 0.6, lands and shakes off the lunge. dy lifts the body off the ground, dz moves it forward.
const attack = (t) => {
  const g = { u: 0, dy: 0, dz: 0, pitch: 0, neck: 4, head: 0, jaw: 3, ff: 0, fs: 0, hf: 0, hs: 0, fr: 0, tail: 6 };
  const p = tween(t / (2 * Math.PI), [
    g,
    { u: 0.30, dy: -0.05, dz: -0.06, pitch: -8, neck: 20, head: 6, jaw: 6, ff: -22, fs: 55, hf: 28, hs: 55, fr: 0, tail: 20 },
    { u: 0.50, dy: 0.12, dz: 0.30, pitch: 14, neck: -22, head: -12, jaw: 42, ff: 62, fs: 15, hf: -42, hs: 20, fr: 8, tail: 50 },
    { u: 0.60, dy: 0.04, dz: 0.38, pitch: -6, neck: 14, head: 10, jaw: 0, ff: 40, fs: 5, hf: -22, hs: 10, fr: 0, tail: 40 },
    { u: 0.80, dy: 0.01, dz: 0.12, pitch: -2, neck: 8, head: 4, jaw: 4, ff: 12, fs: 8, hf: 4, hs: 6, fr: 4, tail: 14 },
    { ...g, u: 1 },
  ]);
  return legs4({
    'body.translation': scaled([0, 0.62 + p.dy, p.dz]),
    'body.rotation': rotX(-p.pitch * DEG),
    'neck.rotation': rotX(p.neck * DEG),
    'head.rotation': rotX(p.head * DEG),
    'jaw.rotation': rotX(p.jaw * DEG),
    'tail.rotation': rotX(p.tail * DEG),
  }, p);
};

// Death, u from 0 to 1: a yelp (head up, jaws open), the front legs buckle, then the wolf rolls
// onto its right side and lies still with the tongue out.
export function deathPose(u) {
  const buckle = smooth(u / 0.3), roll = smooth((u - 0.28) / 0.5) ** 1.4, settle = smooth((u - 0.78) / 0.22);
  const rise = Math.sin(Math.PI * smooth(u / 0.4));
  const pose = legs4({
    'body.rotation': qmul(rotZ(90 * DEG * roll), rotX(12 * buckle * (1 - roll) * DEG)),
    'neck.rotation': qmul(rotZ(-10 * roll * DEG), rotX((-26 * rise + 12 * roll) * DEG)),
    'head.rotation': rotX((-16 * rise + 10 * roll) * DEG),
    'jaw.rotation': rotX((34 * rise + 18 * settle) * DEG),
    'tail.rotation': rotX((6 + 14 * roll) * DEG),
  }, { ff: 8 * buckle + 24 * roll - 6 * settle, fs: 95 * buckle - 40 * roll, hf: -10 * roll + 10 * settle, hs: 25 * roll + 8 * settle, fr: 14 * roll });
  return grounded(pose);
}

const CLIPS = [
  loopClip('idle', 2.2, 12, idle),
  loopClip('run', 0.5, 16, run),
  loopClip('attack', 0.8, 16, attack),
  onceClip('death', 1.2, 24, deathPose),
];

export default {
  name: 'wolf', joints: JOINTS, palette: PALETTE, parts: PARTS, clips: CLIPS,
  preview: 'idle@0.6,run@0.12,attack@0.4,death@1.1',
  previewGap: 48,
};
