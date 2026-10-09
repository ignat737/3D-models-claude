// orc-palisade-gate.mjs — a 10 m gate section of the orc palisade: four crooked logs on each side,
// two tall totem posts with tusked skulls and horns, a heavy lintel with a row of bone fangs hanging
// over the opening and a huge skull above it, hide banners in the team colours on the posts, and a
// double leaf of planks with iron bands, studs and a war-paint skull. Two models from one description:
// `orc-palisade-gate` (leaves closed) and `orc-palisade-gate-open` (leaves swung inward). Replaces an
// orc-palisade-segment: the logs end flush at x = +-5. Static: one mesh, one palette material.
import { PALETTE, banner, beam, box, horn, palisadeLog, skull, spike } from './orc-common.mjs';

const R = 0.27, X0 = 5 - R, PITCH = 2 * X0 / 19;       // the segment's log grid
const OPEN = 2.2, POST_X = 2.6, POST_R = 0.4, POST_H = 5.2, LINTEL_Y = 3.9;
const LEAF_T = 0.14, LEAF_H = 3.25, PLANKS = 11, BODY = ['wood', 'woodDark', 'woodLight'];

const sideLogs = [-1, 1].flatMap(s => Array.from({ length: 4 }, (_, k) => {
  const x = s * (X0 - PITCH * k);
  return palisadeLog(s < 0 ? k : 19 - k, x, R, { lean: k === 3 ? 0.5 : undefined }).parts;
}).flat());

const posts = [-1, 1].flatMap(s => [
  { c: [s * POST_X, (POST_H - 0.7) / 2, 0], h: POST_H - 0.7, r: [POST_R, POST_R], n: 6, color: 'woodDark' },
  { c: [s * POST_X, POST_H - 0.35, 0], h: 0.7, r: [POST_R, 0.04], n: 6, color: 'char' },
  box([s * POST_X, 0.07, 0], [1.0, 0.14, 1.0], 'earth'),
  ...skull('z', 1, POST_R * 0.866, s * POST_X, 4.25, 1.15, true),
  ...skull('z', -1, POST_R * 0.866, s * POST_X, 4.25, 1.15, true),
  ...horn([s * (POST_X + POST_R), 3.5, 0], [s, 0.6, 0], 1.1),
  ...banner('z', 1, POST_R * 0.866, s * POST_X, 3.3, 0.6, 1.3),
]);

// A leaf. u runs from the hinge towards the middle; closed it lies in the wall plane, open it is
// swung inward (-Z) against the post.
function leaf(s, open) {
  const w = OPEN / PLANKS, parts = [];
  const at = (u, y, t) => open ? [s * (OPEN - t - 0.07), y, -u] : [s * (OPEN - u), y, t];
  const sz = (su, sy, st) => open ? [st, sy, su] : [su, sy, st];
  for (let i = 0; i < PLANKS; i++) parts.push(box(at((i + 0.5) * w, 0.1 + (LEAF_H - 0.1) / 2, 0), sz(w - 0.012, LEAF_H - 0.1 - (i % 3) * 0.08, LEAF_T), BODY[(i + (s > 0 ? 1 : 0)) % 3]));
  for (const y of [0.55, 2.65]) parts.push(box(at(OPEN / 2, y, LEAF_T / 2 + 0.04), sz(OPEN - 0.1, 0.22, 0.08), 'iron'));
  parts.push(beam(at(0.15, 0.7, LEAF_T / 2 + 0.1), at(OPEN - 0.15, 2.5, LEAF_T / 2 + 0.1), 0.14, 'woodDark'));
  parts.push(box(at(OPEN / 2, 1.6, LEAF_T / 2 + 0.03), sz(OPEN - 0.3, 0.3, 0.05), 'team'));
  parts.push(box(at(OPEN / 2, 1.6, LEAF_T / 2 + 0.06), sz(0.5, 0.4, 0.03), 'red'));
  // Studs: spikes through the planks, pointing at whoever comes up to the door.
  for (const [u, y] of [[0.5, 1.0], [1.1, 2.1], [1.7, 1.0], [1.7, 2.2]]) {
    const b = at(u, y, LEAF_T / 2), d = open ? [-s, 0.3, 0] : [0, 0.3, 1];
    parts.push(spike(b, d, 0.32, 0.06, 'iron'));
  }
  return parts;
}

function gate(open) {
  return [
    box([0, 0.07, 0], [10, 0.14, 1.2], 'earth'),
    ...sideLogs,
    ...[-1, 1].flatMap(s => [1.0, 2.35].map(y => box([s * (5 + POST_X + POST_R) / 2, y, -R - 0.07], [5 - POST_X - POST_R, 0.17, 0.15], 'woodDark'))),
    ...posts,
    // Lintel with a row of fangs, and a huge skull above the opening.
    box([0, LINTEL_Y, 0], [2 * POST_X + 0.8, 0.5, 0.6], 'woodDark'),
    ...[-1.8, -1.1, -0.4, 0.4, 1.1, 1.8].map(x => spike([x, LINTEL_Y - 0.25, 0.2], [0, -1, 0], 0.42, 0.1, 'bone')),
    ...skull('z', 1, 0.3, 0, LINTEL_Y + 0.85, 2.3, true),
    box([0, LINTEL_Y + 0.3, 0.32], [1.6, 0.08, 0.06], 'team'),
    box([0, 0.03, 0], [2 * OPEN, 0.06, 1.6], 'earth'),
    ...[-1, 1].flatMap(s => leaf(s, open)),
  ];
}

const base = { folder: '3D-models-defense', static: true, joints: [], palette: PALETTE, clips: [], preview: '25,90,155', previewGap: 150, previewZoom: 1.6 };
export const closed = { ...base, name: 'orc-palisade-gate', parts: gate(false) };
export const opened = { ...base, name: 'orc-palisade-gate-open', parts: gate(true) };
