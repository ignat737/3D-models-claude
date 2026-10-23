// ram-kit.mjs — shared by the battering rams (battering-ram.mjs, orc-battering-ram.mjs): a covered
// frame on four wheels with a log hung under the roof ridge on rigid hangers. The skeleton, the
// clips and the death are the same for both races; the unit files bring the palette and the parts.
//   joints: body, four wheels, log (the trunk: it only TRANSLATES, placed under the hangers every frame),
//           hangF / hangR (the two hangers, each turns on an axle fixed to the ridge beam by a stem:
//           parallel hangers carry the log along an arc without turning it), beamL / beamR (the halves of
//           the front cross beam, joined by a collar: they split when the log falls on them), roof (the
//           penthouse, flies off in death), pole + flag (the pennant, on the rear-left rail).
//   clips:  idle (the frame creaks, the log sways), run (the wheels make one turn per cycle, the log
//           rocks on the bumps), attack (the log is drawn back, held, swung forward and hits at HIT_TIME,
//           rebounds and swings back to rest — looped), death (once: the front-right wheel and the roof
//           (clockwise seen from the front) fly off, the log tears loose from the FRONT hanger (the hanger
//           stays on its axle and swings free), pivots about the rear hanger's lower end and falls on the
//           front cross beam, which splits in two and drops to the ground; the log then drops its nose
//           until only its front tip touches the ground).
import { DEG, add, buildMesh, loopClip, norm, onceClip, qconj, qmul, qrot, rotX, rotY, rotZ, sub } from '../unit-glb.mjs';
import { I, clamp01, machine, smooth } from './siege-kit.mjs';

// beam: the centre of the +X half of the front cross beam { x, y, z }.
export const ramJoints = ({ R, WX, WZ, pivotY, logY, hang, beam, roofY, pole, flagY }) => [
  { name: 'body', at: [0, R, 0], parent: -1 },
  { name: 'wheelFL', at: [WX, R, WZ], parent: 0 },
  { name: 'wheelFR', at: [-WX, R, WZ], parent: 0 },
  { name: 'wheelHL', at: [WX, R, -WZ], parent: 0 },
  { name: 'wheelHR', at: [-WX, R, -WZ], parent: 0 },
  { name: 'log', at: [0, logY, 0], parent: 0 },
  { name: 'hangF', at: [0, pivotY, hang[0]], parent: 0 },
  { name: 'hangR', at: [0, pivotY, hang[1]], parent: 0 },
  { name: 'beamL', at: [beam.x, beam.y, beam.z], parent: 0 },
  { name: 'beamR', at: [-beam.x, beam.y, beam.z], parent: 0 },
  { name: 'roof', at: [0, roofY, 0], parent: 0 },
  { name: 'pole', at: pole, parent: 0 },
  { name: 'flag', at: [pole[0], flagY, pole[2]], parent: 11 },
];
export const ramIndex = joints => Object.fromEntries(joints.map((j, i) => [j.name, i]));

const WHEELS = ['wheelFL', 'wheelFR', 'wheelHL', 'wheelHR'];

