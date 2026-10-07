// Convex rigid parts from the actual generated mesh, checked with the separating-axis theorem.
// Quaternion interpolation matches glTF LINEAR rotation tracks; include samples between keys.
import { buildMesh, add, sub, qrot, rig, cross, dot } from '../tools/unit-glb.mjs';
const unitAxes = vectors => {
  const result = [];
  for (const v of vectors) {
    const len = Math.hypot(...v);
    if (len < 1e-8) continue;
    const n = v.map(x => x / len);
    if (!result.some(a => Math.abs(dot(a, n)) > 1 - 1e-7)) result.push(n);
  }
  return result;
};
export function hull(unit, part) {
  const mesh = buildMesh({ ...unit, parts: [part] });
  const vertices = [];
  for (let i = 0; i < mesh.positions.length; i += 3) {
    const p = sub(mesh.positions.slice(i, i + 3), unit.joints[part.joint].at);
    if (!vertices.some(v => Math.hypot(...sub(v, p)) < 1e-8)) vertices.push(p);
  }
  const at = i => mesh.positions.slice(i * 3, i * 3 + 3), normals = [], edges = [];
  for (let i = 0; i < mesh.indices.length; i += 3) {
    const [a, b, c] = mesh.indices.slice(i, i + 3).map(at), ab = sub(b, a), ac = sub(c, a);
    normals.push(cross(ab, ac));
    edges.push(ab, ac, sub(c, b));
  }
  return { joint: part.joint, color: part.color, vertices, normals: unitAxes(normals), edges: unitAxes(edges) };
}
export function placed(hull, frame) {
  const vertices = hull.vertices.map(v => add(frame.p, qrot(frame.q, v)));
  return { ...hull, vertices, normals: hull.normals.map(v => qrot(frame.q, v)), edges: hull.edges.map(v => qrot(frame.q, v)), min: [0, 1, 2].map(k => Math.min(...vertices.map(v => v[k]))), max: [0, 1, 2].map(k => Math.max(...vertices.map(v => v[k]))) };
}
export function overlap(a, b, margin = 0) {
  if ([0, 1, 2].some(k => a.max[k] + margin < b.min[k] || b.max[k] + margin < a.min[k])) return false;
  for (const v of [...a.normals, ...b.normals, ...a.edges.flatMap(x => b.edges.map(y => cross(x, y)))]) {
    const len = Math.hypot(...v);
    if (len < 1e-8) continue;
    const av = a.vertices.map(p => dot(p, v)), bv = b.vertices.map(p => dot(p, v));
    if (Math.max(...av) + margin * len < Math.min(...bv) || Math.max(...bv) + margin * len < Math.min(...av)) return false;
  }
  return true;
}
export function sampledPose(clip, frame) {
  const a = Math.floor(frame), b = Math.min(a + 1, clip.times.length - 1), t = frame - a;
  return Object.fromEntries([...clip.tracks].map(([key, values]) => {
    const x = values[a], y = values[b];
    if (!key.endsWith('.rotation')) return [key, x.map((v, i) => v + (y[i] - v) * t)];
    let cosine = dot4(x, y), sign = cosine < 0 ? -1 : 1;
    cosine = Math.min(1, Math.abs(cosine));
    const angle = Math.acos(cosine), sin = Math.sin(angle);
    const u = sin < 1e-6 ? 1 - t : Math.sin((1 - t) * angle) / sin, v = sin < 1e-6 ? t : Math.sin(t * angle) / sin;
    const q = x.map((n, i) => n * u + y[i] * sign * v), length = Math.hypot(...q);
    return [key, q.map(n => n / length)];
  }));
}
const dot4 = (a, b) => a.reduce((sum, v, i) => sum + v * b[i], 0);
export function clashes(unit, clips, first, second, margin = 0.005) {
  const R = rig(unit.joints), a = unit.parts.filter(first).map(p => hull(unit, p)), b = unit.parts.filter(second).map(p => hull(unit, p));
  const found = [];
  for (const name of clips) {
    const clip = unit.clips.find(c => c.name === name);
    for (let f = 0; f <= (clip.times.length - 1) * 8; f++) {
      const pose = sampledPose(clip, f / 8), frames = unit.joints.map((_, j) => R.worldOf(pose, j));
      const pa = a.map(h => placed(h, frames[h.joint])), pb = b.map(h => placed(h, frames[h.joint]));
      for (const x of pa) for (const y of pb) if (overlap(x, y, margin)) {
        return [{ clip: name, frame: f / 8, time: clip.times.at(-1) * f / 8 / (clip.times.length - 1), a: unit.joints[x.joint].name + ':' + x.color, b: unit.joints[y.joint].name + ':' + y.color }];
      }
    }
  }
  return found;
}
