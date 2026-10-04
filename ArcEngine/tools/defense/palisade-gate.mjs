// palisade-gate.mjs — a 10 m gate section for the palisade: sharpened logs on both sides, two tall
// gate posts joined by a lintel with a team banner, and a double leaf of planks with iron hinges and
// braces. Two models from one description: `palisade-gate` (leaves closed) and `palisade-gate-open`
// (leaves swung inward, the 4.2 m x 3.4 m opening is free). The section replaces a palisade segment:
// logs end flush at x = +-5, the same log pitch, rails and earth ridge. Same frame as the segment:
// meters, feet at y = 0, outer face to +Z, the wall runs along X.
import { fromTo } from '../unit-glb.mjs';

const PALETTE = [
  { name: 'wood', hex: '#7a5632' },
  { name: 'woodDark', hex: '#5e4125' },
  { name: 'woodLight', hex: '#a37a48' },
  { name: 'cut', hex: '#d2b078' },
  { name: 'rail', hex: '#4a331e' },
  { name: 'earth', hex: '#6b5a3f' },
  { name: 'team', hex: '#2f5da8' },
  { name: 'teamDark', hex: '#22447d' },
  { name: 'iron', hex: '#37373b' },
];

const LENGTH = 10, PITCH = LENGTH / 30, R = PITCH / 2, TIP = 0.5, BACK = -R;
const HEIGHTS = [3.0, 2.85, 3.15, 2.9, 3.05, 2.8, 3.1];
const BODY = ['wood', 'woodDark', 'woodLight'];
const SIDE_LOGS = 7;                                  // per side: x from 5 down to 5 - 7 pitches
const POST_X = 2.5, POST_R = 0.3, POST_H = 4.4;       // opening between the posts: 2 * (2.5 - 0.3) = 4.4
const OPEN_HALF = POST_X - POST_R;                    // 2.2: a leaf's length
const LEAF_H = 3.2, LEAF_T = 0.14, LINTEL_Y = 3.55;
const RAILS = [0.85, 1.95], RAIL_Z = BACK - 0.06;

const box = (c, s, color, extra) => ({ c, s, color, ...extra });
function beam(a, b, w, color) {
  const d = b.map((v, k) => v - a[k]), len = Math.hypot(...d), c = a.map((v, k) => (v + b[k]) / 2);
  return box(c, [w, w, len], color, { q: fromTo([0, 0, 1], d), pivot: c });
}

const sideLogs = [-1, 1].flatMap(s => Array.from({ length: SIDE_LOGS }, (_, k) => {
  const i = s < 0 ? k : 29 - k, x = -LENGTH / 2 + PITCH * (i + 0.5), z = i % 2 ? 0.025 : -0.025, h = HEIGHTS[i % HEIGHTS.length];
  return [
    { c: [x, (h - TIP) / 2, z], h: h - TIP, r: [R, R], n: 6, color: BODY[i % 3] },
    { c: [x, h - TIP / 2, z], h: TIP, r: [R, 0.035], n: 6, color: 'cut' },
  ];
}).flat());

const sideEdge = 5 - SIDE_LOGS * PITCH;               // inner end of the log run
const posts = [-1, 1].flatMap(s => [
  { c: [s * POST_X, (POST_H - 0.4) / 2, 0], h: POST_H - 0.4, r: [POST_R, POST_R], n: 6, color: 'woodDark' },
  { c: [s * POST_X, POST_H - 0.2, 0], h: 0.4, r: [POST_R, 0.1], n: 6, color: 'cut' },
  box([s * POST_X, 0.06, 0], [0.9, 0.12, 0.9], 'earth'),
]);

// A leaf. Local frame: u from the hinge towards the middle, y up, t across the leaf (+ outwards).
// Closed: the leaf lies in the wall plane; open: it is swung inward (-Z) against the post.
function leaf(s, open) {
  const at = (u, y, t) => open ? [s * (OPEN_HALF - t - 0.07), y, -u] : [s * (OPEN_HALF - u), y, t];
  const sz = (su, sy, st) => open ? [st, sy, su] : [su, sy, st];
  const n = 11, w = OPEN_HALF / n, parts = [];
  for (let i = 0; i < n; i++) parts.push(box(at((i + 0.5) * w, 0.1 + (LEAF_H - 0.1) / 2, 0), sz(w - 0.012, LEAF_H - 0.1, LEAF_T), BODY[(i + (s > 0 ? 1 : 0)) % 3]));
  for (const y of [0.7, 2.6]) parts.push(box(at(OPEN_HALF / 2, y, LEAF_T / 2 + 0.04), sz(OPEN_HALF - 0.1, 0.2, 0.08), 'rail'));
  parts.push(beam(at(0.15, 0.8, LEAF_T / 2 + 0.08), at(OPEN_HALF - 0.15, 2.5, LEAF_T / 2 + 0.08), 0.13, 'rail'));
  parts.push(box(at(OPEN_HALF / 2, 1.65, LEAF_T / 2 + 0.03), sz(OPEN_HALF - 0.3, 0.3, 0.05), 'team'));
  for (const y of [0.7, 2.6]) parts.push(box(at(0.35, y, LEAF_T / 2 + 0.09), sz(0.7, 0.1, 0.04), 'iron'));
  parts.push(box(at(OPEN_HALF - 0.2, 1.4, LEAF_T / 2 + 0.07), sz(0.1, 0.1, 0.07), 'iron'));
  return parts;
}

function gate(open) {
  return [
    ...[-1, 1].map(s => box([s * (5 + POST_X) / 2, 0.06, 0], [5 - POST_X, 0.12, 0.9], 'earth')),
    ...sideLogs,
    ...[-1, 1].flatMap(s => RAILS.map(y => box([s * (5 + POST_X) / 2, y, RAIL_Z], [5 - POST_X, 0.16, 0.14], 'rail'))),
    ...posts,
    // Lintel with the banner above it, and the track through the opening.
    box([0, LINTEL_Y, 0], [2 * POST_X + 0.5, 0.4, 0.4], 'rail'),
    box([0, LINTEL_Y + 0.2 + 0.28, 0.18], [2 * OPEN_HALF - 0.4, 0.5, 0.06], 'team'),
    ...[-1, 1].map(s => box([s * (OPEN_HALF - 0.2), LINTEL_Y + 0.2 + 0.28, 0.215], [0.3, 0.5, 0.03], 'teamDark')),
    box([0, 0.02, 0], [2 * OPEN_HALF, 0.04, 1.6], 'earth'),
    ...[-1, 1].flatMap(s => leaf(s, open)),
  ];
}

const base = { folder: '3D-models-defense', static: true, joints: [], palette: PALETTE, clips: [], preview: '25,90,155', previewGap: 150, previewZoom: 1.6 };
export const closed = { ...base, name: 'palisade-gate', parts: gate(false) };
export const opened = { ...base, name: 'palisade-gate-open', parts: gate(true) };
export { OPEN_HALF, POST_X, LINTEL_Y, sideEdge };