// cfg: name, joints, palette, parts, back/fwd (swing angles, deg), runSeconds, beam { top, z, halfZ } (the collar's top and the front cross beam's z extent), debris { wheel, roof, beamL, beamR, pole }
// — each { at: [x, z], q } — and the unit export extras (preview…).
export function makeRam({ name, joints, palette, parts, back = 30, fwd = 26, runSeconds = 1.6, beam, debris, extras = {} }) {
  const J = ramIndex(joints), WX = joints[J.wheelFL].at[0], WZ = joints[J.wheelFL].at[2];
  const M = machine({ name, joints, palette, parts });
  const { bindT, ground, worldOf } = M;
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
  // The log tears loose from the front hanger at U_TEAR and falls nose down about the rear hanger. The
  // front cross beam is in its way: the log lands on it (U_BEAM, found from the trunk's generated
  // vertices against the beam's top in the frame's own axes), the beam splits in two and drops, the log
  // falls on until its front tip meets the ground (found per frame from the generated vertices), bounces
  // and settles.
  const U_TEAR = 0.28, U_FALL = 0.46, PITCH_MAX = 45, HOLD = 0.06, GAP = 0.012;
  const bodyQ = (u) => {
    const jolt = u < 0.10 ? 3 * Math.sin(Math.PI * u / 0.10) : 0, k = clamp01((u - 0.08) / 0.22);
    const tipped = u < 0.30 ? TILT * k * k : u < 0.40 ? TILT * (1 - 0.15 * Math.sin(Math.PI * (u - 0.30) / 0.10)) : TILT;
    return qmul(tilt(tipped), rotZ(jolt * DEG));
  };
  const lurchAt = u => -12 * smooth(u / 0.25);
  // A free hanger settles where it hangs straight down in the world: the angle about X (+ back).
  const restAngle = (u) => { const v = qrot(qconj(bodyQ(u)), [0, -1, 0]); return Math.atan2(-v[2], -v[1]) / DEG; };
  const swingF = (u) => {
    const d = u - U_TEAR, rest = restAngle(u), a0 = lurchAt(U_TEAR) - restAngle(U_TEAR);
    return rest + a0 * Math.exp(-7 * d) * Math.cos(15 * d);
  };
  function frame(u) {
    const shake = u < 0.20 ? 2.2 * Math.sin(2 * Math.PI * 1.5 * u / 0.20) * smooth(u / 0.20) : 0;
    const lurch = lurchAt(u), drop = smooth((u - U_TEAR) / (U_FALL - U_TEAR));
    const pose = { 'body.rotation': bodyQ(u), 'flag.rotation': I };
    for (const piece of ['wheelFR', 'roof', 'pole', 'beamL', 'beamR']) {
      pose[piece + '.rotation'] = piece === 'roof' ? rotZ(shake * DEG) : I;
      pose[piece + '.translation'] = bindT(piece);
    }
    const aF = u <= U_TEAR ? lurch : swingF(u);
    const hang = pitch => Object.assign(pose, hung(aF, lurch - 8 * drop, pitch));
    ground(hang(0), u < WHEEL_OFF ? [...BASE, J.wheelFR] : BASE);
    return { pose, hang };
  }
  // The trunk is a prism between two rings: how high its lowest edge passes over the beam's top.
  const trunk = parts.filter(p => p.joint === J.log && p.r).sort((x, y) => y.h - x.h)[0];
  const rings = (() => {
    const mesh = buildMesh({ name, palette, joints, parts: [trunk] }), seen = new Map();
    for (let i = 0; i < mesh.positions.length; i += 3) {
      const v = sub(mesh.positions.slice(i, i + 3), joints[J.log].at);
      seen.set(v.map(x => x.toFixed(5)).join(), v);
    }
    const all = [...seen.values()], z0 = Math.min(...all.map(v => v[2])), z1 = Math.max(...all.map(v => v[2]));
    const a = all.filter(v => Math.abs(v[2] - z0) < 1e-6), b = all.filter(v => Math.abs(v[2] - z1) < 1e-6);
    return a.map(v => [v, b.find(w => Math.hypot(w[0] - v[0], w[1] - v[1]) < 1e-5)]);
  })();
  const clearance = (pose) => {
    const lw = worldOf(pose, J.log), bw = worldOf(pose, J.body), at = joints[J.body].at;
    const local = v => qrot(qconj(bw.q), sub(add(lw.p, qrot(lw.q, v)), bw.p));
    const top = beam.top - at[1], z = beam.z - at[2];
    let low = Infinity;
    for (const [a, b] of rings) {
      const A = local(a), B = local(b);
      for (const zt of [z - beam.halfZ, z + beam.halfZ]) {
        const t = (zt - A[2]) / (B[2] - A[2]);
        if (t >= 0 && t <= 1) low = Math.min(low, A[1] + t * (B[1] - A[1]) - top);
      }
    }
    return low;
  };
  const bisect = (ok) => {
    let lo = 0, hi = PITCH_MAX;
    if (ok(hi)) return hi;
    for (let i = 0; i < 40; i++) { const mid = (lo + hi) / 2; if (ok(mid)) lo = mid; else hi = mid; }
    return lo;
  };
  // The pitch (deg, + nose down) at which the log rests on the ground / just clears the beam, in frame u.
  const touch = (u) => { const { hang } = frame(u); return bisect(p => lowest(hang(p), [J.log]) > 0); };
  const limit = (u) => { const { hang } = frame(u); return bisect(p => clearance(hang(p)) >= GAP); };
  const free = tau => PITCH_MAX * clamp01((tau - U_TEAR) / (U_FALL - U_TEAR)) ** 2;
  let U_BEAM = -1;
  for (let i = 0; i <= 480 && U_BEAM < 0; i++) if (i / 480 > U_TEAR && free(i / 480) >= limit(i / 480)) U_BEAM = i / 480;
  if (U_BEAM < 0) throw new Error(name + ': the log never reaches the front cross beam');
  const tau = u => (u < U_BEAM ? u : u < U_BEAM + HOLD ? U_BEAM : u - HOLD);
  let U_LAND = -1;
  for (let i = 0; i <= 480 && U_LAND < 0; i++) {
    const u = i / 480;
    if (u > U_BEAM + HOLD && free(tau(u)) >= touch(u)) U_LAND = u;
  }
  if (U_LAND < 0) U_LAND = 1;
  const bump = (d, len, deg) => (d < 0 || d > len ? 0 : deg * Math.sin(Math.PI * d / len));
  const landing = d => (d < 0.08 ? bump(d, 0.08, 4) : bump(d - 0.08, 0.06, 1.2));
  function attached(u) {
    const { pose, hang } = frame(u);
    if (u <= U_TEAR) { hang(0); return pose; }
    let pitch = Math.min(free(tau(u)), touch(u));
    if (u < U_BEAM + HOLD) pitch = Math.min(pitch, limit(u));
    pitch -= bump(u - U_BEAM, HOLD, 1.5) + landing(u - U_LAND);
    hang(Math.max(0, pitch));
    return pose;
  }
  const DEBRIS = M.debris([
    { name: 'wheelFR', from: WHEEL_OFF, to: 0.36, ...debris.wheel, arc: 0.25 },
    { name: 'roof', from: 0.20, to: 0.54, ...debris.roof, arc: 0.9 },
    { name: 'beamL', from: U_BEAM, to: U_BEAM + 0.22, ...debris.beamL, arc: -0.3 },
    { name: 'beamR', from: U_BEAM, to: U_BEAM + 0.22, ...debris.beamR, arc: -0.3 },
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
