// orc-siege-workshop.mjs — the orc siege workshop, where ballistas and siege towers are built: a
// hall of crooked logs under a hide roof on a rough stone base, a double gate with iron straps,
// skulls, banners, gable horns and a pennant. In the yard: a ballista under construction (left),
// a log scaffold of a siege tower with a hide-covered stage (right), a rack of bolts, a brazier,
// rocks and bones.
// The orc twin of the human siege workshop: the same 8.0 x 6.0 m hall.
// Static: one mesh, one palette material, no skeleton, no clips.
// Model space: meters, feet at y = 0, origin at the centre of the hall, the gate faces +Z, the
// ridge runs along X.
import { DEG, PALETTE, banner, beam, box, bonePile, brazier, door, faceSpike, gableHorns, logWalls, pennant, rock, rotX, rotY, rotZ, skull, skullStake, spike } from './orc-kit.mjs';
import { gableEnd, gableRoof } from './kit.mjs';

const HX = 4.0, HZ = 3.0, FOOT = 0.25, PITCH = 35 * DEG;
const walls = logWalls({ hx: HX, hz: HZ, y0: FOOT, rows: 7, r: 0.24, seed: 3 });
const TOP = walls.top + 0.24;
const roof = gableRoof({
  pitch: PITCH, halfZ: HZ + 0.2, baseY: TOP + 0.14, len: 2 * HX + 1.0, over: [0.55, 0.5], thick: 0.24,
  colors: ['hide', 'woodDark', 'bone'], courses: [1.0, 2.0, 3.0],
});
const gable = side => gableEnd({ x: HX + 0.15, side, baseY: TOP + 0.12, halfZ: HZ + 0.2, pitch: PITCH, color: 'woodDark' });

const hall = [
  box([0, FOOT / 2, 0], [2 * HX + 0.8, FOOT, 2 * HZ + 0.8], 'stone'),
  ...walls.parts,
  box([0, TOP + 0.02, 0], [2 * HX + 0.5, 0.2, 2 * HZ + 0.5], 'woodDark'),
  ...door({ x: 0, face: HZ, y0: FOOT, w: 3.0, h: 2.5, skullAt: false, double: true }),
  ...skull('z', 1, HZ + 0.12, 0, FOOT + 2.5 + 0.55, 1.2, true),
  ...[1, -1].flatMap(s => [
    ...banner('z', 1, HZ + 0.17, s * 2.7, TOP - 0.15, 0.9, 1.6),
    ...skull('z', 1, HZ + 0.12, s * 2.0, 1.1, 1, true),
    faceSpike('z', 1, HZ + 0.1, s * 3.4, 0.9, 0.9, 0.08, 0.5),
    faceSpike('z', 1, HZ + 0.1, s * 3.4, 1.6, 0.9, 0.08, 0.5),
  ]),
];

// A ballista under construction at (CX, CZ): a stock on two disc wheels, a slider with a bolt, two
// bow arms and a bowstring, still bare timber.
const CX = -HX - 2.4, CZ = 0.5;
const ballista = [
  box([CX, 0.95, CZ], [0.3, 0.26, 3.2], 'wood'),
  box([CX, 1.15, CZ], [0.12, 0.14, 3.0], 'woodLight'),
  ...[1, -1].map(s => ({ c: [CX + s * 0.75, 0.55, CZ + 0.3], h: 0.18, r: [0.55, 0.52], n: 8, q: rotZ(90 * DEG), color: 'woodLight' })),
  ...[1, -1].map(s => ({ c: [CX + s * 0.86, 0.55, CZ + 0.3], h: 0.06, r: [0.14, 0.14], n: 6, q: rotZ(90 * DEG), color: 'iron' })),
  box([CX, 0.55, CZ + 0.3], [1.6, 0.12, 0.12], 'woodDark'),
  ...[1, -1].map(s => beam([CX + s * 0.7, 0.55, CZ + 0.3], [CX + s * 0.3, 0.95, CZ + 0.3], 0.12, 'woodDark')),
  box([CX, 1.35, CZ + 1.15], [0.5, 0.5, 0.4], 'woodDark'),
  ...[1, -1].flatMap(s => [
    beam([CX + s * 0.2, 1.35, CZ + 1.15], [CX + s * 1.45, 1.35, CZ + 0.55], 0.17, 'wood'),
    beam([CX + s * 1.45, 1.35, CZ + 0.55], [CX, 1.3, CZ - 0.5], 0.04, 'hide'),
  ]),
  box([CX, 1.3, CZ - 0.5], [0.3, 0.14, 0.22], 'iron'),
  beam([CX, 1.3, CZ - 0.9], [CX, 1.3, CZ + 1.5], 0.08, 'iron'),
  spike([CX, 1.3, CZ + 1.5], [0, 0, 1], 0.4, 0.07, 'iron'),
  box([CX, 1.1, CZ - 1.55], [0.4, 0.34, 0.1], 'woodDark'),
  ...skull('z', 1, CZ + 1.75, CX, 1.4, 0.8, true),
];

