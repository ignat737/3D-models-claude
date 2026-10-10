// orc-smithy.mjs — an orc forge: soot-black rough stone walls with charred beams, a steep iron-plate
// roof, a forge bay open on the front (a hearth with glowing coals, hide bellows, a giant anvil on a
// stump with a spiked hammer, a quench trough, racks of jagged blades), a huge chimney on the +X
// gable with a skull on its face and fire in the cap, a door under a skull, a hide-and-bone sign
// in the team colours, a barrel of spiked clubs, a slag heap and a pennant.
// The orc twin of the human smithy: the same 5.6 x 4.2 m footprint.
// Static: one mesh, one palette material, no skeleton, no clips.
// Model space: meters, feet at y = 0, origin at the centre of the footprint, the forge bay and the
// door face +Z, the ridge runs along X.
import { DEG, PALETTE, banner, box, door, faceSpike, gableHorns, pennant, rnd, rock, rotX, rotY, rotZ, skull, spike, spikeRows } from './orc-kit.mjs';
import { gableEnd, gableRoof } from './kit.mjs';

const LEN = 5.6, DEPTH = 4.2, HX = LEN / 2, HZ = DEPTH / 2;
const FOOT = 0.25, TOP = 2.6, W = 0.35, H = TOP - FOOT, PITCH = 36 * DEG, BAY = 0.3;
const roof = gableRoof({
  pitch: PITCH, halfZ: HZ + 0.05, baseY: TOP + 0.12, len: LEN + 0.7, over: [0.5, 0.4], thick: 0.26,
  colors: ['iron', 'char', 'bone'], courses: [0.8, 1.6, 2.4],
});
const gable = side => gableEnd({ x: HX + 0.05, side, baseY: TOP + 0.1, halfZ: HZ + 0.05, pitch: PITCH, color: 'stoneDark' });
const hearth = [1.75, -0.75], anvil = [1.2, HZ - 0.55];
const CH = [HX + 0.55, -0.3];                          // chimney centre

// Courses of dark mortar bands and a few light blocks on a stone wall (front-left, back, +X end).
const bands = (axis, sign, plane, len, mid = 0) => [0.8, 1.5, 2.2].map(y => box(axis === 'z' ? [mid, y, sign * (plane + 0.01)] : [sign * (plane + 0.01), y, mid], axis === 'z' ? [len, 0.05, 0.02] : [0.02, 0.05, len], 'char'));

