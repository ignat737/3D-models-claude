// orc-stone-tower.mjs — a 4.2 x 4.2 m orc stone tower for the orc stone wall: a footing with bones,
// rough dark masonry, tusks sticking out of every face, arrow slits, team banners, a studded door on
// -Z, and an archers' platform at 8.0 m on corbels with a parapet of pointed merlons, a bone horn on
// each corner, fire bowls and a pennant. Centred on the wall line like stone-tower: an
// orc-stone-wall-segment or gate butts against any of its four faces. Static: one mesh.
import { PALETTE, banner, box, brazier, horn, masonry, merlons, onFace, skull, slit, spikeRows } from './orc-common.mjs';
import { PLINTH } from './stone-common.mjs';

const H = 2.1, BODY_TOP = 7.4, FLOOR = 8.0, SL = 2.55, PB = 0.5;
const FACES = [['z', 1], ['z', -1], ['x', 1], ['x', -1]];

const body = FACES.flatMap(([axis, sign], i) => masonry({ axis, sign, plane: H, len: 2 * H, y0: PLINTH, y1: BODY_TOP, course: 1.05, block: 3.4, seed: 20 + i, light: 0.18 }));
const corbels = FACES.flatMap(([axis, sign]) => [-1.4, 0, 1.4].map(u => onFace(axis, sign, H, 0)(u, BODY_TOP - 0.25, 0.15, 0.4, 0.5, 0.3, 'stoneDark')));

const zp = SL - PB / 2;
const parapet = FACES.flatMap(([axis, sign]) => [
  onFace(axis, sign, zp - PB / 2, 0)(0, FLOOR + 0.25, PB / 2, 2 * SL - 2 * PB, 0.5, PB, 'stone'),
  ...merlons(3.7, 2, FLOOR + 0.5, sign * zp, 0.9, 0.6, PB, 'stoneDark', axis),
]);

const door = [
  box([0, PLINTH + 1.2, -H - 0.03], [1.5, 2.4, 0.06], 'stoneDark'),
  box([0, PLINTH + 1.05, -H - 0.07], [1.0, 2.1, 0.06], 'wood'),
  ...[0.7, 1.7].map(y => box([0, PLINTH + y, -H - 0.11], [1.0, 0.1, 0.03], 'iron')),
  box([0, 0.125, -(H + 0.45)], [1.7, 0.25, 0.5], 'stoneDark'),
  ...skull('z', -1, H + 0.1, 0, PLINTH + 2.7, 0.9, true),
];

const PARTS = [
  box([0, PLINTH / 2, 0], [2 * H + 0.5, PLINTH, 2 * H + 0.5], 'stoneDark'),
  box([0, (PLINTH + BODY_TOP) / 2, 0], [2 * H, BODY_TOP - PLINTH, 2 * H], 'stone'),
  ...body, ...door,
  ...[['z', 1], ['x', 1], ['x', -1]].flatMap(([axis, sign]) => banner(axis, sign, H, 0, 5.3, 0.9, 1.7)),
  ...FACES.flatMap(([axis, sign]) => slit(axis, sign, H, 1.3, 6.3)),
  ...FACES.flatMap(([axis, sign]) => spikeRows(axis, sign, H, -2, 2, [2.6], 1.35, 30)),
  ...corbels,
  box([0, BODY_TOP + 0.175, 0], [4.8, 0.35, 4.8], 'stoneDark'),
  box([0, BODY_TOP + 0.35 + 0.125, 0], [2 * SL, 0.25, 2 * SL], 'stone'),
  box([0, FLOOR + 0.03, 0], [2 * SL - 1.0, 0.06, 2 * SL - 1.0], 'stoneLight'),
  ...parapet,
  ...[[1, 1], [-1, 1], [1, -1]].flatMap(([sx, sz]) => horn([sx * (SL - 0.15), FLOOR + 0.5, sz * (SL - 0.15)], [sx, 0.6, sz], 1.1)),
  ...brazier(-SL + 0.5, FLOOR + 1.0, -SL + 0.5),
  ...brazier(SL - 0.5, FLOOR + 1.0, -SL + 0.5),
  box([-0.9, FLOOR + 1.3, SL - 0.45], [0.08, 2.2, 0.08], 'woodDark'),
  box([-0.9 + 0.42, FLOOR + 2.05, SL - 0.45], [0.7, 0.42, 0.04], 'team'),
  box([-0.9 + 0.9, FLOOR + 2.0, SL - 0.45], [0.3, 0.2, 0.04], 'teamDark'),
];

export default {
  name: 'orc-stone-tower', folder: '3D-models-defense', static: true, joints: [], palette: PALETTE, parts: PARTS, clips: [],
  preview: '25,90,155', previewGap: 130, previewZoom: 1.6,
};
