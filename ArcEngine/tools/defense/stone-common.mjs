// stone-common.mjs — shared by the stone fortifications (stone-wall-segment, stone-tower,
// stone-gate): palette, masonry courses drawn as thin proud boxes on a face, and the crenellated
// wall walk of a 10 m section. Model space as everywhere in 3D-models-defense: meters, feet at
// y = 0, the outer face looks to +Z, a section runs along X and ends flush at x = +-5.
export const PALETTE = [
  { name: 'stone', hex: '#8d8a82' },
  { name: 'stoneDark', hex: '#66635d' },
  { name: 'stoneLight', hex: '#aaa699' },
  { name: 'moss', hex: '#5f7d3f' },
  { name: 'slit', hex: '#25282e' },
  { name: 'wood', hex: '#7a5632' },
  { name: 'woodDark', hex: '#5e4125' },
  { name: 'woodLight', hex: '#a37a48' },
  { name: 'rail', hex: '#4a331e' },
  { name: 'iron', hex: '#37373b' },
  { name: 'earth', hex: '#6b5a3f' },
  { name: 'team', hex: '#2f5da8' },
  { name: 'teamDark', hex: '#22447d' },
];

export const THICK = 1.8;                 // wall thickness (z from -0.9 to 0.9)
export const PLINTH = 0.5;                // height of the stone footing
export const WALK = 5.4;                  // top of the wall: the wall walk
export const PARAPET = 0.5;               // parapet thickness (on the outer, +Z side)
export const MERLON_H = 0.75;             // merlon height above the parapet base (0.5)

export const box = (c, s, color, extra) => ({ c, s, color, ...extra });
// Deterministic noise in [0, 1): the same model on every run.
export const rnd = (a, b = 0) => {
  const v = Math.sin(a * 127.1 + b * 311.7) * 43758.5453;
  return v - Math.floor(v);
};

// A box on a vertical face: u along the face, y up, d outwards from the face plane.
export function onFace(axis, sign, plane, mid = 0) {
  return (u, y, d, su, sy, sd, color) => axis === 'z'
    ? box([mid + u, y, sign * (plane + d)], [su, sy, sd], color)
    : box([sign * (plane + d), y, mid + u], [sd, sy, su], color);
}

// Courses of masonry on a face: dark bands between courses, staggered joints, and a few lighter
// (or, at the foot, mossy) blocks. Every mark stands 0.02 m proud (0.035 for the blocks).
export function masonry({ axis, sign, plane, mid = 0, len, y0, y1, course, block, seed = 0, light = 0.13 }) {
  const put = onFace(axis, sign, plane, mid);
  const n = Math.max(1, Math.round((y1 - y0) / course)), ch = (y1 - y0) / n, out = [];
  for (let k = 1; k < n; k++) out.push(put(0, y0 + k * ch, 0.01, len, 0.04, 0.02, 'stoneDark'));
  for (let k = 0; k < n; k++) {
    const ym = y0 + (k + 0.5) * ch, edges = [-len / 2];
    for (let u = -len / 2 + block * (0.3 + 0.5 * (k % 2)) + (rnd(seed, k) - 0.5) * 0.3; u < len / 2 - 0.25; u += block) {
      if (u > -len / 2 + 0.25) { edges.push(u); out.push(put(u, ym, 0.01, 0.04, ch - 0.04, 0.02, 'stoneDark')); }
    }
    edges.push(len / 2);
    for (let i = 0; i + 1 < edges.length; i++) {
      const a = edges[i], b = edges[i + 1], r = rnd(seed + i * 7.3, k + 3);
      if (b - a < 0.5) continue;
      if (r < light) out.push(put((a + b) / 2, ym, 0.0175, b - a - 0.1, ch - 0.1, 0.035, k === 0 && r < light / 2 ? 'moss' : 'stoneLight'));
    }
  }
  return out;
}

// Paving, an inner curb, the outer parapet and six merlons with caps for a 10 m section whose
// wall top is at WALK: archers stand on the paving, behind the parapet.
export function wallTop(len = 10, merlons = 6) {
  const half = THICK / 2, zp = half - PARAPET / 2, pitch = len / merlons;
  const out = [
    box([0, WALK + 0.03, (-half + 0.15 + half - PARAPET) / 2], [len, 0.06, THICK - 0.15 - PARAPET], 'stoneLight'),
    box([0, WALK + 0.125, -half + 0.075], [len, 0.25, 0.15], 'stoneDark'),
    box([0, WALK + 0.25, zp], [len, 0.5, PARAPET], 'stone'),
  ];
  for (let i = 0; i < merlons; i++) {
    const x = -len / 2 + pitch * (i + 0.5);
    out.push(box([x, WALK + 0.5 + MERLON_H / 2, zp], [1.0, MERLON_H, PARAPET], 'stone'));
    out.push(box([x, WALK + 0.5 + MERLON_H + 0.04, zp], [1.12, 0.08, PARAPET + 0.1], 'stoneLight'));
  }
  return out;
}

// A hanging banner on a face: bar, cloth, trim and a badge in the team colours.
export function banner(axis, sign, plane, u, yTop, w = 0.9, h = 1.6, mid = 0) {
  const put = onFace(axis, sign, plane, mid), yc = yTop - h / 2 - 0.05;
  return [
    put(u, yTop, 0.07, w + 0.2, 0.08, 0.1, 'woodDark'),
    put(u, yc, 0.07, w, h, 0.04, 'team'),
    put(u, yTop - h + 0.1, 0.085, w, 0.14, 0.04, 'teamDark'),
    put(u, yc + 0.15, 0.095, 0.3, 0.3, 0.04, 'teamDark'),
  ];
}

// An arrow slit: a dark frame and the slit itself.
export function slit(axis, sign, plane, u, y, mid = 0) {
  const put = onFace(axis, sign, plane, mid);
  return [put(u, y, 0.0125, 0.3, 1.0, 0.025, 'stoneDark'), put(u, y, 0.02, 0.12, 0.8, 0.04, 'slit')];
}
