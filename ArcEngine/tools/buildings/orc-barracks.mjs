// orc-barracks.mjs — an orc war hall, big: a long two-storey cabin of thick crooked logs on a stone
// footing (10.4 x 6.4 m), a steep hide roof on a bone ridge with horns on both gables and two smoke
// stacks, shuttered windows in two rows on the front and windows on the back and the ends, a double
// iron-strapped door under a tusked skull between two hide banners in the team colours, braziers, a
// rack of axes, a straw dummy with a skull for a head, a war drum, a totem on the +X gable and a pennant.
// Static: one mesh, one palette material, no skeleton, no clips.
// Model space: meters, feet at y = 0, origin at the centre of the footprint, the door faces +Z,
// the ridge runs along X.
import { DEG, PALETTE, axe, banner, box, brazier, door, drum, faceSpike, gableHorns, logWalls, onFace, pennant, rnd, rock, skull, slit, skullStake, spike } from './orc-kit.mjs';
import { gableEnd, gableRoof } from './kit.mjs';

const HX = 5.2, HZ = 3.2, PLINTH = 0.35, PITCH = 36 * DEG;
const walls = logWalls({ hx: HX, hz: HZ, y0: PLINTH, rows: 9, r: 0.3, seed: 8, over: 0.3 });
const TOP = walls.top;
const roof = gableRoof({
  pitch: PITCH, halfZ: HZ + 0.05, baseY: TOP + 0.1, len: 2 * HX + 1.1, over: [0.55, 0.5], thick: 0.28,
  colors: ['hide', 'woodDark', 'bone'], courses: [1.0, 2.0, 3.0],
});
const gable = side => gableEnd({ x: HX + 0.05, side, baseY: TOP + 0.08, halfZ: HZ + 0.05, pitch: PITCH, color: 'woodDark' });
const FRONT = HZ, XEND = HX + 0.3;                    // log ends stick out at the corners; the wall face is at HZ / HX

// A window in a wall face: dark frame, the opening, team shutters, a bone sill.
const windowAt = (axis, sign, plane, u, y, w = 0.8, h = 0.9, shutters = true) => {
  const put = onFace(axis, sign, plane, 0);
  return [
    put(u, y, 0.04, w + 0.24, h + 0.24, 0.08, 'woodDark'),
    put(u, y, 0.09, w, h, 0.04, 'slit'),
    put(u, y - h / 2 - 0.16, 0.12, w + 0.4, 0.09, 0.14, 'bone'),
    ...(shutters ? [1, -1].map(s => put(u + s * (w / 2 + 0.16), y, 0.11, 0.26, h + 0.1, 0.05, 'team')) : []),
  ];
};

// A rack of axes: two posts, a bar, four axes hung by the heads.
const rack = (x, z) => [
  ...[-0.8, 0.8].map(s => box([x + s, 0.7, z], [0.12, 1.4, 0.12], 'woodDark')),
  box([x, 1.3, z], [1.8, 0.1, 0.1], 'wood'),
  box([x, 0.6, z], [1.8, 0.08, 0.08], 'wood'),
  ...[-0.6, -0.2, 0.2, 0.6].flatMap((dx, i) => axe(x + dx - 0.12, 0.85, z + 0.07, { len: 0.95, tilt: i % 2 ? 4 : -3, color: i % 2 ? 'iron' : 'stoneLight' })),
];

// A training dummy: a post, arms, a hide body, a skull for a head.
const dummy = (x, z) => [
  box([x, 0.9, z], [0.14, 1.8, 0.14], 'woodDark'),
  box([x, 1.35, z], [1.0, 0.12, 0.12], 'wood'),
  box([x, 1.2, z], [0.5, 0.7, 0.3], 'hide'),
  box([x, 1.2, z + 0.16], [0.52, 0.12, 0.03], 'teamDark'),
  box([x, 0.72, z], [0.62, 0.1, 0.22], 'woodDark'),
  ...skull('z', 1, z - 0.1, x, 1.95, 0.9),
  { c: [x, 0.05, z], h: 0.1, r: [0.3, 0.3], n: 6, color: 'stoneDark' },
];

// Two bone horns spread from the top of the totem.
const horn2 = (x, y, z) => [-1, 1].map(s => spike([x, y, z + s * 0.1], [0.3, 0.8, s * 0.9], 0.8, 0.09, 'bone'));