// A bolt rack and a pile of iron-headed bolts.
const rack = [
  box([CX - 2.0, 0.8, CZ - 0.9], [0.14, 1.6, 0.14], 'woodDark'),
  box([CX - 2.0, 0.8, CZ + 0.9], [0.14, 1.6, 0.14], 'woodDark'),
  box([CX - 2.0, 1.5, CZ], [0.14, 0.14, 2.0], 'wood'),
  box([CX - 2.0, 0.6, CZ], [0.14, 0.14, 2.0], 'wood'),
  ...[-0.6, -0.2, 0.2, 0.6].flatMap(dz => [
    beam([CX - 2.0, 1.55, CZ + dz], [CX - 2.0, 0.2, CZ + dz + 0.1], 0.07, 'woodLight'),
    spike([CX - 2.0, 1.55, CZ + dz], [0, 1, 0], 0.3, 0.06, 'iron'),
  ]),
];

// The siege-tower scaffold: crooked log posts, rails, a ladder, a hide-covered stage, spikes on top.
const SX = HX + 2.2, SZ = 0.4, SW = 1.0, SD = 1.3, SH = 4.6;
const scaffold = [
  ...[1, -1].flatMap(sx => [1, -1].map((sz, i) => ({ c: [SX + sx * SW, SH / 2 + 0.03, SZ + sz * SD], h: SH, r: [0.14, 0.17], n: 6, q: rotZ(sx * (i + 1) * 0.8 * DEG), pivot: [SX + sx * SW, 0, SZ + sz * SD], color: i ? 'wood' : 'woodLight' }))),
  ...[1.1, 2.4, 3.7].flatMap(y => [
    ...[1, -1].map(sx => box([SX + sx * SW, y, SZ], [0.14, 0.14, 2 * SD], 'woodDark')),
    ...[1, -1].map(sz => box([SX, y, SZ + sz * SD], [2 * SW, 0.14, 0.14], 'woodDark')),
  ]),
  ...[1, -1].flatMap(sx => [
    beam([SX + sx * SW, 1.1, SZ - SD], [SX + sx * SW, 2.4, SZ + SD], 0.1, 'iron'),
    beam([SX + sx * SW, 2.4, SZ + SD], [SX + sx * SW, 3.7, SZ - SD], 0.1, 'iron'),
  ]),
  box([SX + SW + 0.02, 3.05, SZ], [0.05, 1.2, 2 * SD - 0.2], 'hide'),
  box([SX, 3.77, SZ], [2 * SW - 0.2, 0.06, 2 * SD - 0.2], 'wood'),
  ...[1, -1].map(s => box([SX + s * 0.35, 1.6, SZ + SD + 0.2], [0.07, 3.0, 0.07], 'woodDark')),
  ...[0.4, 0.85, 1.3, 1.75, 2.2, 2.65].map(y => box([SX, y, SZ + SD + 0.2], [0.7, 0.06, 0.06], 'woodDark')),
  ...[1, -1].flatMap(sx => [-1, 1].map(sz => ({ c: [SX + sx * (SW + 0.2), 0.43, SZ + sz * SD * 0.7], h: 0.16, r: [0.42, 0.4], n: 8, q: rotZ(90 * DEG), color: 'woodLight' }))),
  ...[[1, 1], [-1, 1], [1, -1], [-1, -1]].map(([sx, sz]) => spike([SX + sx * SW, SH, SZ + sz * SD], [sx * 0.3, 1, sz * 0.3], 0.5, 0.08, 'bone')),
  ...pennant(SX, SH + 0.05, SZ, 1.3),
];

const PARTS = [
  ...hall, ...roof.parts, gable(1), gable(-1),
  ...gableHorns(HX + 0.65, roof.ridge - 0.12, 1),
  ...gableHorns(-HX - 0.65, roof.ridge - 0.12, -1),
  ...pennant(-HX + 0.4, roof.ridge, 0, 1.5),
  ...ballista, ...rack, ...scaffold,
  ...brazier(2.4, 0.7, HZ + 1.0),
  ...skullStake(-2.4, HZ + 1.2, 1.5),
  ...bonePile(1.2, HZ + 1.3, 1.2),
  rock(-1.6, HZ + 1.5, 0.4, 0.4, 'stoneDark', { turn: 20 }),
  rock(HX + 0.2, HZ + 1.6, 0.35, 0.4, 'stone', { turn: 55 }),
];

export default {
  name: 'orc-siege-workshop', static: true, joints: [], palette: PALETTE, parts: PARTS, clips: [], maxTriangles: 3000,
  preview: '25,90,155', previewGap: 520, previewZoom: 1.8, withAt: [0, 4.6],
};
