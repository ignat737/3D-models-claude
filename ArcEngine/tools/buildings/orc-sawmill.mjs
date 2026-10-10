// orc-sawmill.mjs — an orc sawmill: an open shed on six crooked posts under a hide roof with horns on
// the gables and a plank back wall; a frame saw with a jagged blade over a log on two trestles, driven
// by a pole from a capstan outside on the -X side (four long arms for trolls to push, bone spikes
// on the handles, a trampled ring of earth), stacks of planks, a heap of logs with pale cut ends on
// the +X side, skulls on the front posts, a team banner, an axe in a stump and a pennant.
// The orc twin of the human sawmill: the same 6.4 x 4.4 m shed.
// Static: one mesh, one palette material, no skeleton, no clips.
// Model space: meters, feet at y = 0, origin at the centre of the shed, the open side faces +Z,
// the ridge runs along X.
import { DEG, PALETTE, axe, banner, beam, box, brazier, faceSpike, gableHorns, pennant, rnd, rock, rotX, rotY, rotZ, skull, spike } from './orc-kit.mjs';
import { gableEnd, gableRoof } from './kit.mjs';

const HX = 3.2, HZ = 2.0, POST = 3.0, PITCH = 35 * DEG;
const roof = gableRoof({
  pitch: PITCH, halfZ: HZ + 0.2, baseY: POST + 0.14, len: 2 * HX + 1.0, over: [0.45, 0.45], thick: 0.24,
  colors: ['hide', 'woodDark', 'bone'], courses: [1.0, 2.0],
});
const gable = side => gableEnd({ x: HX + 0.15, side, baseY: POST + 0.12, halfZ: HZ + 0.2, pitch: PITCH, color: 'woodDark' });

const post = (x, z, i) => ({ c: [x, POST / 2 + 0.02, z], h: POST, r: [0.23, 0.18], n: 6, q: rotZ((rnd(i, 1) - 0.5) * 3 * DEG), pivot: [x, 0.02, z], color: ['wood', 'woodDark', 'woodLight'][i % 3] });
const POSTS = [[-HX, HZ], [0, HZ], [HX, HZ], [-HX, -HZ], [0, -HZ], [HX, -HZ]];

const LOG = { y: 1.0, z: 0.2, x0: -1.7, x1: 1.9, r: 0.28 };
const trestle = x => [
  ...[-1, 1].map(s => beam([x, 0.1, LOG.z + s * 0.5], [x, 0.78, LOG.z + s * 0.12], 0.13, 'woodDark')),
  box([x, 0.76, LOG.z], [0.22, 0.12, 0.7], 'wood'),
];
const SAWX = 0.1;
const sawRig = [
  // the log on trestles, the cut end pale
  { c: [(LOG.x0 + LOG.x1) / 2, LOG.y, LOG.z], h: LOG.x1 - LOG.x0, r: [LOG.r, LOG.r * 0.88], n: 6, q: rotZ(90 * DEG), color: 'wood' },
  { c: [LOG.x1 + 0.015, LOG.y, LOG.z], h: 0.03, r: [LOG.r * 0.88, LOG.r * 0.88], n: 6, q: rotZ(90 * DEG), color: 'woodLight' },
  ...trestle(-1.2), ...trestle(1.4),
  // guides, the saw frame, the blade with teeth
  ...[-0.55, 0.95].map(dz => box([SAWX, 1.35, LOG.z + dz], [0.16, 2.7, 0.16], 'woodDark')),
  box([SAWX, 2.62, LOG.z + 0.2], [0.24, 0.22, 1.7], 'wood'),
  ...[-0.8, 0.8].map(dx => box([SAWX + dx, 1.8, LOG.z], [0.12, 1.0, 0.12], 'woodLight')),
  box([SAWX, 2.3, LOG.z], [1.72, 0.12, 0.12], 'woodLight'),
  box([SAWX, 1.36, LOG.z], [1.72, 0.12, 0.12], 'woodLight'),
  box([SAWX, 1.04, LOG.z], [1.56, 0.5, 0.03], 'iron'),
  ...Array.from({ length: 6 }, (_, i) => spike([SAWX - 0.65 + i * 0.26, 0.8, LOG.z], [0, -1, 0], 0.17, 0.07, 'iron')),
  beam([-0.9, 2.4, LOG.z + 0.1], [SAWX, 2.28, LOG.z + 0.1], 0.1, 'woodLight'),
];

