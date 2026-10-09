// orc-timber-gate.mjs — a 10 m gate section of the orc log wall: log courses on both sides with spikes
// in the face, two plank gate posts with knee braces under a heavy lintel (opening 4.2 m wide, 3.35 m
// high) hung with bone fangs and a big skull, the wall walk and pointed merlons carried on above, hide
// banners, and a double leaf of planks with iron bands, studs and a war-paint skull. Two models from
// one description: `orc-timber-gate` (leaves closed) and `orc-timber-gate-open` (leaves swung inward).
// Replaces an orc-timber-wall-segment: the same footing, thickness, walk and ends at x = +-5.
import { PALETTE, banner, beam, box, masonry, skull, spike, spikeRows, wallTop } from './orc-common.mjs';
import { PLINTH, ROWS, THICK, WALK, wallLogs } from './timber-common.mjs';

const H = THICK / 2;
const OPEN = 2.1, POST_W = 0.6, LINTEL_Y = 3.35, LINTEL_H = 0.6;
const LEAF_Z = 0.25, LEAF_T = 0.14, LEAF_H = 3.2, PLANKS = 7;
const BODY = ['wood', 'woodDark', 'woodLight'];
const SIDE_X0 = OPEN + POST_W, MID = (5 + SIDE_X0) / 2;

function leaf(s, open) {
  const w = OPEN / PLANKS, parts = [];
  const at = (u, y, t) => open ? [s * (OPEN - t - 0.07), y, LEAF_Z - u] : [s * (OPEN - u), y, LEAF_Z + t];
  const sz = (su, sy, st) => open ? [st, sy, su] : [su, sy, st];
  for (let i = 0; i < PLANKS; i++) parts.push(box(at((i + 0.5) * w, 0.1 + (LEAF_H - 0.1) / 2, 0), sz(w - 0.012, LEAF_H - 0.1 - (i % 3) * 0.08, LEAF_T), BODY[(i + (s > 0 ? 1 : 0)) % 3]));
  for (const y of [0.55, 2.55]) parts.push(box(at(OPEN / 2, y, LEAF_T / 2 + 0.04), sz(OPEN - 0.1, 0.22, 0.08), 'iron'));
  parts.push(beam(at(0.15, 0.6, LEAF_T / 2 + 0.1), at(OPEN - 0.15, 2.4, LEAF_T / 2 + 0.1), 0.14, 'woodDark'));
  parts.push(box(at(OPEN / 2, 1.5, LEAF_T / 2 + 0.03), sz(OPEN - 0.3, 0.28, 0.05), 'team'));
  parts.push(box(at(OPEN / 2, 1.5, LEAF_T / 2 + 0.06), sz(0.5, 0.38, 0.03), 'red'));
  for (const [u, y] of [[0.6, 0.95], [1.5, 2.05]]) {
    parts.push(spike(at(u, y, LEAF_T / 2), open ? [-s, 0.3, 0] : [0, 0.3, 1], 0.3, 0.06, 'iron'));
  }
  return parts;
}

function gate(open) {
  return [
    ...[-1, 1].flatMap(s => [
      box([s * MID, PLINTH / 2, 0], [5 - SIDE_X0, PLINTH, THICK + 0.3], 'stoneDark'),
      box([s * MID, (PLINTH + WALK) / 2, 0], [5 - SIDE_X0, WALK - PLINTH - 0.05, THICK - 0.3], 'woodDark'),
      ...[1].flatMap(f => masonry({ axis: 'z', sign: f, plane: H + 0.15, mid: s * MID, len: 5 - SIDE_X0, y0: 0, y1: PLINTH, course: 0.5, block: 1.2, seed: 80 + s * 3 + f, light: 0.3 })),
      ...[1, -1].flatMap(f => wallLogs(f, s < 0 ? -5 : SIDE_X0, s < 0 ? -SIDE_X0 : 5, ROWS, 5 + f + s * 2)),
      ...spikeRows('z', 1, H, s < 0 ? -5 : SIDE_X0, s < 0 ? -SIDE_X0 : 5, [1.45, 3.1], 1.15, 20 + s * 4),
      box([s * (OPEN + POST_W / 2), PLINTH / 2, 0], [POST_W + 0.2, PLINTH, THICK + 0.3], 'stoneDark'),
      box([s * (OPEN + POST_W / 2), (PLINTH + LINTEL_Y) / 2, 0], [POST_W, LINTEL_Y - PLINTH, THICK - 0.1], 'woodLight'),
      ...[1].map(f => beam([s * OPEN, 2.5, f * (H + 0.06)], [s * (OPEN - 0.75), LINTEL_Y, f * (H + 0.06)], 0.2, 'woodDark')),
      ...banner('z', 1, H, s * MID, 4.2, 0.9, 1.5),
    ]),
    box([0, LINTEL_Y + LINTEL_H / 2, 0], [2 * (OPEN + POST_W), LINTEL_H, THICK - 0.1], 'wood'),
    ...[-1.6, -0.55, 0.55, 1.6].map(x => spike([x, LINTEL_Y, H], [0, -1, 0.12], 0.4, 0.1, 'bone')),
    ...skull('z', 1, H, 0, LINTEL_Y + 0.28, 1.5, true),
    box([0, (LINTEL_Y + LINTEL_H + WALK) / 2, 0], [2 * (OPEN + POST_W), WALK - LINTEL_Y - LINTEL_H - 0.05, THICK - 0.3], 'woodDark'),
    ...[1, -1].flatMap(f => wallLogs(f, -SIDE_X0, SIDE_X0, 1, 11 + f, ROWS - 1)),
    ...wallTop({ walk: WALK, thick: THICK, deck: 'woodLight', parapet: 'wood', merlon: 'woodDark' }),
    box([0, 0.03, 0], [2 * OPEN, 0.06, THICK], 'earth'),
    box([0, 0.06, LEAF_Z], [2 * OPEN, 0.12, 0.5], 'stoneDark'),
    ...[-1, 1].flatMap(s => leaf(s, open)),
  ];
}

const base = { folder: '3D-models-defense', static: true, joints: [], palette: PALETTE, clips: [], preview: '25,90,155', previewGap: 150, previewZoom: 1.6 };
export const closed = { ...base, name: 'orc-timber-gate', parts: gate(false) };
export const opened = { ...base, name: 'orc-timber-gate-open', parts: gate(true) };
