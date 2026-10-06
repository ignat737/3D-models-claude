// stone-tower.mjs — a 4.2 x 4.2 m stone tower for the stone wall: a footing, masonry with corner
// quoins, arrow slits, team banners, a studded door on -Z, a corbelled platform at 8.0 m with a
// crenellated parapet (archers stand on it) and a team pennant. Centred on the wall line: a
// stone-wall-segment (or a gate) butts against any of its four faces, so one model serves a straight
// run, a corner and a T. Static: one mesh, one palette material, no skeleton.
import { PALETTE, PLINTH, box, masonry, banner, slit, onFace } from './stone-common.mjs';

const H = 2.1;                                // half of the body
const BODY_TOP = 7.4, FLOOR = 8.0;            // platform floor
const COURSE_TOP = BODY_TOP;
const FACES = [['z', 1], ['z', -1], ['x', 1], ['x', -1]];

const body = FACES.flatMap(([axis, sign], i) => masonry({
  axis, sign, plane: H, len: 2 * H, y0: PLINTH, y1: COURSE_TOP, course: 0.85, block: 2.8, seed: 10 + i, light: 0.1,
}));

// Corner quoins: a long and a short stone on alternate courses, wrapping the corner.
const NQ = Math.round((COURSE_TOP - PLINTH) / 0.85), CH = (COURSE_TOP - PLINTH) / NQ;
const quoins = [1, -1].flatMap(sx => [1, -1].flatMap(sz => Array.from({ length: NQ }, (_, k) => {
  const long = k % 2 === 0, wx = long ? 0.8 : 0.45, wz = long ? 0.45 : 0.8;
  return box([sx * (H + 0.03 - wx / 2), PLINTH + (k + 0.5) * CH, sz * (H + 0.03 - wz / 2)], [wx, CH - 0.05, wz], 'stoneLight');
})));

// Platform: corbels, a stone band, the floor slab, parapet ring, merlons, corner pillars, caps.
const corbels = FACES.flatMap(([axis, sign]) => [-1.4, 0, 1.4].map(u => {
  const put = onFace(axis, sign, H, 0);
  return put(u, BODY_TOP - 0.25, 0.15, 0.4, 0.5, 0.3, 'stoneDark');
}));
const BAND_H = 0.35, SLAB_H = 0.25, SL = 2.55;      // slab half-extent
const PB = 0.5, PT = 0.5;                            // parapet base thickness / height
const zp = SL - PB / 2;
const span = 2 * (SL - 0.6), NM = 2, MW = 0.9, gap = (span - NM * MW) / (NM + 1);
const merlons = FACES.flatMap(([axis, sign]) => Array.from({ length: NM }, (_, i) => {
  const u = -span / 2 + gap * (i + 1) + MW * (i + 0.5), put = onFace(axis, sign, zp - PB / 2, 0);
  return [
    put(u, FLOOR + PT + 0.375, PB / 2, MW, 0.75, PB, 'stone'),
    put(u, FLOOR + PT + 0.79, PB / 2, MW + 0.12, 0.08, PB + 0.1, 'stoneLight'),
  ];
}).flat());
const pillars = [1, -1].flatMap(sx => [1, -1].flatMap(sz => [
  box([sx * (SL - 0.3), FLOOR + 0.7, sz * (SL - 0.3)], [0.6, 1.4, 0.6], 'stone'),
  box([sx * (SL - 0.3), FLOOR + 1.44, sz * (SL - 0.3)], [0.72, 0.08, 0.72], 'stoneLight'),
]));

const door = [
  box([0, PLINTH + 1.2, -H - 0.03], [1.5, 2.4, 0.06], 'stoneDark'),
  box([0, PLINTH + 1.05, -H - 0.07], [1.0, 2.1, 0.06], 'wood'),
  ...[0.7, 1.7].map(y => box([0, PLINTH + y, -H - 0.11], [1.0, 0.1, 0.03], 'iron')),
  box([0.3, PLINTH + 1.0, -H - 0.12], [0.08, 0.08, 0.04], 'iron'),
  box([0, 0.125, -(H + 0.45)], [1.7, 0.25, 0.5], 'stoneDark'),
];

const PARTS = [
  box([0, PLINTH / 2, 0], [2 * H + 0.5, PLINTH, 2 * H + 0.5], 'stoneDark'),
  box([0, (PLINTH + BODY_TOP) / 2, 0], [2 * H, BODY_TOP - PLINTH, 2 * H], 'stone'),
  ...body, ...quoins,
  ...door,
  ...[[ 'z', 1 ], [ 'x', 1 ], [ 'x', -1 ]].flatMap(([axis, sign]) => banner(axis, sign, H, 0, 5.0, 0.9, 1.7)),
  ...FACES.flatMap(([axis, sign]) => slit(axis, sign, H, 1.2, 6.3)),
  ...corbels,
  box([0, BODY_TOP + BAND_H / 2, 0], [4.8, BAND_H, 4.8], 'stoneDark'),
  box([0, BODY_TOP + BAND_H + SLAB_H / 2, 0], [2 * SL, SLAB_H, 2 * SL], 'stone'),
  box([0, FLOOR + 0.03, 0], [2 * SL - 1.0, 0.06, 2 * SL - 1.0], 'stoneLight'),
  ...[1, -1].flatMap(s => [
    box([0, FLOOR + PT / 2, s * zp], [2 * SL, PT, PB], 'stone'),
    box([s * zp, FLOOR + PT / 2, 0], [PB, PT, 2 * SL - 2 * PB], 'stone'),
  ]),
  ...merlons, ...pillars,
  // Pennant on the north-west pillar.
  box([-SL + 0.3, FLOOR + 1.44 + 1.1, -SL + 0.3], [0.08, 2.2, 0.08], 'woodLight'),
  box([-SL + 0.3 + 0.42, FLOOR + 1.44 + 1.9, -SL + 0.3], [0.7, 0.42, 0.04], 'team'),
  box([-SL + 0.3 + 0.9, FLOOR + 1.44 + 1.9, -SL + 0.3], [0.26, 0.2, 0.04], 'teamDark'),
];

export default {
  name: 'stone-tower', folder: '3D-models-defense', static: true, joints: [], palette: PALETTE, parts: PARTS, clips: [],
  preview: '25,90,155', previewGap: 130, previewZoom: 1.6,
};