const PARTS = [
  box([0, FOOT / 2, 0], [LEN + 0.3, FOOT, DEPTH + 0.3], 'char'),
  box([0, FOOT + H / 2, -HZ + W / 2], [LEN, H, W], 'stoneDark'),
  ...[1, -1].map(s => box([s * (HX - W / 2), FOOT + H / 2, 0], [W, H, DEPTH], 'stoneDark')),
  box([(-HX + BAY) / 2, FOOT + H / 2, HZ - W / 2], [BAY + HX, H, W], 'stone'),
  box([(BAY + HX) / 2, 2.25, HZ - W / 2], [HX - BAY, 0.7, W], 'stoneDark'),
  box([(BAY + HX) / 2, 1.85, HZ - W / 2 + 0.05], [HX - BAY, 0.18, W + 0.1], 'woodDark'),
  ...[1, -1].flatMap(sx => [1, -1].map(sz => box([sx * HX, FOOT + H / 2, sz * HZ], [0.45, H, 0.45], 'char'))),
  box([BAY, FOOT + H / 2, HZ], [0.3, H, 0.38], 'woodDark'),
  ...[1, -1].map(s => box([0, TOP + 0.06, s * HZ], [LEN + 0.3, 0.12, 0.45], 'woodDark')),
  ...[1, -1].map(s => box([s * HX, TOP + 0.06, 0], [0.45, 0.12, DEPTH], 'woodDark')),
  gable(1), gable(-1),
  ...roof.parts,
  ...bands('z', 1, HZ, 3.1, (-HX + BAY) / 2),
  ...bands('z', -1, HZ, LEN),
  ...bands('x', -1, HX, DEPTH),
  box([-1.9, 0.5, HZ + 0.01], [0.5, 0.3, 0.04], 'stoneLight'),
  box([-0.5, 1.6, HZ + 0.01], [0.6, 0.35, 0.04], 'stoneLight'),
  ...gableHorns(-HX - 0.45, roof.ridge - 0.12, -1),
  ...pennant(-HX + 0.5, roof.ridge, 0, 1.5),

  // Chimney on the +X gable: a wide base, a tall stack, a cap with fire, a skull on its face.
  box([CH[0], 2.9, CH[1]], [1.0, 5.8, 1.4], 'stoneDark'),
  box([CH[0], 6.4, CH[1]], [0.8, 1.4, 1.1], 'stoneDark'),
  box([CH[0], 7.18, CH[1]], [1.0, 0.16, 1.3], 'stone'),
  box([CH[0], 7.3, CH[1]], [0.5, 0.1, 0.8], 'fire'),
  ...[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([sx, sz]) => spike([CH[0] + sx * 0.42, 7.22, CH[1] + sz * 0.55], [sx * 0.35, 1, sz * 0.35], 0.55, 0.07, 'bone')),
  ...skull('z', 1, CH[1] + 0.7, CH[0], 4.6, 1.5, true),
  ...[2.4, 3.4, 5.6].map(y => box([CH[0], y, CH[1] + 0.71], [1.02, 0.06, 0.02], 'char')),
  box([CH[0], 0.6, CH[1]], [1.2, 0.2, 1.6], 'char'),

  // The hearth in the bay: a block with a mouth and a glow, coals on top, a hood to the chimney.
  box([hearth[0], 0.5, hearth[1]], [1.3, 1.0, 1.2], 'stoneDark'),
  box([hearth[0], 0.45, hearth[1] + 0.61], [0.8, 0.45, 0.04], 'slit'),
  box([hearth[0], 0.4, hearth[1] + 0.63], [0.6, 0.24, 0.03], 'fire'),
  box([hearth[0], 1.04, hearth[1]], [1.0, 0.08, 0.9], 'fire'),
  box([hearth[0] + 0.15, 1.9, hearth[1]], [0.9, 1.0, 1.0], 'stoneDark'),
  box([hearth[0] - 0.2, 1.45, hearth[1]], [0.3, 0.1, 1.0], 'char'),
  // Bellows of hide with a nozzle.
  box([0.75, 0.6, -0.55], [0.8, 0.3, 0.55], 'hide', { q: rotZ(-14 * DEG), pivot: [0.75, 0.6, -0.55] }),
  box([0.75, 0.4, -0.55], [0.7, 0.1, 0.45], 'woodDark'),
  box([1.2, 0.68, -0.6], [0.32, 0.08, 0.08], 'iron'),
  box([0.3, 0.92, -0.55], [0.34, 0.07, 0.07], 'woodDark'),

  // A giant anvil on a stump, a spiked hammer across it.
  { c: [anvil[0], 0.3, anvil[1]], h: 0.6, r: [0.36, 0.3], n: 6, color: 'woodLight' },
  box([anvil[0], 0.7, anvil[1]], [0.34, 0.18, 0.24], 'iron'),
  box([anvil[0], 0.84, anvil[1]], [0.2, 0.14, 0.18], 'iron'),
  box([anvil[0], 0.98, anvil[1]], [0.85, 0.16, 0.28], 'iron'),
  spike([anvil[0] + 0.42, 0.98, anvil[1]], [1, 0, 0], 0.35, 0.1, 'iron'),
  box([anvil[0] - 0.1, 1.09, anvil[1]], [0.05, 0.05, 0.6], 'woodDark'),
  box([anvil[0] - 0.1, 1.15, anvil[1] - 0.28], [0.2, 0.14, 0.14], 'iron'),
  spike([anvil[0] - 0.1, 1.15, anvil[1] - 0.35], [0, 0, -1], 0.2, 0.06, 'iron'),
  // Quench trough (dark liquid) and a stack of iron bars.
  box([0.9, 0.3, HZ + 0.85], [1.1, 0.55, 0.55], 'woodDark'),
  box([0.9, 0.55, HZ + 0.85], [0.92, 0.06, 0.38], 'slit'),
  ...[0, 1, 2].map(i => box([2.0, 0.08 + i * 0.13, HZ + 0.95], [0.55, 0.1, 0.35], 'iron')),

  // The door in the stone front, under a skull; a sign of hide and bone in the team colours.
  ...door({ x: -1.85, face: HZ, y0: FOOT, w: 1.0, h: 2.0, skullAt: false }),
  box([-0.7, 2.15, HZ + 0.3], [0.07, 0.07, 0.6], 'bone'),
  box([-0.7, 1.82, HZ + 0.6], [0.7, 0.55, 0.06], 'team'),
  box([-0.7, 1.55, HZ + 0.6], [0.7, 0.12, 0.07], 'teamDark'),
  box([-0.7, 1.84, HZ + 0.65], [0.26, 0.26, 0.03], 'red'),
  // Jagged blades on a rack on the front wall, spikes in the walls.
  box([-0.95, 1.1, HZ + 0.05], [0.12, 0.8, 0.1], 'woodDark'),
  ...[0, 1, 2].map(i => box([-0.95 + (i - 1) * 0.0, 1.05, HZ + 0.12], [0.06, 0.8, 0.02], 'iron', { q: rotZ((i - 1) * 18 * DEG), pivot: [-0.95, 1.05, HZ + 0.12] })),
  ...spikeRows('x', 1, HX + 0.02, -2.0, -0.7, [1.2, 2.0], 0.65, 21),
  ...spikeRows('x', -1, HX, -1.5, 1.5, [1.4], 0.9, 33),

  // Barrel of spiked clubs, a slag heap, a heap of ore rocks, chains hung from the beam.
  { c: [-2.55, 0.35, HZ + 0.65], h: 0.7, r: [0.34, 0.3], n: 8, color: 'wood' },
  ...[-0.1, 0.1, 0.0].map((dx, i) => box([-2.55 + dx, 1.0, HZ + 0.65], [0.1, 0.9, 0.1], 'woodDark', { q: rotZ(dx * 60 * DEG), pivot: [-2.55 + dx, 0.7, HZ + 0.65] })),
  { c: [-3.35, 0.22, 0.9], h: 0.44, r: [0.65, 0.2], n: 6, color: 'char' },
  rock(-3.4, -0.5, 0.45, 0.5, 'stone', { turn: 30 }),
  ...[1.9, 2.5].map(x => box([x, 1.55, HZ - 0.2], [0.05, 0.55, 0.05], 'iron')),
];

export default {
  name: 'orc-smithy', static: true, joints: [], palette: PALETTE, parts: PARTS, clips: [],
  preview: '25,90,155', previewGap: 190, previewZoom: 1.6, withAt: [-0.4, 3.6],
};
