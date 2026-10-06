// timber-wall-segment.mjs — a 10 m segment of a timber curtain wall: a stone footing, eight courses of
// hexagonal logs (4.1 m) on both faces round a plank core, props on the inner side, a plank wall walk
// at 4.6 m behind a parapet with six merlons, arrow slits and a team banner. The middle type between
// palisade-segment and stone-wall-segment; ends flush at x = +-5, so it chains with its own gate and
// tower. Static: one mesh, one palette material, no skeleton.
import { PALETTE, THICK, PLINTH, ROWS, WALK, banner, beam, box, masonry, slit, wallLogs, wallTop } from './timber-common.mjs';

const H = THICK / 2;
const PARTS = [
  box([0, PLINTH / 2, 0], [10, PLINTH, THICK + 0.3], 'stoneDark'),
  ...[1, -1].flatMap(s => masonry({ axis: 'z', sign: s, plane: H + 0.15, len: 10, y0: 0, y1: PLINTH, course: 0.5, block: 1.4, seed: 40 + s, light: 0.15 })),
  box([0, (PLINTH + WALK) / 2, 0], [10, WALK - PLINTH - 0.05, THICK - 0.3], 'woodDark'),
  ...wallLogs(1, -5, 5, ROWS, 1), ...wallLogs(-1, -5, 5, ROWS, 2),
  // Props on the inner side.
  ...[-3.75, -1.25, 1.25, 3.75].flatMap(x => [
    beam([x, 3.4, -H - 0.1], [x, 0.12, -H - 1.4], 0.16, 'rail'),
    box([x, 0.07, -H - 1.4], [0.34, 0.14, 0.36], 'earth'),
  ]),
  ...wallTop(),
  ...[-2.5, 2.5].flatMap(u => slit('z', 1, H, u, 2.9)),
  ...banner('z', 1, H, 0, 4.3),
];

export default {
  name: 'timber-wall-segment', folder: '3D-models-defense', static: true, joints: [], palette: PALETTE, parts: PARTS, clips: [],
  preview: '25,90,155', previewGap: 150, previewZoom: 2.0,
};
