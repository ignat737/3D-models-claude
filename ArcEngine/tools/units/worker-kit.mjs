// worker-kit.mjs — what the two workers (worker.mjs, orc-worker.mjs) share: the felling axe and the
// pickaxe built upright through the right fist, and the clips idle, run, chop, mine, death.
// The tool joints hang on the TORSO. Stowed, a tool has one constant pose on the back (a V behind
// the shoulders), so it follows the body in every clip and in every blend; in use it is placed at
// the right fist every frame. Only the tool of the clip is in the hand: chop — the axe, mine — the
// pick, the other one stays on the back. EVERY clip sets both tools' tracks.
import { DEG, add, dot, loopClip, onceClip, qmul, qrot, rig, rotX, rotY, rotZ, sub, tween } from '../unit-glb.mjs';
import { armAngles, deathBody, idleBody, runBody } from './humanoid.mjs';

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

// The clips for a skeleton: JOINTS = [...BODY, axe, pick] (the tools on the torso), at(v) turns
// human-metre targets into this skeleton's (identity for a human), grow(pose) stretches the shared
// clips' hips track. back = { x, y, z }: where the lower end of each stowed haft sits behind the
// torso (the axe at +x, the pick at -x, the pick 9 cm further back), in this skeleton's metres.
export function workerClips({ JOINTS, at, grow, HAND, k, back }) {
  const { J, worldOf, aimJoint, placeJoint, reach } = rig(JOINTS);
  const GRIP = [0, 0.38 * k];   // where along the haft the left fist may close (the leather grip)
  const SHIN = JOINTS[J.shinL].at[1];
  const tilt = (lat, pitch) => qmul(rotZ(-lat * DEG), rotX(pitch * DEG));

  // Stowed: a constant pose relative to the torso. The axe edge faces back, the pick head spans
  // the back sideways; the hafts splay outward so the two never cross.
  const STOW = {};
  for (const [tool, side, aim, dz] of [
    ['axe', 1, qmul(rotZ(-14 * DEG), rotY(180 * DEG)), 0],
    ['pick', -1, qmul(rotZ(14 * DEG), rotY(90 * DEG)), -0.09],
  ]) {
    const e = {};
    aimJoint(e, tool, aim);
    placeJoint(e, tool, [side * back.x, back.y, back.z + dz]);
    STOW[tool] = { rotation: e[tool + '.rotation'], translation: e[tool + '.translation'] };
  }
  // Both tools on the back except `using`, which the caller has already put in the hand.
  const stow = (pose, using) => {
    for (const tool of ['axe', 'pick']) {
      if (tool === using) continue;
      pose[tool + '.rotation'] = STOW[tool].rotation;
      pose[tool + '.translation'] = STOW[tool].translation;
    }
    return pose;
  };

  // The tool joint at the right fist (+ slide along the haft), turned to the world rotation aim.
  const place = (pose, tool, fist, aim, slide) => {
    aimJoint(pose, tool, aim);
    placeJoint(pose, tool, add(fist, qrot(aim, [0, slide, 0])));
  };

  // Right fist at fist (human metres), the tool at aim, the left fist on the haft's grip at the
  // point nearest to the left shoulder. slide moves the tool along its haft through the fist.
  const hold = (pose, tool, fist, aim, slide = 0, poleR = [-1, -0.6, -0.4], poleL = [1, -0.8, 0.2]) => {
    reach(pose, 'armR', 'foreR', at(fist), poleR, HAND);
    const f = worldOf(pose, J.foreR);
    place(pose, tool, add(f.p, qrot(f.q, [0, -HAND, 0])), aim, slide);
    const { p } = worldOf(pose, J[tool]), up = qrot(aim, [0, 1, 0]), shoulder = worldOf(pose, J.armL).p;
    const along = Math.min(GRIP[1], Math.max(GRIP[0], dot(sub(shoulder, p), up)));
    reach(pose, 'armL', 'foreL', add(p, up.map(v => v * along)), poleL, HAND);
    return stow(pose, tool);
  };

  // The hips go down until the lower heel touches the ground: a lunge never sinks a foot.
  const ground = (pose) => {
    pose['hips.translation'] = [0, JOINTS[J.hips].at[1], 0];
    const heel = name => worldOf(pose, J[name]).p[1] + qrot(worldOf(pose, J[name]).q, [0, -SHIN, 0])[1];
    pose['hips.translation'] = [0, JOINTS[J.hips].at[1] - Math.min(heel('shinL'), heel('shinR')), 0];
    return pose;
  };

  // The legs and torso of a swing at pose params p: step (0..1) is the lunge.
  const stance = p => ground({
    'torso.rotation': qmul(rotY(p.ty * DEG), rotX(p.lean * DEG)),
    'head.rotation': qmul(rotY(-0.8 * p.ty * DEG), rotX(-0.8 * p.lean * DEG)),
    'legL.rotation': qmul(rotZ(4 * DEG), rotX(-(10 + 22 * p.step) * DEG)),
    'legR.rotation': qmul(rotZ(-4 * DEG), rotX((6 + 12 * p.step) * DEG)),
    'shinL.rotation': rotX((14 + 20 * p.step) * DEG),
    'shinR.rotation': rotX((10 + 18 * p.step) * DEG),
  });
  const swing = (tool, p) => hold(stance(p), tool, [p.hx, p.hy, p.hz], tilt(p.lat, p.pitch));

  // Chop: the haft lies flat, yaw (deg, 0 = forward, > 0 = to the left) turns it about the
  // vertical axis, and the axe edge leads the sweep. The right hand is the upper one.
  const flat = yaw => qmul(rotY(yaw * DEG), qmul(rotX(90 * DEG), rotY(90 * DEG)));
  const sweep = p => hold(stance(p), 'axe', [p.hx, p.hy, p.hz], flat(p.yaw), -0.12 * k);

  const READY = { u: 0, hx: -0.14, hy: 1.22, hz: 0.34, yaw: -50, ty: -20, lean: 6, step: 0.3 };
  const CHOP = [
    READY,
    { u: 0.30, hx: -0.18, hy: 1.22, hz: 0.26, yaw: -78, ty: -42, lean: 4, step: 0.1 },
    { u: 0.42, hx: -0.10, hy: 1.20, hz: 0.38, yaw: -10, ty: -12, lean: 10, step: 0.6 },
    { u: 0.50, hx: -0.04, hy: 1.18, hz: 0.40, yaw: 28, ty: 6, lean: 14, step: 1 },
    { u: 0.62, hx: -0.03, hy: 1.16, hz: 0.42, yaw: 32, ty: 8, lean: 14, step: 1 },
    { u: 0.85, hx: -0.12, hy: 1.20, hz: 0.38, yaw: -20, ty: -4, lean: 10, step: 0.5 },
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
    // At ease: arms hang, a slow look around, a tired stoop, both tools on the back.
    loopClip('idle', 2.6, 12, (t) => {
      const pose = armAngles({ lz: 6, lx: -4 - 2 * Math.sin(t), flx: -18, rz: -6, rx: -4 + 2 * Math.sin(t), frx: -18 }, grow(idleBody(t)));
      pose['torso.rotation'] = qmul(pose['torso.rotation'], rotX(4 * DEG));
      return stow(pose);
    }),
    // Run: the arms bent and swinging against the legs.
    loopClip('run', 0.64, 16, t => stow(armAngles({ lz: 6, lx: 38 * Math.sin(t), flx: -70, rz: -6, rx: -38 * Math.sin(t), frx: -70 }, grow(runBody(t))))),
    // Chop: a flat sideways sweep at a trunk in front: wind up to the right, twist, cut across.
    loopClip('chop', 1.0, 20, t => sweep(tween(t / (2 * Math.PI), CHOP))),
    // Mine: the pick over the head, a deep lunge, the point driven into the rock at the feet.
    loopClip('mine', 1.2, 24, t => swing('pick', tween(t / (2 * Math.PI), MINE))),
    // Death: the knees buckle, he falls on his back, arms flung out (the head a few degrees up:
    // flat along the model it sinks into any rise of the ground), the tools still on the back.
    onceClip('death', 1.3, 13, (u) => {
      const { b, fall, pose: body } = deathBody(u);
      return stow(armAngles({ lz: 8 + 45 * fall, lx: -8, flx: -20 + 10 * fall, rz: -8 - 50 * fall, rx: -40 + 30 * b, frx: -50 + 30 * fall }, grow(body)));
    }),
  ];
}
