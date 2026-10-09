// orc-common.mjs — shared by the orc fortifications (orc-palisade-*, orc-timber-*, orc-stone-*):
// one 16-colour palette (dark crooked wood, rough dark stone, bone, hide, rust-black iron, fire, war
// paint) and the parts that make a wall orcish: spikes, skulls, tattered hide banners, horns, braziers
// and pointed merlons. Same frame as the other defence models: meters, feet at y = 0, outer face to +Z,
// a wall section runs along X and ends flush at x = +-5.
import { fromTo, norm, rotX, rotZ, DEG } from '../unit-glb.mjs';
import { box, masonry as humanMasonry, onFace, rnd, slit } from './stone-common.mjs';

export { box, onFace, rnd, slit };

export const PALETTE = [
  { name: 'stone', hex: '#6a665f' },
  { name: 'stoneDark', hex: '#46433f' },
  { name: 'stoneLight', hex: '#857f73' },
  { name: 'slit', hex: '#1c1a1a' },
  { name: 'wood', hex: '#5a3c26' },
  { name: 'woodDark', hex: '#3f2a1a' },
  { name: 'woodLight', hex: '#77532f' },
  { name: 'char', hex: '#26201c' },
  { name: 'bone', hex: '#d8cfb3' },
  { name: 'hide', hex: '#7a5a3a' },
  { name: 'iron', hex: '#4a4d52' },
  { name: 'earth', hex: '#4d3f2b' },
  { name: 'red', hex: '#8a2a20' },
  { name: 'fire', hex: '#e8782a' },
  { name: 'team', hex: '#2f5da8' },
  { name: 'teamDark', hex: '#22447d' },
];

// Masonry of the human stone wall, but the odd light block at the foot is a bone, not moss.
export const masonry = o => humanMasonry(o).map(p => (p.color === 'moss' ? { ...p, color: 'bone' } : p));

// A four-sided spike from `base` along `dir`, `len` long, `r` wide at the foot.
export function spike(base, dir, len, r, color = 'char') {
  const d = norm(dir), c = base.map((v, k) => v + d[k] * len / 2);
  return { c, h: len, r: [r, 0.02], n: 4, q: fromTo([0, 1, 0], d), pivot: c, color };
}

// A spike sticking out of a vertical face, pointing outwards and a little up (`up` is the slope).
export function faceSpike(axis, sign, plane, u, y, len = 0.8, r = 0.07, up = 0.35, color = 'char') {
  const base = axis === 'z' ? [u, y, sign * plane] : [sign * plane, y, u];
  return spike(base, axis === 'z' ? [0, up, sign] : [sign, up, 0], len, r, color);
}

// A skull on a vertical face looking outwards: cranium, jaw, two eye sockets; `tusks` adds two.
export function skull(axis, sign, plane, u, y, s = 1, tusks = false) {
  const put = onFace(axis, sign, plane, 0);
  return [
    put(u, y + 0.04 * s, 0.13 * s, 0.3 * s, 0.26 * s, 0.26 * s, 'bone'),
    put(u, y - 0.14 * s, 0.15 * s, 0.2 * s, 0.1 * s, 0.2 * s, 'bone'),
    put(u - 0.075 * s, y + 0.05 * s, 0.265 * s, 0.08 * s, 0.08 * s, 0.03 * s, 'slit'),
    put(u + 0.075 * s, y + 0.05 * s, 0.265 * s, 0.08 * s, 0.08 * s, 0.03 * s, 'slit'),
    ...(tusks ? [-1, 1].map(k => put(u + k * 0.1 * s, y - 0.05 * s, 0.27 * s, 0.045 * s, 0.17 * s, 0.045 * s, 'bone')) : []),
  ];
}

// A tattered banner of hide on a bone bar: three strips of different length in the team colour, a
// war-paint badge and a small skull above the bar.
export function banner(axis, sign, plane, u, yTop, w = 0.9, h = 1.6) {
  const put = onFace(axis, sign, plane, 0);
  const lens = [h * 0.85, h, h * 0.65];
  return [
    put(u, yTop, 0.09, w + 0.3, 0.1, 0.1, 'bone'),
    ...lens.map((len, i) => put(u + (i - 1) * (w / 3), yTop - 0.05 - len / 2, 0.07, w / 3 - 0.025, len, 0.04, i === 1 ? 'teamDark' : 'team')),
    put(u, yTop - 0.5, 0.1, 0.26, 0.26, 0.04, 'red'),
    ...skull(axis, sign, plane + 0.05, u, yTop + 0.2, 0.7),
  ];
}

// A fire bowl on a post: the fire is the one bright thing on a dark wall.
export const brazier = (x, y, z) => [
  box([x, y - 0.35, z], [0.12, 0.7, 0.12], 'woodDark'),
  { c: [x, y + 0.02, z], h: 0.28, r: [0.18, 0.3], n: 6, color: 'iron' },
  { c: [x, y + 0.3, z], h: 0.42, r: [0.2, 0.02], n: 4, color: 'fire' },
];

// A horn: two bone spikes, the second turned up from the tip of the first.
export function horn(base, dir, len, r = 0.09) {
  const d = norm(dir), tip = base.map((v, k) => v + d[k] * len * 0.6);
  return [spike(base, d, len * 0.6, r, 'bone'), spike(tip, [d[0], d[1] + 1.1, d[2]], len * 0.55, r * 0.65, 'bone')];
}

