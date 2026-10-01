// Horse: a low-poly riding horse for a strategy game, 1.5 m at the withers, 2.1 m to the ears,
// 2.3 m nose to rump. Bay coat, dark mane and tail, white blaze and socks, team-coloured saddle
// blanket, leather saddle with stirrups. Faces +Z (the glTF front), +X is its left. No rider:
// the `saddle` joint sits where a rider's hips go, the rider is parented to it
// (Model3D.mount, the swordsman's `ride` clips). Clips: "idle" and "run" (both looped).
import { DEG, loopClip, qmul, rotX, rotY, rotZ } from '../unit-glb.mjs';
import { SIDES } from './humanoid.mjs';

const JOINTS = [
  { name: 'body', at: [0, 1.15, 0], parent: -1 },
  { name: 'neck', at: [0, 1.40, 0.50], parent: 0 },
  { name: 'head', at: [0, 1.82, 0.85], parent: 1 },
  { name: 'tail', at: [0, 1.30, -0.64], parent: 0 },
  { name: 'legFL', at: [0.17, 1.00, 0.50], parent: 0 },
  { name: 'shinFL', at: [0.17, 0.55, 0.50], parent: 4 },
  { name: 'legFR', at: [-0.17, 1.00, 0.50], parent: 0 },
  { name: 'shinFR', at: [-0.17, 0.55, 0.50], parent: 6 },
  { name: 'legHL', at: [0.17, 1.02, -0.52], parent: 0 },
  { name: 'shinHL', at: [0.17, 0.55, -0.52], parent: 8 },
  { name: 'legHR', at: [-0.17, 1.02, -0.52], parent: 0 },
  { name: 'shinHR', at: [-0.17, 0.55, -0.52], parent: 10 },
  { name: 'saddle', at: [0, 1.57, -0.12], parent: 0 },   // top of the seat: a rider's hips rest here
];
const J = Object.fromEntries(JOINTS.map((j, i) => [j.name, i]));

// "team" and "teamDark" are the faction colours, the same texels as on the infantry.
const PALETTE = [
  { name: 'coat', hex: '#8a5a3a' },
  { name: 'coatDark', hex: '#6b4128' },
  { name: 'mane', hex: '#2b1d14' },
  { name: 'blaze', hex: '#e9e2d3' },
  { name: 'hoof', hex: '#3a2c22' },
  { name: 'eye', hex: '#1b130d' },
  { name: 'team', hex: '#2f5da8' },
  { name: 'teamDark', hex: '#22447d' },
  { name: 'trim', hex: '#e2b545' },
  { name: 'leather', hex: '#6a4325' },
  { name: 'steel', hex: '#aab2ba' },
];

// The neck leans forward from its base; the head hangs from the neck top, nose down. Parts are
// written in the part's own frame and turned by q about the joint (box long side along Z).
const NECK_BASE = JOINTS[J.neck].at, NECK_Q = rotX(40 * DEG);
const neck = (y, part) => ({ ...part, c: [0, NECK_BASE[1] + y, NECK_BASE[2] + (part.dz || 0)], joint: J.neck, q: NECK_Q, pivot: NECK_BASE });
const HEAD_AT = JOINTS[J.head].at, HEAD_Q = rotX(45 * DEG);
const head = (dx, dy, dz, part) => ({ ...part, c: [dx, HEAD_AT[1] + dy, HEAD_AT[2] + dz], joint: J.head, q: HEAD_Q, pivot: HEAD_AT });

const legs = SIDES.flatMap((k) => [true, false].flatMap((front) => {
  const side = k > 0 ? 'L' : 'R', x = 0.17 * k, z = front ? 0.50 : -0.52;
  const leg = J[(front ? 'legF' : 'legH') + side], shin = J[(front ? 'shinF' : 'shinH') + side];
  const upper = front ? { c: [x, 0.78, z], s: [0.16, 0.46, 0.18] } : { c: [x, 0.80, z], s: [0.20, 0.50, 0.30] };
  return [
    { ...upper, joint: leg, color: 'coat' },
    { c: [x, 0.325, z + 0.01], s: [0.10, 0.45, 0.11], joint: shin, color: 'coatDark' },
    { c: [x, 0.17, z + 0.01], s: [0.108, 0.16, 0.118], joint: shin, color: 'blaze' },
    { c: [x, 0.05, z + 0.02], s: [0.13, 0.10, 0.15], joint: shin, color: 'hoof' },
  ];
}));

