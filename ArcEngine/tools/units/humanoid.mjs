// humanoid.mjs — the body every infantry unit shares: 11 joints, face, limbs, the idle stance,
// the run cycle and the fall of the death clip. A unit appends its item joints after BODY, adds
// its own hair, headgear, clothes and weapon, and poses the arms itself.
import { DEG, qmul, rotX, rotY, rotZ } from '../unit-glb.mjs';

export const BODY = [
  { name: 'hips', at: [0, 0.90, 0], parent: -1 },
  { name: 'torso', at: [0, 0.96, 0], parent: 0 },
  { name: 'head', at: [0, 1.48, 0], parent: 1 },
  { name: 'armL', at: [0.27, 1.40, 0], parent: 1 },
  { name: 'foreL', at: [0.27, 1.12, 0], parent: 3 },
  { name: 'armR', at: [-0.27, 1.40, 0], parent: 1 },
  { name: 'foreR', at: [-0.27, 1.12, 0], parent: 5 },
  { name: 'legL', at: [0.10, 0.90, 0], parent: 0 },
  { name: 'shinL', at: [0.10, 0.47, 0], parent: 7 },
  { name: 'legR', at: [-0.10, 0.90, 0], parent: 0 },
  { name: 'shinR', at: [-0.10, 0.47, 0], parent: 9 },
];
export const B = Object.fromEntries(BODY.map((j, i) => [j.name, i]));
export const SIDES = [1, -1];   // left (+X), right (−X)
export const HAND = 0.27;       // forearm joint -> fist centre, where item joints sit
export const FIST_L = [0.27, 0.85, 0], FIST_R = [-0.27, 0.85, 0];

// Face, nose, eyes.
export const face = () => [
  { c: [0, 1.60, 0], s: [0.24, 0.24, 0.24], joint: B.head, color: 'skin' },
  { c: [0, 1.585, 0.135], s: [0.045, 0.06, 0.04], joint: B.head, color: 'skin' },
  ...SIDES.map(k => ({ c: [0.055 * k, 1.625, 0.122], s: [0.035, 0.03, 0.012], joint: B.head, color: 'eye' })),
];

// Arms and legs, left side then right, colours by piece; a piece without a colour is left out.
// c: { pauldron, upper, fore, fist, thigh, flap, shin, boot }. The skirt is split into flaps on
// the thighs: a running leg never cuts through it.
export const limbs = c => SIDES.flatMap((k) => {
  const arm = k > 0 ? B.armL : B.armR, fore = k > 0 ? B.foreL : B.foreR;
  const leg = k > 0 ? B.legL : B.legR, shin = k > 0 ? B.shinL : B.shinR;
  return [
    c.pauldron && { c: [0.27 * k, 1.425, 0], s: [0.16, 0.09, 0.16], joint: arm, color: c.pauldron },
    { c: [0.27 * k, 1.25, 0], s: [0.11, 0.30, 0.11], joint: arm, color: c.upper },
    { c: [0.27 * k, 1.00, 0], s: [0.10, 0.24, 0.10], joint: fore, color: c.fore },
    { c: [0.27 * k, 0.85, 0], s: [0.11, 0.10, 0.12], joint: fore, color: c.fist },
    { c: [0.10 * k, 0.685, 0], s: [0.15, 0.45, 0.15], joint: leg, color: c.thigh },
    c.flap && { c: [0.085 * k, 0.76, 0.118], s: [0.15, 0.30, 0.02], joint: leg, color: c.flap },
    c.flap && { c: [0.085 * k, 0.76, -0.118], s: [0.15, 0.30, 0.02], joint: leg, color: c.flap },
    { c: [0.10 * k, 0.34, 0], s: [0.13, 0.26, 0.13], joint: shin, color: c.shin },
    { c: [0.10 * k, 0.17, 0], s: [0.15, 0.18, 0.15], joint: shin, color: c.boot },
    { c: [0.10 * k, 0.045, 0.025], s: [0.15, 0.09, 0.21], joint: shin, color: c.boot },
  ].filter(Boolean);
});

// Arms by angles (degrees). The model faces +Z: a hanging limb swings FORWARD on a NEGATIVE
// angle about X; lz > 0 / rz < 0 move the arms outwards.
export const armAngles = (p, pose) => Object.assign(pose, {
  'armL.rotation': qmul(rotZ(p.lz * DEG), rotX(p.lx * DEG)),
  'foreL.rotation': rotX(p.flx * DEG),
  'armR.rotation': qmul(rotZ(p.rz * DEG), rotX(p.rx * DEG)),
  'foreR.rotation': rotX(p.frx * DEG),
});

// Idle: breathing, a slow look around, feet a little apart. t in [0, 2π).
export const idleBody = t => ({
  'hips.translation': [0, 0.90 + 0.006 * Math.sin(t), 0],
  'torso.rotation': rotX(1.5 * DEG * Math.sin(t)),
  'head.rotation': rotY(6 * DEG * Math.sin(t)),
  'legL.rotation': rotZ(3 * DEG),
  'legR.rotation': rotZ(-3 * DEG),
});

// Run: legs ±42°, shins fold after the swing, the hips bounce twice a cycle.
export const runBody = t => ({
  'hips.translation': [0, 0.88 + 0.035 * Math.abs(Math.sin(t)), 0],
  'torso.rotation': rotX(9 * DEG),
  'head.rotation': rotX(-5 * DEG),
  'legL.rotation': rotX(-42 * DEG * Math.sin(t)),
  'legR.rotation': rotX(42 * DEG * Math.sin(t)),
  'shinL.rotation': rotX(70 * DEG * Math.max(0, Math.sin(t - 2.2))),
  'shinR.rotation': rotX(70 * DEG * Math.max(0, Math.sin(t - 2.2 + Math.PI))),
});

// Death, u from 0 to 1: the knees buckle (b), then a fall on the back (fall, accelerating).
export function deathBody(u) {
  const buckle = Math.min(1, u / 0.3), b = buckle * buckle * (3 - 2 * buckle);
  const fall = Math.min(1, Math.max(0, (u - 0.25) / 0.75)) ** 2;
  return {
    b, fall, pose: {
      'hips.translation': [0, 0.90 - 0.10 * b - 0.66 * fall, -0.25 * fall],
      'hips.rotation': rotX(-86 * DEG * fall),
      'torso.rotation': rotX((12 * b - 12 * fall) * DEG),
      'head.rotation': rotX((15 * b + 10 * fall) * DEG),
      'legL.rotation': rotX(-12 * DEG * fall),
      'legR.rotation': rotX(-12 * DEG * fall),
      'shinL.rotation': rotX((30 * b - 12 * fall) * DEG),
      'shinR.rotation': rotX((30 * b - 12 * fall) * DEG),
    },
  };
}
