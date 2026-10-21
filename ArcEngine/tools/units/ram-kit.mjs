// ram-kit.mjs — shared by the battering rams (battering-ram.mjs, orc-battering-ram.mjs): a covered
// frame on four wheels with a log hung under the roof ridge on rigid hangers. The skeleton, the
// clips and the death are the same for both races; the unit files bring the palette and the parts.
//   joints: body, four wheels, log (the trunk: it only TRANSLATES, placed under the hangers every frame),
//           hangF / hangR (the two hangers, each turns about its own top under the ridge beam: parallel
//           hangers carry the log along an arc without turning it), roof (the penthouse, flies off in
//           death), pole + flag (the pennant, on the rear-left rail).
//   clips:  idle (the frame creaks, the log sways), run (the wheels make one turn per cycle, the log
//           rocks on the bumps), attack (the log is drawn back, held, swung forward and hits at HIT_TIME,
//           rebounds and swings back to rest — looped), death (once: the front-right wheel and the roof
//           (clockwise seen from the front) fly off, the FRONT hanger tears away, the log pivots about the
//           rear hanger's lower end and drops its nose until only its front tip touches the ground).
import { DEG, add, loopClip, norm, onceClip, qmul, qrot, rotX, rotY, rotZ, sub } from '../unit-glb.mjs';
import { I, clamp01, machine, smooth } from './siege-kit.mjs';

export const ramJoints = ({ R, WX, WZ, pivotY, logY, hang, roofY, pole, flagY }) => [
  { name: 'body', at: [0, R, 0], parent: -1 },
  { name: 'wheelFL', at: [WX, R, WZ], parent: 0 },
  { name: 'wheelFR', at: [-WX, R, WZ], parent: 0 },
  { name: 'wheelHL', at: [WX, R, -WZ], parent: 0 },
  { name: 'wheelHR', at: [-WX, R, -WZ], parent: 0 },
  { name: 'log', at: [0, logY, 0], parent: 0 },
  { name: 'hangF', at: [0, pivotY, hang[0]], parent: 0 },
  { name: 'hangR', at: [0, pivotY, hang[1]], parent: 0 },
  { name: 'roof', at: [0, roofY, 0], parent: 0 },
  { name: 'pole', at: pole, parent: 0 },
  { name: 'flag', at: [pole[0], flagY, pole[2]], parent: 9 },
];
export const ramIndex = joints => Object.fromEntries(joints.map((j, i) => [j.name, i]));

const WHEELS = ['wheelFL', 'wheelFR', 'wheelHL', 'wheelHR'];