// A pointed merlon: a box with a diamond on top (the upper half shows as a 45 degree peak, same
// colour, so it reads as one shape). axis 'z' — on a Z face (width along X), 'x' — on an X face.
export function pointed(a, yBase, b, w, h, t, color, axis = 'z') {
  const s = w / Math.SQRT2, z = axis === 'z';
  const at = [z ? a : b, yBase + h, z ? b : a];
  return [
    box([at[0], yBase + h / 2, at[2]], z ? [w, h, t] : [t, h, w], color),
    box(at, z ? [s, s, t] : [t, s, s], color, { q: z ? rotZ(45 * DEG) : rotX(45 * DEG), pivot: at }),
  ];
}

// `n` pointed merlons along a wall top `len` long, each with a charred tip. `across` is the fixed
// coordinate (z for axis 'z', x for axis 'x'); heights vary a little: nothing here is straight.
export function merlons(len, n, yBase, across, w, h, t, color, axis = 'z', tip = 'char', seed = 0) {
  const pitch = len / n, out = [];
  for (let i = 0; i < n; i++) {
    const u = -len / 2 + pitch * (i + 0.5), hh = h * (0.85 + 0.3 * rnd(i + seed, 5)), z = axis === 'z';
    out.push(...pointed(u, yBase, across, w, hh, t, color, axis));
    const top = yBase + hh + w / 2 + 0.15;
    out.push({ c: z ? [u, top, across] : [across, top, u], h: 0.4, r: [0.05, 0.015], n: 4, color: tip });
  }
  return out;
}

// A beam along the line a -> b, square section w.
export function beam(a, b, w, color) {
  const d = b.map((v, k) => v - a[k]), len = Math.hypot(...d), c = a.map((v, k) => (v + b[k]) / 2);
  return box(c, [w, w, len], color, { q: fromTo([0, 0, 1], d), pivot: c });
}

const LOG_COLORS = ['wood', 'woodDark', 'woodLight'];
// One palisade log standing at x (index i drives its height, lean and colour): a six-sided trunk
// with a charred point, leaning outwards (+Z) a few degrees; `lean` overrides the angle (degrees).
// Returns { parts, front } — front(y) is where the log's outer face is at height y.
export function palisadeLog(i, x, R = 0.27, opts = {}) {
  const { min = 3.2, span = 1.1, tip = 0.55, lean = 1.5 + 5 * rnd(i, 2), color } = opts;
  const h = min + span * rnd(i, 1), z = (rnd(i, 3) - 0.5) * 0.12, a = lean * DEG;
  // Leaning turns the front foot of the log below the ground: lift it by that much.
  const dip = R * Math.sqrt(3) / 2 * Math.sin(a), pivot = [x, dip, z];
  const q = rotX(a), c = color || LOG_COLORS[i % 3];
  return {
    h,
    parts: [
      { c: [x, dip + (h - tip) / 2, z], h: h - tip, r: [R, R], n: 6, q, pivot, color: c },
      { c: [x, dip + h - tip / 2, z], h: tip, r: [R, 0.03], n: 6, q, pivot, color: 'char' },
    ],
    front: y => z + R * Math.sqrt(3) / 2 + y * Math.tan(a),
  };
}

// Rows of spikes on a face between u0 and u1 (every `step`), at each height of `ys`; lengths and
// slopes are uneven so the row reads as thrown together, not as a fence of nails.
export function spikeRows(axis, sign, plane, u0, u1, ys, step = 1.2, seed = 0, color = 'bone') {
  const out = [];
  ys.forEach((y, r) => {
    for (let u = u0 + step / 2 + (r % 2) * step / 3, i = 0; u < u1 - 0.1; u += step, i++) {
      out.push(faceSpike(axis, sign, plane, u, y + (rnd(seed + i, r) - 0.5) * 0.2, 0.55 + 0.45 * rnd(seed + i, r + 4), 0.07, 0.15 + 0.4 * rnd(seed + i, r + 8), color));
    }
  });
  return out;
}

// The wall walk of a 10 m section whose top is at `walk` and thickness `thick`: decking, an inner
// curb, an outer parapet, six pointed merlons and a skull in three of the gaps.
export function wallTop({ walk, thick, deck, parapet, merlon, len = 10, n = 6 }) {
  const half = thick / 2, pt = 0.45, zp = half - pt / 2, out = [];
  out.push(box([0, walk - 0.05, -pt / 2], [len, 0.1, thick - pt], deck));
  for (let x = -len / 2 + 1; x < len / 2 - 0.5; x += 1) out.push(box([x, walk + 0.003, -pt / 2], [0.03, 0.01, thick - pt], 'woodDark'));
  out.push(box([0, walk + 0.1, -half + 0.1], [len, 0.2, 0.2], 'woodDark'));
  out.push(box([0, walk + 0.25, zp], [len, 0.5, pt], parapet));
  out.push(...merlons(len, n, walk + 0.5, zp, 0.9, 0.55, pt, merlon));
  const pitch = len / n;
  for (const k of [1, 3, 5]) out.push(...skull('z', 1, half, -len / 2 + pitch * k, walk + 0.27, 0.9));
  return out;
}