const PARTS = [
  // Body: belly, chest and rump as three boxes.
  { c: [0, 1.13, -0.05], s: [0.44, 0.58, 0.80], joint: J.body, color: 'coat' },
  { c: [0, 1.17, 0.42], s: [0.49, 0.62, 0.30], joint: J.body, color: 'coat' },
  { c: [0, 1.17, -0.50], s: [0.48, 0.60, 0.34], joint: J.body, color: 'coat' },
  // Neck with a mane along its back, head with brow band, blaze, nostrils, eyes and ears.
  neck(0.275, { s: [0.24, 0.55, 0.26], color: 'coat' }),
  neck(0.275, { s: [0.08, 0.58, 0.10], dz: -0.14, color: 'mane' }),
  head(0, 0, 0.06, { s: [0.22, 0.28, 0.32], color: 'coat' }),
  head(0, -0.02, 0.33, { s: [0.15, 0.17, 0.24], color: 'coat' }),
  head(0, 0.146, 0.06, { s: [0.05, 0.012, 0.30], color: 'blaze' }),
  head(0, 0.071, 0.33, { s: [0.05, 0.012, 0.22], color: 'blaze' }),
  head(0, 0.15, -0.03, { s: [0.07, 0.10, 0.12], color: 'mane' }),
  head(0, 0, 0.17, { s: [0.232, 0.292, 0.03], color: 'leather' }),
  head(0, -0.02, 0.36, { s: [0.162, 0.182, 0.03], color: 'leather' }),
  ...SIDES.map(k => head(0.113 * k, 0.03, 0.12, { s: [0.012, 0.05, 0.05], color: 'eye' })),
  ...SIDES.map(k => head(0.04 * k, 0, 0.456, { s: [0.035, 0.035, 0.012], color: 'eye' })),
  ...SIDES.map(k => ({ c: [0.07 * k, 2.01, 0.93], h: 0.14, r: [0.04, 0.012], n: 4, joint: J.head, q: rotX(12 * DEG), color: 'coatDark' })),
  // Tail: a tapering hank hanging from the rump, swept back a little.
  { c: [0, 1.025, -0.70], h: 0.55, r: [0.03, 0.07], n: 5, joint: J.tail, q: rotX(14 * DEG), pivot: [0, 1.30, -0.64], color: 'mane' },
  ...legs,
  // Saddle: team blanket (its edges at the outer edge of the hind thighs, 0.27 m) with a gold stripe, leather seat, pommel, cantle.
  { c: [0, 1.40, -0.12], s: [0.526, 0.20, 0.50], joint: J.saddle, color: 'team' },
  ...SIDES.map(k => ({ c: [0.2665 * k, 1.33, -0.12], s: [0.007, 0.04, 0.50], joint: J.saddle, color: 'trim' })),
  { c: [0, 1.535, -0.12], s: [0.30, 0.07, 0.40], joint: J.saddle, color: 'leather' },
  { c: [0, 1.60, 0.10], s: [0.14, 0.12, 0.05], joint: J.saddle, color: 'leather' },
  { c: [0, 1.60, -0.34], s: [0.24, 0.12, 0.06], joint: J.saddle, color: 'leather' },
  // Stirrups where the swordsman's `ride` pose puts his boots (sole 1.09 m up, 0.43 m aside).
  ...SIDES.flatMap(k => [
    { c: [0.362 * k, 1.29, 0.087], s: [0.02, 0.43, 0.035], q: rotZ(18 * k * DEG), joint: J.saddle, color: 'leather' },
    { c: [0.434 * k, 1.080, 0.087], s: [0.09, 0.022, 0.17], q: rotX(12 * DEG), joint: J.saddle, color: 'steel' },
  ]),
];

// Idle: breathing, the head sways slowly and dips, the tail flicks.
const idle = t => ({
  'body.translation': [0, 1.15 + 0.006 * Math.sin(t), 0],
  'neck.rotation': qmul(rotY(7 * DEG * Math.sin(t)), rotX((-2 + 4 * Math.sin(t - 1)) * DEG)),
  'head.rotation': rotX((3 * Math.sin(t + 0.6)) * DEG),
  'tail.rotation': qmul(rotZ(7 * DEG * Math.sin(t + 1)), rotX((6 + 4 * Math.sin(t)) * DEG)),
  'legFL.rotation': rotX(0), 'shinFL.rotation': rotX(0),
  'legFR.rotation': rotX(0), 'shinFR.rotation': rotX(0),
  'legHL.rotation': rotX(0), 'shinHL.rotation': rotX(0),
  'legHR.rotation': rotX(0), 'shinHR.rotation': rotX(0),
});

// Gallop: the pairs of legs swing against each other (reach / gather), the knees fold on the
// way forward, the body rises and pitches, the neck pumps, the tail streams.
const swing = (t, phase, amp, mid) => {
  const a = t + phase;
  return { leg: rotX(-(mid + amp * Math.sin(a)) * DEG), shin: rotX(85 * DEG * Math.max(0, Math.cos(a - 0.3)) ** 1.5) };
};
const run = (t) => {
  const fl = swing(t, 0, 40, 6), fr = swing(t, -0.5, 40, 6);
  const hl = swing(t, Math.PI - 0.2, 34, -4), hr = swing(t, Math.PI + 0.3, 34, -4);
  return {
    'body.translation': [0, 1.15 + 0.05 * Math.abs(Math.sin(t + 0.4)), 0],
    'body.rotation': rotX((-4 * Math.sin(t + 0.4)) * DEG),
    'neck.rotation': rotX((-4 + 7 * Math.sin(t - 0.8)) * DEG),
    'head.rotation': rotX((-6 + 4 * Math.sin(t - 1.4)) * DEG),
    'tail.rotation': qmul(rotZ(5 * DEG * Math.sin(2 * t)), rotX((38 + 8 * Math.sin(2 * t + 0.5)) * DEG)),
    'legFL.rotation': fl.leg, 'shinFL.rotation': fl.shin,
    'legFR.rotation': fr.leg, 'shinFR.rotation': fr.shin,
    'legHL.rotation': hl.leg, 'shinHL.rotation': hl.shin,
    'legHR.rotation': hr.leg, 'shinHR.rotation': hr.shin,
  };
};

const CLIPS = [
  loopClip('idle', 2.4, 12, idle),
  loopClip('run', 0.64, 16, run),
];

export default { name: 'horse', joints: JOINTS, palette: PALETTE, parts: PARTS, clips: CLIPS, preview: 'idle@0.6,run@0.16,run@0.48', previewGap: 62 };
