// worker-kit.mjs — what the two workers (worker.mjs, orc-worker.mjs) share: the felling axe and the
// pickaxe built upright through the right fist, and the clips idle, run, chop, mine.
// Both tools sit on their own joints; the one not in use is hidden by scale (never 0: a zero-scaled
// skinned normal becomes NaN) inside the fist. EVERY clip sets both scales, so a blend between two
// clips never leaves a tool at its bind scale.
import { DEG, add, dot, loopClip, onceClip, qmul, qrot, rig, rotX, rotY, rotZ, sub, tween } from '../unit-glb.mjs';
import { armAngles, deathBody, idleBody, runBody } from './humanoid.mjs';

const HIDE = [0.02, 0.02, 0.02], SHOW = [1, 1, 1];

// Tool parts in bind pose: the fist at FIST, the haft along +Y, the axe edge and the pick tips
// along +Z (the swing plane). k scales the tool, c names the palette entries it uses:
// { wood, grip, head, edge, team }.
export function toolParts(J, FIST, k, c) {
  const at = (y, z = 0) => add(FIST, [0, y * k, z * k]);
  const sz = (x, y, z) => [x * k, y * k, z * k];
  const haft = joint => ({ c: at(0.385), h: 0.83 * k, r: [0.03 * k, 0.025 * k], n: 6, joint, color: c.wood });
  const grip = joint => ({ c: at(0.18), h: 0.44 * k, r: [0.034 * k, 0.034 * k], n: 6, joint, color: c.grip });
  const axe = J.axe, pick = J.pick;
  return [
    haft(axe), grip(axe),
    { c: at(0.52), s: sz(0.055, 0.05, 0.055), joint: axe, color: c.team },
    { c: at(0.74), s: sz(0.07, 0.12, 0.07), joint: axe, color: c.head },
    { c: at(0.745, -0.07), s: sz(0.06, 0.09, 0.07), joint: axe, color: c.head },
    { c: at(0.74, 0.10), s: sz(0.035, 0.22, 0.13), joint: axe, color: c.edge },
    { c: at(0.74, 0.18), s: sz(0.02, 0.27, 0.03), joint: axe, color: c.edge },
    haft(pick), grip(pick),
    { c: at(0.52), s: sz(0.055, 0.05, 0.055), joint: pick, color: c.team },
    { c: at(0.82), s: sz(0.075, 0.09, 0.09), joint: pick, color: c.head },
    ...[1, -1].flatMap(s => [
      { c: at(0.815, 0.17 * s), s: sz(0.05, 0.05, 0.20), q: rotX(20 * s * DEG), joint: pick, color: c.head },
      { c: at(0.775, 0.32 * s), s: sz(0.035, 0.04, 0.10), q: rotX(20 * s * DEG), joint: pick, color: c.edge },
    ]),
  ];
}

