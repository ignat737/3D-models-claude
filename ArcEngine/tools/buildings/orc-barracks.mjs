// orc-barracks.mjs — an orc war hall: a long cabin of thick crooked logs on a stone footing, a steep
// hide roof on a bone ridge with horns on both gables, a double iron-strapped door under a tusked
// skull between two hide banners in the team colours, braziers, a war drum, a rack of axes and a
// straw dummy with a skull for a head to train on, a totem on the +X gable and a pennant.
// The orc twin of the human barracks: the same 7.0 x 4.4 m footprint.
// Static: one mesh, one palette material, no skeleton, no clips.
// Model space: meters, feet at y = 0, origin at the centre of the footprint, the door faces +Z,
// the ridge runs along X.
import { DEG, PALETTE, axe, banner, box, brazier, door, drum, faceSpike, gableHorns, logWalls, pennant, rnd, rock, skull, slit, skullStake, spike } from './orc-kit.mjs';
import { gableEnd, gableRoof } from './kit.mjs';

const HX = 3.5, HZ = 2.2, PLINTH = 0.3, PITCH = 38 * DEG;
const walls = logWalls({ hx: HX, hz: HZ, y0: PLINTH, rows: 7, r: 0.27, seed: 8 });
const TOP = walls.top;
const roof = gableRoof({
  pitch: PITCH, halfZ: HZ + 0.05, baseY: TOP + 0.1, len: 2 * HX + 0.9, over: [0.45, 0.4], thick: 0.26,
  colors: ['hide', 'woodDark', 'bone'], courses: [0.9, 1.8, 2.7],
});
const gable = side => gableEnd({ x: HX + 0.05, side, baseY: TOP + 0.08, halfZ: HZ + 0.05, pitch: PITCH, color: 'woodDark' });
const FRONT = HZ;

// A rack of axes: two posts, a bar, four axes hung by the heads.
const rack = (x, z) => [
  ...[-0.8, 0.8].map(s => box([x + s, 0.7, z], [0.12, 1.4, 0.12], 'woodDark')),
  box([x, 1.3, z], [1.8, 0.1, 0.1], 'wood'),
  box([x, 0.6, z], [1.8, 0.08, 0.08], 'wood'),
  ...[-0.6, -0.2, 0.2, 0.6].flatMap((dx, i) => axe(x + dx - 0.12, 0.85, z + 0.07, { len: 0.95, tilt: i % 2 ? 4 : -3, color: i % 2 ? 'iron' : 'stoneLight' })),
];

// A training dummy: a post, arms, a hide body, a skull for a head, an old axe stuck in it.
const dummy = (x, z) => [
  box([x, 0.9, z], [0.14, 1.8, 0.14], 'woodDark'),
  box([x, 1.35, z], [1.0, 0.12, 0.12], 'wood'),
  box([x, 1.2, z], [0.5, 0.7, 0.3], 'hide'),
  box([x, 1.2, z + 0.16], [0.52, 0.12, 0.03], 'teamDark'),
  box([x, 0.72, z], [0.62, 0.1, 0.22], 'woodDark'),
  ...skull('z', 1, z - 0.1, x, 1.95, 0.9),
  { c: [x, 0.05, z], h: 0.1, r: [0.3, 0.3], n: 6, color: 'stoneDark' },
];

const PARTS = [
  box([0, PLINTH / 2, 0], [2 * HX + 0.5, PLINTH, 2 * HZ + 0.5], 'stoneDark'),
  ...[[-3.0, 0.7], [-1.2, 0.5], [1.6, 0.6], [3.2, 0.5]].map(([x, w], i) => box([x, PLINTH + 0.005, HZ + 0.33], [w + 0.3, 0.05, 0.16], i % 2 ? 'bone' : 'stoneLight')),
  ...walls.parts,
  gable(1), gable(-1),
  ...roof.parts,
  ...gableHorns(HX + 0.5, roof.ridge - 0.12, 1),
  ...gableHorns(-HX - 0.5, roof.ridge - 0.12, -1),
  ...[1.5].flatMap(x => [
    box([x, roof.ridge + 0.5, 0], [0.62, 0.8, 0.62], 'stoneDark'),
    box([x, roof.ridge + 0.93, 0], [0.8, 0.12, 0.8], 'stone'),
    box([x, roof.ridge + 1.0, 0], [0.4, 0.04, 0.4], 'fire'),
  ]),
  ...pennant(-HX + 0.4, roof.ridge, 0, 1.7),

  // Front: steps, the double door, banners, braziers, slits.
  box([0, 0.08, HZ + 0.55], [2.9, 0.16, 0.7], 'stoneDark'),
  box([0, 0.2, HZ + 0.35], [2.5, 0.12, 0.4], 'stone'),
  ...door({ x: 0, face: FRONT, y0: PLINTH, w: 1.9, h: 2.4, double: true }),
  ...skull('z', 1, FRONT + 0.14, 0, PLINTH + 3.0, 1.5, true),
  ...[-2.45, 2.45].flatMap(x => banner('z', 1, FRONT, x, 3.4, 0.9, 1.8)),
  ...[-1.6, 1.6].flatMap(x => slit('z', 1, FRONT, x, 2.0)),
  ...[-1.55, 1.55].flatMap(x => brazier(x, 0.75, FRONT + 1.0)),
  // Spiked stakes along the foot of the front wall and on the long sides.
  ...[-3.1, -2.9, 2.8, 3.0].map((x, i) => faceSpike('z', 1, FRONT, x + rnd(i, 1) * 0.1, 0.75 + 0.12 * (i % 2), 0.7, 0.07, 0.2, 'bone')),
  ...[-2.2, -0.7, 0.8, 2.3].map((u, i) => faceSpike('z', -1, FRONT, u, 1.3 + 0.2 * (i % 2), 0.8, 0.07, 0.3, 'bone')),
  // The +X end: a totem pole with a horned skull, a banner and a door-less slit.
  ...banner('x', 1, HX, -1.3, 3.2, 0.9, 1.6),
  ...slit('x', 1, HX, 1.2, 2.0),
  ...[-0.0].flatMap(() => [
    box([HX + 0.8, 1.7, 0.4], [0.3, 3.4, 0.3], 'woodDark'),
    ...skull('x', 1, HX + 0.62, 0.4, 3.0, 1.3, true),
    ...horn2(HX + 0.8, 3.45, 0.4),
  ]),

  // The yard: axes, the dummy, a drum, skull stakes.
  ...rack(2.55, FRONT + 1.35),
  ...dummy(-2.9, FRONT + 1.35),
  ...drum(-1.25, FRONT + 1.55, 0.5, 0.75),
  ...skullStake(3.4, FRONT + 0.75, 1.3, 0.9),
  rock(-3.6, -HZ - 0.5, 0.5, 0.55, 'stone', { turn: 15 }),
  rock(3.3, -HZ - 0.6, 0.4, 0.4, 'stoneDark', { turn: 60 }),
];

// Two bone horns spread from the top of the totem.
function horn2(x, y, z) {
  return [-1, 1].map(s => spike([x, y, z + s * 0.1], [0.3, 0.8, s * 0.9], 0.8, 0.09, 'bone'));
}

export default {
  name: 'orc-barracks', static: true, joints: [], palette: PALETTE, parts: PARTS, clips: [],
  preview: '25,90,155', previewGap: 200, previewZoom: 1.7, withAt: [-0.6, 5.2],
};
