// timber-gate.mjs — a 10 m gate section of the timber wall: log courses on both sides, two plank
// gate posts with knee braces under a heavy lintel (opening 4.2 m wide, 3.35 m high), a log course
// and the wall walk with the crenellated parapet carried on above, banners, and a double leaf of
// planks with iron hinges. Two models from one description: `timber-gate` (leaves closed) and
// `timber-gate-open` (leaves swung inward, the opening is free). Replaces a timber-wall-segment:
// the same footing, thickness, walk and ends at x = +-5. Static: one mesh, one palette material.
import { PALETTE, THICK, PLINTH, ROWS, WALK, banner, beam, box, masonry, wallLogs, wallTop } from './timber-common.mjs';

const H = THICK / 2;
const OPEN = 2.1, POST_W = 0.6, LINTEL_Y = 3.35, LINTEL_H = 0.6;
const LEAF_Z = 0.25, LEAF_T = 0.14, LEAF_H = 3.2, PLANKS = 11;
const BODY = ['wood', 'woodDark', 'woodLight'];
const SIDE_X0 = OPEN + POST_W;                        // 2.7: the log courses start behind the posts

function leaf(s, open) {
  const w = OPEN / PLANKS, parts = [];
  const at = (u, y, t) => open ? [s * (OPEN - t - 0.07), y, LEAF_Z - u] : [s * (OPEN - u), y, LEAF_Z + t];
  const sz = (su, sy, st) => open ? [st, sy, su] : [su, sy, st];
  for (let i = 0; i < PLANKS; i++) parts.push(box(at((i + 0.5) * w, 0.1 + (LEAF_H - 0.1) / 2, 0), sz(w - 0.012, LEAF_H - 0.1, LEAF_T), BODY[(i + (s > 0 ? 1 : 0)) % 3]));
  for (const y of [0.6, 2.6]) parts.push(box(at(OPEN / 2, y, LEAF_T / 2 + 0.04), sz(OPEN - 0.1, 0.2, 0.08), 'rail'));
  parts.push(beam(at(0.15, 0.7, LEAF_T / 2 + 0.08), at(OPEN - 0.15, 2.5, LEAF_T / 2 + 0.08), 0.13, 'rail'));
  parts.push(box(at(OPEN / 2, 1.6, LEAF_T / 2 + 0.03), sz(OPEN - 0.3, 0.28, 0.05), 'team'));
  for (const y of [0.6, 2.6]) parts.push(box(at(0.4, y, LEAF_T / 2 + 0.09), sz(0.8, 0.1, 0.04), 'iron'));
  parts.push(box(at(OPEN - 0.2, 1.3, LEAF_T / 2 + 0.07), sz(0.1, 0.1, 0.07), 'iron'));
  return parts;
}

function gate(open) {
  const rowTop = PLINTH + ROWS * 0.5;
  return [
    ...[-1, 1].flatMap(s => [
      box([s * (5 + SIDE_X0) / 2, PLINTH / 2, 0], [5 - SIDE_X0, PLINTH, THICK + 0.3], 'stoneDark'),
      box([s * (5 + SIDE_X0) / 2, (PLINTH + WALK) / 2, 0], [5 - SIDE_X0, WALK - PLINTH - 0.05, THICK - 0.3], 'woodDark'),
      ...[1, -1].flatMap(f => masonry({ axis: 'z', sign: f, plane: H + 0.15, mid: s * (5 + SIDE_X0) / 2, len: 5 - SIDE_X0, y0: 0, y1: PLINTH, course: 0.5, block: 1.2, seed: 50 + s * 3 + f, light: 0.15 })),
      ...[1, -1].flatMap(f => wallLogs(f, s < 0 ? -5 : SIDE_X0, s < 0 ? -SIDE_X0 : 5, ROWS, 3 + f + s * 2)),
      // gate post: a plank pier on a stone base, and knee braces on both faces
      box([s * (OPEN + POST_W / 2), PLINTH / 2, 0], [POST_W + 0.2, PLINTH, THICK + 0.3], 'stoneDark'),
      box([s * (OPEN + POST_W / 2), (PLINTH + LINTEL_Y) / 2, 0], [POST_W, LINTEL_Y - PLINTH, THICK - 0.1], 'woodLight'),
      ...[1, -1].map(f => beam([s * OPEN, 2.5, f * (H + 0.06)], [s * (OPEN - 0.75), LINTEL_Y, f * (H + 0.06)], 0.2, 'rail')),
    ]),
    // lintel beams, the log course and the plank core above the opening
    box([0, LINTEL_Y + LINTEL_H / 2, 0], [2 * (OPEN + POST_W), LINTEL_H, THICK - 0.1], 'wood'),
    ...[1, -1].map(f => box([0, LINTEL_Y + LINTEL_H / 2, f * (H + 0.02)], [2 * OPEN + 0.4, LINTEL_H - 0.1, 0.06], 'woodDark')),
    box([0, (LINTEL_Y + LINTEL_H + WALK) / 2, 0], [2 * (OPEN + POST_W), WALK - LINTEL_Y - LINTEL_H - 0.05, THICK - 0.3], 'woodDark'),
    ...[1, -1].flatMap(f => wallLogs(f, -SIDE_X0, SIDE_X0, 1, 9 + f, ROWS - 1)),
    ...wallTop(),
    ...[-1, 1].flatMap(s => banner('z', 1, H, s * (5 + SIDE_X0) / 2, 4.3, 0.9, 1.6)),
    box([0, 0.03, 0], [2 * OPEN, 0.06, THICK], 'earth'),
    box([0, 0.06, LEAF_Z], [2 * OPEN, 0.12, 0.5], 'stoneDark'),
    ...[-1, 1].flatMap(s => leaf(s, open)),
  ];
}

const base = { folder: '3D-models-defense', static: true, joints: [], palette: PALETTE, clips: [], preview: '25,90,155', previewGap: 150, previewZoom: 1.6 };
export const closed = { ...base, name: 'timber-gate', parts: gate(false) };
export const opened = { ...base, name: 'timber-gate-open', parts: gate(true) };
