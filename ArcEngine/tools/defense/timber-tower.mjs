// timber-tower.mjs — a 4 x 4 m log blockhouse for the timber wall: stone footing, twelve courses of
// logs notched at the corners (the ends stick out 0.3 m), arrow slits, team banners, a plank door on
// -Z, and an archers' platform at 7.0 m on braced beams with a crenellated plank parapet, corner log
// pillars and a pennant. Centred on the wall line: a timber-wall-segment or timber-gate butts against
// any of its four faces. Static: one mesh, one palette material, no skeleton.
import { DEG, rotY } from '../unit-glb.mjs';
import { PALETTE, PLINTH, FLAT, LOG_R, banner, beam, box, logColor, logX, logZ, onFace, rowY, slit } from './timber-common.mjs';

const S = 2.0, OVER = 0.3, N = 12;                    // half of the body, corner overhang, courses
const BODY_TOP = PLINTH + N * 0.5, FLOOR = 7.0;
const SL = 2.6, PB = 0.4, PT = 0.5;                   // platform half size, parapet thickness / height
const FACES = [['z', 1], ['z', -1], ['x', 1], ['x', -1]];

const logs = Array.from({ length: N }, (_, k) => k % 2 === 0
  ? [1, -1].map(s => logX(-S - OVER, S + OVER, rowY(k), s * (S - FLAT), logColor(k + (s > 0 ? 0 : 1))))
  : [1, -1].map(s => logZ(-S - OVER, S + OVER, rowY(k), s * (S - FLAT), logColor(k + (s > 0 ? 1 : 2))))).flat(2);

const braces = FACES.flatMap(([axis, sign]) => [-0.9, 0.9].map(u => {
  const a = axis === 'z' ? [u, BODY_TOP - 0.55, sign * S] : [sign * S, BODY_TOP - 0.55, u];
  const b = axis === 'z' ? [u, FLOOR - 0.2, sign * (SL - 0.25)] : [sign * (SL - 0.25), FLOOR - 0.2, u];
  return beam(a, b, 0.16, 'rail');
}));

const zp = SL - PB / 2, span = 2 * (SL - 0.7), NM = 2, MW = 0.9, gap = (span - NM * MW) / (NM + 1);
const parapet = FACES.flatMap(([axis, sign]) => {
  const put = onFace(axis, sign, zp - PB / 2, 0);
  return [
    put(0, FLOOR + PT / 2, PB / 2, 2 * SL - 2 * PB, PT, PB, 'wood'),
    ...Array.from({ length: NM }, (_, i) => {
      const u = -span / 2 + gap * (i + 1) + MW * (i + 0.5);
      return [
        put(u, FLOOR + PT + 0.375, PB / 2, MW, 0.75, PB, 'plank'),
        put(u, FLOOR + PT + 0.79, PB / 2, MW + 0.12, 0.08, PB + 0.1, 'cut'),
      ];
    }).flat(),
  ];
});
const pillars = [1, -1].flatMap(sx => [1, -1].flatMap(sz => [
  { c: [sx * (SL - 0.3), FLOOR + 0.6, sz * (SL - 0.3)], h: 1.2, r: [0.2, 0.2], n: 6, color: 'woodLight' },
  { c: [sx * (SL - 0.3), FLOOR + 1.3, sz * (SL - 0.3)], h: 0.2, r: [0.2, 0.05], n: 6, color: 'cut' },
]));

const door = [
  box([0, PLINTH + 1.2, -S - 0.03], [1.5, 2.4, 0.06], 'woodDark'),
  box([0, PLINTH + 1.05, -S - 0.07], [1.0, 2.1, 0.06], 'plank'),
  ...[0.7, 1.7].map(y => box([0, PLINTH + y, -S - 0.11], [1.0, 0.1, 0.03], 'iron')),
  box([0.3, PLINTH + 1.0, -S - 0.12], [0.08, 0.08, 0.04], 'iron'),
  box([0, 0.125, -(S + 0.45)], [1.7, 0.25, 0.5], 'stoneDark'),
];

const PARTS = [
  box([0, PLINTH / 2, 0], [2 * S + 0.4, PLINTH, 2 * S + 0.4], 'stoneDark'),
  box([0, (PLINTH + BODY_TOP) / 2, 0], [2 * S - 0.4, BODY_TOP - PLINTH, 2 * S - 0.4], 'woodDark'),
  ...logs, ...door,
  ...[['z', 1], ['x', 1], ['x', -1]].flatMap(([axis, sign]) => banner(axis, sign, S, 0, 5.4, 0.9, 1.7)),
  ...FACES.flatMap(([axis, sign]) => slit(axis, sign, S, 1.1, 5.9)),
  ...braces,
  box([0, FLOOR - 0.38, 0], [2 * SL - 0.3, 0.24, 0.3], 'rail'),
  box([0, FLOOR - 0.38, 0], [0.3, 0.24, 2 * SL - 0.3], 'rail'),
  ...Array.from({ length: 6 }, (_, i) => box([0, FLOOR - 0.1, -SL + (i + 0.5) * 2 * SL / 6], [2 * SL, 0.2, 2 * SL / 6 - 0.012], i % 2 ? 'plank' : 'woodLight')),
  ...parapet, ...pillars,
  box([-SL + 0.3, FLOOR + 1.4 + 1.0, -SL + 0.3], [0.08, 2.0, 0.08], 'woodLight'),
  box([-SL + 0.3 + 0.42, FLOOR + 1.4 + 1.7, -SL + 0.3], [0.7, 0.42, 0.04], 'team'),
  box([-SL + 0.3 + 0.9, FLOOR + 1.4 + 1.7, -SL + 0.3], [0.26, 0.2, 0.04], 'teamDark'),
];

export default {
  name: 'timber-tower', folder: '3D-models-defense', static: true, joints: [], palette: PALETTE, parts: PARTS, clips: [],
  preview: '25,90,155', previewGap: 130, previewZoom: 1.6,
};
