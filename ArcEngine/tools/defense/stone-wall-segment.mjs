// stone-wall-segment.mjs — a 10 m segment of a stone curtain wall: a stone footing, a 5.4 m wall of
// courses of masonry, a wall walk behind a crenellated parapet (six merlons), arrow slits and a team
// banner. Segments chain along X (the wall ends flush at x = +-5); the same frame as the wooden
// palisade-segment, so it can replace it. Static: one mesh, one palette material, no skeleton.
import { PALETTE, THICK, PLINTH, WALK, box, masonry, wallTop, banner, slit } from './stone-common.mjs';

const H = THICK / 2;
const PARTS = [
  box([0, PLINTH / 2, 0], [10, PLINTH, THICK + 0.4], 'stoneDark'),
  box([0, (PLINTH + WALK) / 2, 0], [10, WALK - PLINTH, THICK], 'stone'),
  ...masonry({ axis: 'z', sign: 1, plane: H, len: 10, y0: PLINTH, y1: WALK, course: 0.6, block: 1.6, seed: 1 }),
  ...masonry({ axis: 'z', sign: -1, plane: H, len: 10, y0: PLINTH, y1: WALK, course: 0.6, block: 2.2, seed: 2, light: 0.08 }),
  ...wallTop(),
  ...[-2.5, 2.5].flatMap(u => slit('z', 1, H, u, 3.3)),
  ...banner('z', 1, H, 0, 4.9),
];

export default {
  name: 'stone-wall-segment', folder: '3D-models-defense', static: true, joints: [], palette: PALETTE, parts: PARTS, clips: [],
  preview: '25,90,155', previewGap: 150, previewZoom: 2.0,
};
