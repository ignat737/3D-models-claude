// orc-hut.mjs — an orc hut: a low cabin of crooked dark logs with the ends left sticking out at the
// corners, a steep roof of stitched hide on a bone ridge, crossed horns on the gables, a hide
// flap for a door under a skull, spikes in the walls, a smoke stack, a fire pit and skull stakes
// in front. The orc twin of the peasant house: the same 4.2 x 3.2 m footprint.
// Static: one mesh, one palette material, no skeleton, no clips.
// Model space: meters, feet at y = 0, origin at the centre of the footprint, the door faces +Z,
// the ridge runs along X.
import { DEG, PALETTE, banner, box, door, firePit, gableHorns, logWalls, pennant, rnd, rock, skull, skullStake, spikeRows } from './orc-kit.mjs';
import { gableEnd, gableRoof } from './kit.mjs';

const HX = 2.1, HZ = 1.6, PLINTH = 0.22, PITCH = 40 * DEG;
const walls = logWalls({ hx: HX, hz: HZ, y0: PLINTH, rows: 6, r: 0.22, seed: 3 });
const TOP = walls.top;
const roof = gableRoof({
  pitch: PITCH, halfZ: HZ + 0.05, baseY: TOP + 0.1, len: 2 * HX + 0.8, over: [0.4, 0.4], thick: 0.24,
  colors: ['hide', 'woodDark', 'bone'], courses: [0.8, 1.7],
});
const gable = side => gableEnd({ x: HX + 0.05, side, baseY: TOP + 0.08, halfZ: HZ + 0.05, pitch: PITCH, color: 'woodDark' });
const D = { x: 0.9, w: 0.95, h: 1.95 };
const WIN = { x: -0.95, y: 1.45 };

const PARTS = [
  box([0, PLINTH / 2, 0], [2 * HX + 0.4, PLINTH, 2 * HZ + 0.4], 'stoneDark'),
  ...[[-1.7, 0.5], [-0.4, 0.3], [1.2, 0.4], [2.0, 0.25]].map(([x, w], i) => box([x, PLINTH + 0.005, HZ + 0.26], [w + 0.3, 0.05, 0.14], i % 2 ? 'bone' : 'stoneLight')),
  ...walls.parts,
  gable(1), gable(-1),
  ...roof.parts,
  ...gableHorns(HX + 0.45, roof.ridge - 0.12, 1),
  ...gableHorns(-HX - 0.45, roof.ridge - 0.12, -1),
  // Smoke stack on the ridge with a glow.
  box([-0.9, roof.ridge + 0.5, 0], [0.62, 0.8, 0.62], 'stoneDark'),
  box([-0.9, roof.ridge + 0.93, 0], [0.8, 0.12, 0.8], 'stone'),
  box([-0.9, roof.ridge + 1.0, 0], [0.4, 0.04, 0.4], 'fire'),
  ...pennant(HX - 0.3, roof.ridge, 0, 1.4),

  ...door({ x: D.x, face: HZ, y0: PLINTH, w: D.w, h: D.h, skullAt: false }),
  // Window: a slit in a frame with team hide flaps.
  box([WIN.x, WIN.y, HZ + 0.03], [0.7, 0.6, 0.06], 'woodDark'),
  box([WIN.x, WIN.y, HZ + 0.065], [0.46, 0.4, 0.04], 'slit'),
  ...[1, -1].map(s => box([WIN.x + s * 0.43, WIN.y, HZ + 0.08], [0.22, 0.58, 0.05], 'team')),
  box([WIN.x, WIN.y + 0.42, HZ + 0.14], [0.8, 0.1, 0.1], 'bone'),
  // Skulls and spikes on the walls.
  ...skull('z', 1, HZ + 0.12, 0.0, 1.9, 0.8, true),
  ...spikeRows('z', 1, HZ + 0.1, -2.0, -1.4, [0.7], 0.6, 5),
  ...spikeRows('x', 1, HX + 0.1, -1.4, 1.4, [0.8, 1.6], 0.9, 11),
  ...banner('x', 1, HX + 0.1, 0, 2.2, 0.8, 1.3),
  // Out front: fire pit, skull stakes, a heap of firewood by the wall.
  ...firePit(-1.55, HZ + 1.25, 0.5),
  ...skullStake(2.2, HZ + 0.9, 1.4, 0.9),
  ...skullStake(-0.2, HZ + 1.8, 1.0, 0.8),
  ...[0, 1, 2].map(i => ({ c: [-1.9 + i * 0.36, 0.14, -HZ - 0.55], h: 1.0, r: [0.14, 0.12], n: 5, q: [0, 0, Math.SQRT1_2, Math.SQRT1_2], color: ['wood', 'woodLight', 'woodDark'][i] })),
  ...[0, 1].map(i => ({ c: [-1.72 + i * 0.36, 0.38, -HZ - 0.55], h: 1.0, r: [0.14, 0.12], n: 5, q: [0, 0, Math.SQRT1_2, Math.SQRT1_2], color: ['woodDark', 'wood'][i] })),
  rock(1.1, -HZ - 0.7, 0.4, 0.45, 'stone', { turn: 20 }),
  rock(1.7, -HZ - 0.55, 0.28, 0.3, 'stoneDark', { turn: 50 }),
];

export default {
  name: 'orc-hut', static: true, joints: [], palette: PALETTE, parts: PARTS, clips: [],
  preview: '25,90,155', previewGap: 150, previewZoom: 1.6, withAt: [-1.2, 3.4],
};