// The clips for a skeleton: JOINTS = [...BODY, axe, pick], at(v) turns human-metre targets into
// this skeleton's (identity for a human), grow(pose) stretches the shared clips' hips track.
export function workerClips({ JOINTS, at, grow, HAND, k }) {
  const { J, worldOf, aimJoint, reach } = rig(JOINTS);
  const GRIP = [0, 0.38 * k];   // where along the haft the left fist may close (the leather grip)
  const SHIN = JOINTS[J.shinL].at[1];
  const tilt = (lat, pitch) => qmul(rotZ(-lat * DEG), rotX(pitch * DEG));
  const use = (pose, tool) => Object.assign(pose, { 'axe.scale': tool === 'axe' ? SHOW : HIDE, 'pick.scale': tool === 'pick' ? SHOW : HIDE });

  // Right fist at fist (human metres), the tool at aim, the left fist on the haft's grip at the
  // point nearest to the left shoulder.
  const hold = (pose, tool, fist, aim, poleR = [-1, -0.6, -0.4], poleL = [1, -0.8, 0.2]) => {
    reach(pose, 'armR', 'foreR', at(fist), poleR, HAND);
    aimJoint(pose, tool, aim, 0);
    const { p } = worldOf(pose, J[tool]), up = qrot(aim, [0, 1, 0]), shoulder = worldOf(pose, J.armL).p;
    const along = Math.min(GRIP[1], Math.max(GRIP[0], dot(sub(shoulder, p), up)));
    reach(pose, 'armL', 'foreL', add(p, up.map(v => v * along)), poleL, HAND);
    return use(pose, tool);
  };

  // The hips go down until the lower heel touches the ground: a lunge never sinks a foot.
  const ground = (pose) => {
    pose['hips.translation'] = [0, JOINTS[J.hips].at[1], 0];
    const heel = name => worldOf(pose, J[name]).p[1] + qrot(worldOf(pose, J[name]).q, [0, -SHIN, 0])[1];
    pose['hips.translation'] = [0, JOINTS[J.hips].at[1] - Math.min(heel('shinL'), heel('shinR')), 0];
    return pose;
  };

  // A swing at pose params p: step (0..1) is the lunge, the rest is read by hold().
  const swing = (tool, p) => hold(ground({
    'torso.rotation': qmul(rotY(p.ty * DEG), rotX(p.lean * DEG)),
    'head.rotation': qmul(rotY(-0.8 * p.ty * DEG), rotX(-0.8 * p.lean * DEG)),
    'legL.rotation': qmul(rotZ(4 * DEG), rotX(-(10 + 22 * p.step) * DEG)),
    'legR.rotation': qmul(rotZ(-4 * DEG), rotX((6 + 12 * p.step) * DEG)),
    'shinL.rotation': rotX((14 + 20 * p.step) * DEG),
    'shinR.rotation': rotX((10 + 18 * p.step) * DEG),
  }), tool, [p.hx, p.hy, p.hz], tilt(p.lat, p.pitch));

  const READY = { u: 0, hx: -0.16, hy: 1.25, hz: 0.25, lat: 6, pitch: 20, ty: -10, lean: 8, step: 0.3 };
  const CHOP = [
    READY,
    { u: 0.16, hx: -0.22, hy: 1.45, hz: 0.12, lat: 6, pitch: 0, ty: -22, lean: 2, step: 0.2 },
    { u: 0.30, hx: -0.22, hy: 1.58, hz: 0.0, lat: 4, pitch: -35, ty: -44, lean: -2, step: 0.1 },
    { u: 0.40, hx: -0.18, hy: 1.42, hz: 0.30, lat: 0, pitch: 20, ty: -16, lean: 10, step: 0.6 },
    { u: 0.50, hx: -0.09, hy: 1.12, hz: 0.34, lat: 12, pitch: 72, ty: 6, lean: 26, step: 1 },
    { u: 0.62, hx: -0.09, hy: 1.08, hz: 0.34, lat: 12, pitch: 76, ty: 6, lean: 27, step: 1 },
    { u: 0.85, hx: -0.13, hy: 1.20, hz: 0.28, lat: 18, pitch: 35, ty: -8, lean: 12, step: 0.5 },
    { ...READY, u: 1 },
  ];
  const READY_MINE = { u: 0, hx: -0.14, hy: 1.30, hz: 0.28, lat: 8, pitch: 30, ty: -8, lean: 10, step: 0.3 };
  const MINE = [
    READY_MINE,
    { u: 0.16, hx: -0.20, hy: 1.50, hz: 0.20, lat: 2, pitch: 0, ty: -16, lean: 0, step: 0.2 },
    { u: 0.32, hx: -0.20, hy: 1.62, hz: 0.04, lat: 4, pitch: -45, ty: -44, lean: -6, step: 0.1 },
    { u: 0.42, hx: -0.18, hy: 1.56, hz: 0.30, lat: 4, pitch: 25, ty: -22, lean: 10, step: 0.6 },
    { u: 0.52, hx: -0.07, hy: 0.95, hz: 0.45, lat: 6, pitch: 118, ty: -8, lean: 32, step: 1 },
    { u: 0.64, hx: -0.09, hy: 0.98, hz: 0.44, lat: 6, pitch: 112, ty: -8, lean: 31, step: 1 },
    { u: 0.86, hx: -0.13, hy: 1.30, hz: 0.30, lat: 10, pitch: 40, ty: -8, lean: 14, step: 0.5 },
    { ...READY_MINE, u: 1 },
  ];

  return [
    // At ease: the axe hangs from the right hand, a slow look around, a tired stoop.
    loopClip('idle', 2.6, 12, (t) => {
      const pose = armAngles({ lz: 6, lx: -4 - 2 * Math.sin(t), flx: -18, rz: 0, rx: 0, frx: 0 }, grow(idleBody(t)));
      pose['torso.rotation'] = qmul(pose['torso.rotation'], rotX(4 * DEG));
      reach(pose, 'armR', 'foreR', at([-0.29, 0.90 + 0.006 * Math.sin(t), 0.08]), [-0.5, -0.5, -1], HAND);
      aimJoint(pose, 'axe', tilt(0, 155), 0);
      return use(pose, 'axe');
    }),
    // Run: the axe over the right shoulder, the left arm swings against the legs.
    loopClip('run', 0.64, 16, (t) => {
      const pose = armAngles({ lz: 6, lx: 30 * Math.sin(t), flx: -35, rz: 0, rx: 0, frx: 0 }, grow(runBody(t)));
      reach(pose, 'armR', 'foreR', at([-0.40, 1.22 + 0.03 * Math.abs(Math.sin(t)), 0.14]), [-1, -0.6, 0.3], HAND);
      aimJoint(pose, 'axe', tilt(-10, -75 + 4 * Math.sin(2 * t)), 0);
      return use(pose, 'axe');
    }),
    // Chop: raise the axe behind the shoulder, bring it down into the trunk in front, rock it out.
    loopClip('chop', 1.0, 20, t => swing('axe', tween(t / (2 * Math.PI), CHOP))),
    // Mine: the pick over the head, a deep lunge, the point driven into the rock at the feet.
    loopClip('mine', 1.2, 24, t => swing('pick', tween(t / (2 * Math.PI), MINE))),
    // Death: the knees buckle, he falls on his back, the axe lies along the body rolled onto its
    // flat, the head a few degrees up (flat along the model it sinks into any rise of the ground).
    onceClip('death', 1.3, 13, (u) => {
      const { b, fall, pose: body } = deathBody(u);
      const pose = armAngles({ lz: 8 + 45 * fall, lx: -8, flx: -20 + 10 * fall, rz: -8 - 50 * fall, rx: -40 + 30 * b, frx: -50 + 30 * fall }, grow(body));
      aimJoint(pose, 'axe', qmul(worldOf(pose, J.hips).q, qmul(rotX((-4 + 12 * fall) * DEG), rotY(90 * DEG * fall))), 0);
      return use(pose, 'axe');
    }),
  ];
}