// cfg: name, joints, palette, parts, back/fwd (swing angles, deg), runSeconds, debris { wheel, roof, hang, pole }
// — each { at: [x, z], q } — and the unit export extras (preview…).
export function makeRam({ name, joints, palette, parts, back = 30, fwd = 26, runSeconds = 1.6, debris, extras = {} }) {
  const J = ramIndex(joints), WX = joints[J.wheelFL].at[0], WZ = joints[J.wheelFL].at[2];
  const M = machine({ name, joints, palette, parts });
  const { bindT, ground } = M;
  const ALL = joints.map((_, i) => i);
  const lowest = (pose, list = ALL) => M.lowest(pose, list);
  // The hangers turn by aF / aR (deg, + back, - forward) about their tops; the log hangs under them and
  // may also pitch (deg, + nose down) about the lower end of the REAR hanger.
  const L = joints[J.hangF].at[1] - joints[J.log].at[1];
  const REAR = [0, 0, joints[J.hangR].at[2] - joints[J.log].at[2]];
  const hung = (aF, aR = aF, pitch = 0) => {
    const r = aR * DEG, q = rotX(pitch * DEG);
    const lower = [0, L * (1 - Math.cos(r)), -L * Math.sin(r)];
    return {
      'hangF.rotation': rotX(aF * DEG), 'hangR.rotation': rotX(r),
      'log.rotation': q,
      'log.translation': add(bindT('log'), sub(lower, sub(qrot(q, REAR), REAR))),
    };
  };

  const idle = t => ground({
    'body.rotation': rotZ(0.12 * Math.sin(t) * DEG),
    ...hung(1.0 * Math.sin(t)),
    'roof.rotation': I,
    'flag.rotation': rotY((14 * Math.sin(t) + 5 * Math.sin(3 * t + 1)) * DEG),
  }, ALL);

  // Run: one wheel turn per cycle; the octagonal wheels roll on their corners (ground()).
  const run = (t) => {
    const wheel = rotX(t);
    return ground({
      'body.rotation': qmul(rotZ(0.6 * Math.sin(2 * t) * DEG), rotX(0.4 * Math.sin(4 * t) * DEG)),
      ...Object.fromEntries(WHEELS.map(w => [w + '.rotation', wheel])),
      ...hung(2.0 * Math.sin(2 * t - 0.5) + 0.8 * Math.sin(4 * t + 1)),
      'roof.rotation': I,
      'flag.rotation': rotY((10 * Math.sin(4 * t) + 4 * Math.sin(6 * t + 1)) * DEG),
    }, ALL);
  };

  // Attack, 2.4 s in 48 keys: a short hold, the log is drawn back (0.10–0.45), held and creaking
  // (to 0.52), swung forward fast (0.52–0.625) and stopped dead by the wall at key 30 (1.5 s); it
  // rebounds a little and swings back to rest (0.625–1.0). The frame kicks back at the hit.
  const F = 48, DURATION = 2.4, U_HIT = 30 / F;
  const swing = (u) => {      // angle of the hangers, deg: + back, - forward
    if (u < 0.10) return 0;
    if (u < 0.45) return back * smooth((u - 0.10) / 0.35);
    if (u < 0.52) return back + 0.8 * Math.sin(Math.PI * (u - 0.45) / 0.07);
    if (u < U_HIT) return back - (back + fwd) * ((u - 0.52) / (U_HIT - 0.52)) ** 2;
    const d = u - U_HIT, span = 1 - U_HIT;
    return -fwd * (1 - smooth(d / span)) + 5 * Math.sin(Math.PI * Math.min(1, d / 0.12)) * (d < 0.12 ? 1 : 0);
  };
  const attack = (t) => {
    const u = t / (2 * Math.PI), d = u - U_HIT;
    const kick = d >= 0 && d < 0.10 ? Math.sin(Math.PI * d / 0.10) : 0;
    const pose = ground({
      'body.rotation': qmul(rotX(-1.0 * kick * DEG), rotZ(0.4 * kick * DEG)),
      ...hung(swing(u)),
      'roof.rotation': rotZ(0.8 * kick * Math.cos(2 * Math.PI * 3 * d) * DEG),
      'flag.rotation': rotY((14 * Math.sin(t) + 5 * Math.sin(3 * t + 1) + 10 * kick) * DEG),
    }, ALL, 0.03 * kick);
    pose['body.translation'][2] -= 0.06 * kick;
    return pose;
  };

  // Death. The front-right wheel breaks off and the frame tips about the diagonal between the
  // rear-right and front-left wheels until its bare corner touches the ground.
  const DIAG = norm([2 * WX, 0, 2 * WZ]);
  const tilt = a => [DIAG[0] * Math.sin(a / 2), 0, DIAG[2] * Math.sin(a / 2), Math.cos(a / 2)];
  const BASE = [J.body, J.wheelFL, J.wheelHL, J.wheelHR];
  const TILT = M.tiltAngle(DIAG, [J.body], BASE.slice(1));
  const WHEEL_OFF = 0.06;
  // The front hanger tears off at U_TEAR; the log then falls nose down about the rear hanger until its
  // front tip meets the ground (found per frame from the generated vertices), bounces and settles.
  const U_TEAR = 0.28, U_FALL = 0.46, PITCH_MAX = 45;
  function frame(u) {
    const jolt = u < 0.10 ? 3 * Math.sin(Math.PI * u / 0.10) : 0;
    const k = clamp01((u - 0.08) / 0.22);
    const tipped = u < 0.30 ? TILT * k * k : u < 0.40 ? TILT * (1 - 0.15 * Math.sin(Math.PI * (u - 0.30) / 0.10)) : TILT;
    const shake = u < 0.20 ? 2.2 * Math.sin(2 * Math.PI * 1.5 * u / 0.20) * smooth(u / 0.20) : 0;
    const lurch = -12 * smooth(u / 0.25), drop = smooth((u - U_TEAR) / (U_FALL - U_TEAR));
    const pose = { 'body.rotation': qmul(tilt(tipped), rotZ(jolt * DEG)), 'flag.rotation': I };
    for (const piece of ['wheelFR', 'roof', 'pole', 'hangF']) {
      pose[piece + '.rotation'] = piece === 'roof' ? rotZ(shake * DEG) : I;
      pose[piece + '.translation'] = bindT(piece);
    }
    const hang = pitch => Object.assign(pose, hung(lurch, lurch - 8 * drop, pitch));
    ground(hang(0), u < WHEEL_OFF ? [...BASE, J.wheelFR] : BASE);
    return { pose, hang };
  }
  // The pitch at which the log's lowest vertex is on the ground under the frame of u.
  function touch(u) {
    const { pose, hang } = frame(u);
    let lo = 0, hi = PITCH_MAX;
    if (lowest(hang(hi), [J.log]) >= 0) return hi;
    for (let i = 0; i < 40; i++) {
      const mid = (lo + hi) / 2;
      if (lowest(hang(mid), [J.log]) > 0) lo = mid; else hi = mid;
    }
    return lo;
  }
  const falling = u => PITCH_MAX * clamp01((u - U_TEAR) / (U_FALL - U_TEAR)) ** 2;
  let U_LAND = 1;
  for (let i = 0; i <= 480 && U_LAND === 1; i++) if (i / 480 > U_TEAR && falling(i / 480) >= touch(i / 480)) U_LAND = i / 480;
  const bounce = (d) => {
    if (d < 0 || d > 0.14) return 0;
    return d < 0.08 ? 4 * Math.sin(Math.PI * d / 0.08) : 1.2 * Math.sin(Math.PI * (d - 0.08) / 0.06);
  };
  function attached(u) {
    const { pose, hang } = frame(u);
    hang(u <= U_TEAR ? 0 : Math.max(0, Math.min(falling(u), touch(u)) - bounce(u - U_LAND)));
    return pose;
  }
  const DEBRIS = M.debris([
    { name: 'wheelFR', from: WHEEL_OFF, to: 0.36, ...debris.wheel, arc: 0.25 },
    { name: 'roof', from: 0.20, to: 0.54, ...debris.roof, arc: 0.9 },
    { name: 'hangF', from: U_TEAR, to: 0.52, ...debris.hang, arc: 1.6 },
    { name: 'pole', from: 0.30, to: 0.60, ...debris.pole, arc: 0.3 },
  ], attached);
  const deathPose = u => DEBRIS.apply(attached(u), u);

  const clips = [
    loopClip('idle', 2.4, 24, idle),
    loopClip('run', runSeconds, 32, run),
    loopClip('attack', DURATION, F, attack),
    onceClip('death', 2.4, 48, deathPose),
  ];
  return {
    lowest, DEBRIS_JOINTS: DEBRIS.list.map(d => d.name), HIT_TIME: U_HIT * DURATION,
    unit: { name, joints, palette, parts, clips, ...extras },
  };
}

export { rotX, rotY, rotZ, qmul, DEG };
