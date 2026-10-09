// orc-timber-wall-segment.mjs — a 10 m segment of an orc log wall: a rough stone footing with bones
// in it, eight courses of dark logs round a plank core, two rows of iron-black spikes sticking out of
// the face, patches of hide nailed on, a plank wall walk behind a parapet with six pointed merlons and
// skulls between them, arrow slits and a tattered team banner. The orc twin of timber-wall-segment:
// the same 10 m, thickness, footing and 4.6 m wall walk, so it replaces it 1:1. Static: one mesh.
import { PALETTE, banner, beam, box, masonry, slit, spikeRows, wallTop } from './orc-common.mjs';
import { PLINTH, ROWS, THICK, WALK, wallLogs } from './timber-common.mjs';

const H = THICK / 2;
const PARTS = [
  box([0, PLINTH / 2, 0], [10, PLINTH, THICK + 0.3], 'stoneDark'),
  ...[1, -1].flatMap(s => masonry({ axis: 'z', sign: s, plane: H + 0.15, len: 10, y0: 0, y1: PLINTH, course: 0.5, block: 1.4, seed: 60 + s, light: 0.3 })),
  box([0, (PLINTH + WALK) / 2, 0], [10, WALK - PLINTH - 0.05, THICK - 0.3], 'woodDark'),
  ...wallLogs(1, -5, 5, ROWS, 1), ...wallLogs(-1, -5, 5, ROWS, 2),
  // Hide stretched over the logs.
  box([3.2, 2.2, H + 0.02], [1.6, 1.1, 0.05], 'hide'),
  box([-3.4, 3.1, H + 0.02], [1.3, 0.9, 0.05], 'hide'),
  ...[-0.55, 0.55].flatMap(dx => [-0.4, 0.4].map(dy => box([3.2 + dx, 2.2 + dy, H + 0.06], [0.08, 0.08, 0.04], 'iron'))),
  ...spikeRows('z', 1, H, -5, 5, [1.45, 3.1], 1.25, 3),
  // Props on the inner side.
  ...[-3.75, -1.25, 1.25, 3.75].flatMap(x => [
    beam([x, 3.4, -H - 0.1], [x, 0.12, -H - 1.4], 0.16, 'woodDark'),
    box([x, 0.07, -H - 1.4], [0.34, 0.14, 0.36], 'earth'),
  ]),
  ...wallTop({ walk: WALK, thick: THICK, deck: 'woodLight', parapet: 'wood', merlon: 'woodDark' }),
  ...[-2.5, 2.5].flatMap(u => slit('z', 1, H, u, 2.75)),
  ...banner('z', 1, H, 0, 4.2),
];

export default {
  name: 'orc-timber-wall-segment', folder: '3D-models-defense', static: true, joints: [], palette: PALETTE, parts: PARTS, clips: [],
  preview: '25,90,155', previewGap: 150, previewZoom: 2.0,
};