// Capstan outside the shed: a post, two crossed arms, handles with bone spikes, a trampled ring.
const CAP = [-5.0, 0.2];
const capstan = [
  { c: [CAP[0], 0.03, CAP[1]], h: 0.06, r: [2.0, 2.0], n: 12, color: 'earth' },
  { c: [CAP[0], 1.1, CAP[1]], h: 2.2, r: [0.24, 0.2], n: 6, color: 'woodDark' },
  { c: [CAP[0], 2.3, CAP[1]], h: 0.26, r: [0.34, 0.05], n: 6, color: 'iron' },
  box([CAP[0], 0.75, CAP[1]], [2.8, 0.16, 0.16], 'wood'),
  box([CAP[0], 0.75, CAP[1]], [0.16, 0.16, 2.8], 'woodLight'),
  ...[[1.4, 0], [-1.4, 0], [0, 1.4], [0, -1.4]].flatMap(([dx, dz]) => [
    box([CAP[0] + dx, 0.55, CAP[1] + dz], [0.14, 0.7, 0.14], 'woodDark'),
    spike([CAP[0] + dx, 0.9, CAP[1] + dz], [Math.sign(dx) * 0.5, 1, Math.sign(dz) * 0.5], 0.3, 0.06, 'bone'),
  ]),
  beam([CAP[0], 2.1, CAP[1]], [-0.9, 2.4, LOG.z + 0.1], 0.12, 'woodLight'),
];

// Logs lying along Z with a pale cut at the front end.
const logPile = [[4.4, 0.3], [5.0, 0.3], [4.7, 0.78]].flatMap(([x, y], i) => [
  { c: [x, y, 0.0 + 0.0], h: 2.8, r: [0.29, 0.25], n: 6, q: [Math.SQRT1_2, 0, 0, Math.SQRT1_2], color: ['woodDark', 'wood', 'woodDark'][i] },
  { c: [x, y, 1.41], h: 0.03, r: [0.29, 0.29], n: 6, q: [Math.SQRT1_2, 0, 0, Math.SQRT1_2], color: 'woodLight' },
]);

const planks = (x, z, n) => Array.from({ length: n }, (_, i) => box([x + (rnd(i, 4) - 0.5) * 0.1, 0.07 + i * 0.13, z], [1.7, 0.12, 0.6], i % 2 ? 'wood' : 'woodLight'));

const PARTS = [
  box([0, 0.03, 0], [2 * HX + 0.2, 0.06, 2 * HZ + 0.4], 'earth'),
  box([SAWX + 0.2, 0.075, LOG.z + 0.2], [2.4, 0.03, 1.6], 'woodLight'),
  ...POSTS.map(([x, z], i) => post(x, z, i)),
  box([0, POST + 0.07, HZ], [2 * HX + 0.8, 0.22, 0.34], 'woodDark'),
  box([0, POST + 0.07, -HZ], [2 * HX + 0.8, 0.22, 0.34], 'woodDark'),
  ...[-HX, 0, HX].map(x => box([x, POST + 0.07, 0], [0.3, 0.22, 2 * HZ + 0.4], 'wood')),
  // Back wall: planks with battens.
  box([0, POST / 2, -HZ - 0.12], [2 * HX, POST, 0.14], 'woodDark'),
  ...[-2.4, -1.2, 0, 1.2, 2.4].map(x => box([x, POST / 2, -HZ - 0.2], [0.1, POST - 0.1, 0.04], 'wood')),
  gable(1), gable(-1),
  ...roof.parts,
  ...gableHorns(HX + 0.65, roof.ridge - 0.12, 1),
  ...gableHorns(-HX - 0.65, roof.ridge - 0.12, -1),
  ...pennant(HX - 0.2, roof.ridge, 0, 1.4),

  ...sawRig,
  ...capstan,
  ...logPile,
  ...planks(-2.2, -1.4, 6),
  ...planks(2.35, -1.4, 4),
  ...planks(-2.4, 1.1, 3).map(p => ({ ...p, c: [p.c[0] + 0.0, p.c[1], p.c[2]], s: [0.6, 0.12, 1.7] })),

  // Front: skulls on the corner posts, a team banner under the beam, an axe in a stump.
  ...skull('z', 1, HZ + 0.18, -HX, 2.45, 0.9, true),
  ...skull('z', 1, HZ + 0.18, HX, 2.45, 0.9, true),
  ...banner('z', 1, HZ + 0.17, -1.6, POST - 0.05, 0.9, 1.4),
  { c: [2.3, 0.25, 1.45], h: 0.5, r: [0.3, 0.27], n: 6, color: 'woodLight' },
  ...axe(2.2, 0.85, 1.45, { len: 0.9, tilt: 0 }),
  ...brazier(-1.9, 0.7, HZ + 0.9),
  rock(-3.8, 2.4, 0.4, 0.4, 'stoneDark', { turn: 20 }),
  rock(3.9, 2.3, 0.3, 0.35, 'stone', { turn: 55 }),
];

export default {
  name: 'orc-sawmill', static: true, joints: [], palette: PALETTE, parts: PARTS, clips: [],
  preview: '25,90,155', previewGap: 310, previewZoom: 1.5, withAt: [1.5, 3.6],
};
