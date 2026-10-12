// siege-kit.mjs — shared by the siege engines (catapult.mjs, orc-ballista.mjs): machines on wheels
// with no body. Exact ground contact from the generated vertices (an octagonal wheel rolls on its
// corners, a fallen piece rests on its lowest corner), the tip of the frame onto a corner whose
// wheel broke off, and debris: pieces that break off and fall to a rest pose on the ground.
import { DEG, add, buildMesh, fromTo, lerp, norm, qrot, rig, rotZ, scale3, sub } from '../unit-glb.mjs';

export const SIDES = [1, -1];
export const I = [0, 0, 0, 1];
export const AXIS_X = rotZ(90 * DEG);   // a round part turned so that its axis runs along X
export const along = (c, h, r, n, joint, color) => ({ c, h, r, n, joint, color, q: AXIS_X });
export const beam = (a, b, w, joint, color) => ({ c: lerp(a, b, 0.5), s: [w, Math.hypot(...sub(b, a)), w], q: fromTo([0, 1, 0], sub(b, a)), joint, color });
// A four-sided spike from `base` along `dir`.
export function spike(base, dir, len, r, joint, color) {
  const d = norm(dir), c = add(base, scale3(d, len / 2));
  return { c, h: len, r: [r, 0.02], n: 4, q: fromTo([0, 1, 0], d), pivot: c, joint, color };
}

export const clamp01 = x => Math.min(1, Math.max(0, x));
export const smooth = x => { const k = clamp01(x); return k * k * (3 - 2 * k); };
// 0..1 -> 0..1 in `pulls` jerks: a windlass turned by handspikes.
export const ratchet = (k, pulls = 6) => k - Math.sin(2 * pulls * Math.PI * k) / (2 * pulls * Math.PI);
export const axisAngle = (axis, a) => [axis[0] * Math.sin(a / 2), axis[1] * Math.sin(a / 2), axis[2] * Math.sin(a / 2), Math.cos(a / 2)];
export function slerp(a, b, k) {
  let c = a.reduce((s, v, i) => s + v * b[i], 0);
  const sign = c < 0 ? -1 : 1;
  c = Math.min(1, Math.abs(c));
  const ang = Math.acos(c), sin = Math.sin(ang);
  const wa = sin < 1e-6 ? 1 - k : Math.sin((1 - k) * ang) / sin, wb = (sin < 1e-6 ? k : Math.sin(k * ang) / sin) * sign;
  return a.map((v, i) => v * wa + b[i] * wb);
}

// unit: { name, joints, palette, parts }; joint 0 is the frame (root).
export function machine(unit) {
  const { joints, parts } = unit, R = rig(joints), { J, worldOf, aimJoint, placeJoint } = R;
  const verts = parts.map((p) => {
    if (p.span) return [];
    const m = buildMesh({ name: unit.name, palette: unit.palette, joints, parts: [p] }), seen = new Map();
    for (let i = 0; i < m.positions.length; i += 3) {
      const v = sub(m.positions.slice(i, i + 3), joints[p.joint].at);
      seen.set(v.map(x => x.toFixed(6)).join(), v);
    }
    return [...seen.values()];
  });
  // Lowest vertex of the parts on one joint at world rotation q and position p (spans are skipped).
  const lowestOf = (joint, q, p) => parts.reduce((low, part, i) => (part.joint !== joint ? low
    : verts[i].reduce((l, v) => Math.min(l, p[1] + qrot(q, v)[1]), low)), Infinity);
  const lowest = (pose, list) => list.reduce((low, j) => {
    const w = worldOf(pose, j);
    return Math.min(low, lowestOf(j, w.q, w.p));
  }, Infinity);
  const subtree = j => [j, ...joints.flatMap((k, i) => (k.parent === j ? subtree(i) : []))];
  const root = joints[0];
  // The frame at its bind height, then lowered or lifted so that the lowest point of `list` is at `lift`.
  const ground = (pose, list, lift = 0) => {
    pose[root.name + '.translation'] = [...root.at];
    pose[root.name + '.translation'][1] += lift - lowest(pose, list);
    return pose;
  };
  const bindT = (name) => { const j = joints[J[name]]; return sub(j.at, joints[j.parent].at); };
  // The angle about `axis` at which the frame (`body`) comes down onto the ground next to the
  // wheels still on (`support`), the other joints at bind.
  const tiltAngle = (axis, body, support, max = 30 * DEG) => {
    const gap = (a) => { const pose = { [root.name + '.rotation']: axisAngle(axis, a) }; return lowest(pose, body) - lowest(pose, support); };
    if (!(gap(0) > 0 && gap(max) < 0)) throw new Error(`${unit.name}: the frame does not come down about this axis`);
    let lo = 0, hi = max;
    for (let i = 0; i < 50; i++) { const mid = (lo + hi) / 2; if (gap(mid) > 0) lo = mid; else hi = mid; }
    return lo;
  };
  // Debris: each piece goes from its world transform when it breaks off (u = from) to a rest pose
  // (x, z and a world rotation; the height is found so that the lowest corner of the piece and the
  // joints hanging on it touches the ground) along a parabola of height `arc`, never below the ground.
  // attached(u) is the death pose with every piece still on.
  const debris = (defs, attached) => {
    const list = defs.map((d) => {
      const j = J[d.name], tree = subtree(j), start = worldOf(attached(d.from), j), last = attached(1);
      aimJoint(last, d.name, d.q);
      placeJoint(last, d.name, [d.at[0], 0, d.at[1]]);
      return { ...d, j, tree, start, end: [d.at[0], -lowest(last, tree), d.at[1]] };
    });
    const apply = (pose, u) => {
      for (const d of list) {
        if (u <= d.from) continue;
        const k = clamp01((u - d.from) / (d.to - d.from)), p = lerp(d.start.p, d.end, k);
        p[1] += d.arc * 4 * k * (1 - k);
        aimJoint(pose, d.name, slerp(d.start.q, d.q, k));
        placeJoint(pose, d.name, p);
        const low = lowest(pose, d.tree);
        if (low < 0) { p[1] -= low; placeJoint(pose, d.name, p); }
      }
      return pose;
    };
    return { list, apply };
  };
  return { ...R, lowestOf, lowest, subtree, ground, bindT, tiltAngle, debris };
}
