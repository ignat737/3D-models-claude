// orc-timber-tower.mjs — a 4 x 4 m orc blockhouse for the orc log wall: a stone footing, twelve
// courses of dark logs with the ends sticking out at the corners and spikes in the face, trophy
// skulls, a plank door on -Z, an archers' platform at 7.0 m on braces with a parapet of pointed
// merlons, a bone horn on each corner, fire bowls, a team banner and a pennant. Centred on the wall
// line like timber-tower: an orc-timber-wall-segment or gate butts against any of its faces.
import { PALETTE, banner, beam, box, brazier, horn, masonry, merlons, onFace, skull, slit, spike, spikeRows } from './orc-common.mjs';
import { FLAT, PLINTH, logX, logZ, logColor, rowY } from './timber-common.mjs';

const S = 2.0, OVER = 0.3, N = 12;
const BODY_TOP = PLINTH + N * 0.5, FLOOR = 7.0, SL = 2.6, PB = 0.45;
const FACES = [['z', 1], ['z', -1], ['x', 1], ['x', -1]];

const logs = Array.from({ length: N }, (_, k) => k % 2 === 0
  ? [1, -1].map(s => logX(-S - OVER, S + OVER, rowY(k), s * (S - FLAT), logColor(k + (s > 0 ? 0 : 1))))
  : [1, -1].map(s => logZ(-S - OVER, S + OVER, rowY(k), s * (S - FLAT), logColor(k + (s > 0 ? 1 : 2))))).flat(2);

const braces = FACES.flatMap(([axis, sign]) => [-0.9, 0.9].map(u => {
  const a = axis === 'z' ? [u, BODY_TOP - 0.55, sign * S] : [sign * S, BODY_TOP - 0.55, u];
  const b = axis === 'z' ? [u, FLOOR - 0.2, sign * (SL - 0.25)] : [sign * (SL - 0.25), FLOOR - 0.2, u];
  return beam(a, b, 0.17, 'woodDark');
}));

const zp = SL - PB / 2;
const parapet = FACES.flatMap(([axis, sign]) => [
  onFace(axis, sign, zp - PB / 2, 0)(0, FLOOR + 0.25, PB / 2, 2 * SL - 2 * PB, 0.5, PB, 'wood'),
  ...merlons(3.8, 2, FLOOR + 0.5, sign * zp, 0.9, 0.6, PB, 'woodDark', axis),
]);

const door = [
  box([0, PLINTH + 1.2, -S - 0.03], [1.5, 2.4, 0.06], 'woodDark'),
  box([0, PLINTH + 1.05, -S - 0.07], [1.0, 2.1, 0.06], 'woodLight'),
  ...[0.7, 1.7].map(y => box([0, PLINTH + y, -S - 0.11], [1.0, 0.1, 0.03], 'iron')),
  box([0, 0.125, -(S + 0.45)], [1.7, 0.25, 0.5], 'stoneDark'),
  ...skull('z', -1, S + 0.1, 0, PLINTH + 2.65, 0.9, true),
];

const PARTS = [
  box([0, PLINTH / 2, 0], [2 * S + 0.4, PLINTH, 2 * S + 0.4], 'stoneDark'),
  ...FACES.flatMap(([axis, sign], i) => masonry({ axis, sign, plane: S + 0.2, len: 2 * S + 0.4, y0: 0, y1: PLINTH, course: 0.5, block: 1.3, seed: 70 + i, light: 0.3 })),
  box([0, (PLINTH + BODY_TOP) / 2, 0], [2 * S - 0.4, BODY_TOP - PLINTH, 2 * S - 0.4], 'woodDark'),
  ...logs, ...door,
  ...[['z', 1], ['x', 1], ['x', -1]].flatMap(([axis, sign]) => banner(axis, sign, S, 0, 5.5, 0.9, 1.7)),
  ...FACES.flatMap(([axis, sign]) => slit(axis, sign, S, 1.2, 6.0)),
  ...[['z', 1], ['x', 1], ['x', -1]].flatMap(([axis, sign]) => spikeRows(axis, sign, S, -1.9, 1.9, [1.7, 3.3], 1.3, 9)),
  ...braces,
  box([0, FLOOR - 0.38, 0], [2 * SL - 0.3, 0.24, 0.3], 'woodDark'),
  box([0, FLOOR - 0.38, 0], [0.3, 0.24, 2 * SL - 0.3], 'woodDark'),
  ...Array.from({ length: 6 }, (_, i) => box([0, FLOOR - 0.1, -SL + (i + 0.5) * 2 * SL / 6], [2 * SL, 0.2, 2 * SL / 6 - 0.012], i % 2 ? 'woodLight' : 'wood')),
  ...parapet,
  ...[[1, 1], [-1, 1], [1, -1]].flatMap(([sx, sz]) => horn([sx * (SL - 0.15), FLOOR + 0.6, sz * (SL - 0.15)], [sx, 0.6, sz], 1.0)),
  ...brazier(-SL + 0.45, FLOOR + 1.0, -SL + 0.45),
  ...brazier(SL - 0.45, FLOOR + 1.0, -SL + 0.45),
  box([-0.9, FLOOR + 1.6, SL - 0.3], [0.08, 2.4, 0.08], 'woodDark'),
  box([-0.9 + 0.42, FLOOR + 2.4, SL - 0.3], [0.7, 0.42, 0.04], 'team'),
  box([-0.9 + 0.9, FLOOR + 2.35, SL - 0.3], [0.3, 0.2, 0.04], 'teamDark'),
];

export default {
  name: 'orc-timber-tower', folder: '3D-models-defense', static: true, joints: [], palette: PALETTE, parts: PARTS, clips: [],
  preview: '25,90,155', previewGap: 130, previewZoom: 1.6,
};