const PARTS = [
  box([0, PLINTH / 2, 0], [2 * HX + 0.7, PLINTH, 2 * HZ + 0.7], 'stoneDark'),
  ...[[-4.0, 0.8], [-1.9, 0.5], [2.2, 0.7], [4.2, 0.5]].map(([x, w], i) => box([x, PLINTH + 0.005, HZ + 0.38], [w + 0.3, 0.05, 0.16], i % 2 ? 'bone' : 'stoneLight')),
  ...walls.parts,
  gable(1), gable(-1),
  ...roof.parts,
  ...gableHorns(HX + 0.6, roof.ridge - 0.12, 1),
  ...gableHorns(-HX - 0.6, roof.ridge - 0.12, -1),
  ...[-2.2, 2.0].flatMap(x => [
    box([x, roof.ridge + 0.5, 0], [0.7, 0.8, 0.7], 'stoneDark'),
    box([x, roof.ridge + 0.93, 0], [0.9, 0.12, 0.9], 'stone'),
    box([x, roof.ridge + 1.0, 0], [0.46, 0.04, 0.46], 'fire'),
  ]),
  ...pennant(-HX + 0.5, roof.ridge, 0, 1.9),

  // Front: steps, the double door under a big skull, banners, braziers, windows in two rows.
  box([0, 0.08, HZ + 0.6], [3.4, 0.16, 0.8], 'stoneDark'),
  box([0, 0.22, HZ + 0.4], [2.9, 0.12, 0.45], 'stone'),
  ...door({ x: 0, face: FRONT, y0: PLINTH, w: 2.2, h: 2.5, double: true, skullAt: false }),
  ...skull('z', 1, FRONT + 0.14, 0, PLINTH + 3.55, 1.7, true),
  ...[-2.55, 2.55].flatMap(x => banner('z', 1, FRONT, x, 4.0, 0.9, 1.9)),
  ...[-3.95, 3.95].flatMap(x => windowAt('z', 1, FRONT, x, 2.0)),
  ...[-4.0, -1.55, 1.55, 4.0].flatMap(x => windowAt('z', 1, FRONT, x, 4.5, 0.7, 0.8)),
  ...[-2.0, 2.0].flatMap(x => brazier(x, 0.75, FRONT + 1.2)),
  // Back: a row of windows, spikes; ends: a window each, banner and totem on +X.
  ...[-3.2, 0, 3.2].flatMap(u => windowAt('z', -1, FRONT, u, 2.6)),
  ...[-4.3, -1.6, 1.6, 4.3].map((u, i) => faceSpike('z', -1, FRONT, u, 1.2 + 0.2 * (i % 2), 0.8, 0.07, 0.3, 'bone')),
  ...[-4.3, -3.7, 3.8, 4.4].map((x, i) => faceSpike('z', 1, FRONT, x + rnd(i, 1) * 0.1, 0.8 + 0.12 * (i % 2), 0.7, 0.07, 0.2, 'bone')),
  ...windowAt('x', -1, HX, 0, 3.0, 0.8, 0.9),
  ...windowAt('x', 1, HX, 1.5, 3.4, 0.8, 0.9),
  ...banner('x', 1, HX, -1.2, 4.4, 0.9, 1.7),
  ...slit('x', 1, HX, -1.2, 2.0),
  box([HX + 0.95, 2.0, 0.4], [0.34, 4.0, 0.34], 'woodDark'),
  ...skull('x', 1, HX + 0.77, 0.4, 3.5, 1.4, true),
  ...horn2(HX + 0.95, 4.05, 0.4),

  // The yard: axes, the dummy, a drum, a skull stake.
  ...rack(3.4, FRONT + 1.5),
  ...dummy(-3.7, FRONT + 1.5),
  ...drum(-1.6, FRONT + 1.9, 0.5, 0.75),
  ...skullStake(4.8, FRONT + 0.9, 1.4, 0.9),
  rock(-5.3, -HZ - 0.6, 0.55, 0.6, 'stone', { turn: 15 }),
  rock(4.7, -HZ - 0.7, 0.45, 0.45, 'stoneDark', { turn: 60 }),
];

export default {
  name: 'orc-barracks', static: true, joints: [], palette: PALETTE, parts: PARTS, clips: [], maxTriangles: 3500,
  preview: '25,90,155', previewGap: 260, previewZoom: 1.8, withAt: [-0.9, 6.0],
};
