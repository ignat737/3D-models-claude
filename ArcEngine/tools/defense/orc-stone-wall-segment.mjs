// orc-stone-wall-segment.mjs — a 10 m segment of an orc stone wall: dark rough masonry with bones
// laid into the foot and lighter blocks scattered over the face, two rows of bone tusks sticking out,
// big tusked skulls, a wall walk behind a parapet with six pointed merlons and skulls between them,
// arrow slits and a tattered team banner. The orc twin of stone-wall-segment: the same 10 m, 1.8 m
// thickness, footing and 5.4 m wall walk, so it replaces it 1:1. Static: one mesh, one palette material.
import { PALETTE, banner, box, masonry, skull, slit, spikeRows, wallTop } from './orc-common.mjs';
import { PLINTH, THICK, WALK } from './stone-common.mjs';

const H = THICK / 2;
const PARTS = [
  box([0, PLINTH / 2, 0], [10, PLINTH, THICK + 0.4], 'stoneDark'),
  box([0, (PLINTH + WALK) / 2, 0], [10, WALK - PLINTH, THICK], 'stone'),
  ...masonry({ axis: 'z', sign: 1, plane: H, len: 10, y0: PLINTH, y1: WALK, course: 0.7, block: 1.8, seed: 5, light: 0.2 }),
  ...masonry({ axis: 'z', sign: -1, plane: H, len: 10, y0: PLINTH, y1: WALK, course: 0.7, block: 2.4, seed: 6, light: 0.1 }),
  ...spikeRows('z', 1, H, -5, 5, [1.2, 3.7], 1.3, 4),
  ...skull('z', 1, H, -3.4, 2.6, 1.3, true),
  ...skull('z', 1, H, 3.4, 2.6, 1.3, true),
  ...wallTop({ walk: WALK, thick: THICK, deck: 'stone', parapet: 'stone', merlon: 'stoneDark' }),
  ...[-2.0, 2.0].flatMap(u => slit('z', 1, H, u, 3.3)),
  ...banner('z', 1, H, 0, 4.9, 1.0, 1.8),
];

export default {
  name: 'orc-stone-wall-segment', folder: '3D-models-defense', static: true, joints: [], palette: PALETTE, parts: PARTS, clips: [],
  preview: '25,90,155', previewGap: 150, previewZoom: 2.0,
};
