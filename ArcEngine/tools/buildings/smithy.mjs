// smithy.mjs — a village smithy: soot-dark stone walls, a slate gable roof over
// an open forge bay on the front, a big stone chimney on the +X gable, a hearth with glowing coals,
// an anvil on a stump, a quenching trough, a grindstone, barrels with swords, a team-coloured
// sign, shutters and a flag on the ridge.
// Static: one mesh, one palette material, no skeleton, no clips.
// Model space: meters, feet at y = 0, origin at the centre of the footprint, the forge bay and the
// door face +Z, the ridge runs along X.
import { DEG, qmul, rotX, rotZ } from '../unit-glb.mjs';
import { barrel, box, flag, gableEnd, gableRoof } from './kit.mjs';

const PALETTE = [
  { name: 'stone', hex: '#7f7b76' },
  { name: 'stoneDark', hex: '#56534f' },
  { name: 'timber', hex: '#4f3523' },
  { name: 'timberLight', hex: '#8a6038' },
  { name: 'slate', hex: '#5e6672' },
  { name: 'slateDark', hex: '#454b55' },
  { name: 'slateLight', hex: '#7b8493' },
  { name: 'slit', hex: '#1b1e24' },
  { name: 'iron', hex: '#3a3a3f' },
  { name: 'steel', hex: '#b9bfc6' },
  { name: 'fire', hex: '#ff9a2e' },
  { name: 'water', hex: '#4d7fa6' },
  { name: 'leather', hex: '#a9743f' },
  { name: 'gold', hex: '#d9a93a' },
  { name: 'team', hex: '#2f5da8' },
  { name: 'teamDark', hex: '#22447d' },
];

const LEN = 5.6, DEPTH = 4.2, HX = LEN / 2, HZ = DEPTH / 2;
const FOOT = 0.25, TOP = 2.5, W = 0.3, H = TOP - FOOT;
const PITCH = 33 * DEG;
const BAY = 0.3;                                 // the open bay starts at this x and runs to the +X wall

const roof = gableRoof({
  pitch: PITCH, halfZ: HZ + 0.05, baseY: TOP + 0.12, len: LEN + 0.6, over: [0.5, 0.4], thick: 0.26,
  colors: ['slate', 'slateDark', 'slateLight'], courses: [0.8, 1.6, 2.4],
});
const RIDGE = roof.ridge;
const gable = side => gableEnd({ x: HX + 0.05, side, baseY: TOP + 0.1, halfZ: HZ + 0.05, pitch: PITCH, color: 'stone' });

const anvil = [1.9, HZ + 1.0];
const hearth = [2.15, -0.25];
const door = { x: -1.9, w: 0.9, h: 1.9 };
const win = { x: -0.55, y: 1.5 };

const PARTS = [
  // Footing and walls: back, two ends, the front left of the bay, a lintel over the bay.
  box([0, FOOT / 2, 0], [LEN + 0.2, FOOT, DEPTH + 0.2], 'stoneDark'),
  box([0, FOOT + H / 2, -HZ + W / 2], [LEN, H, W], 'stone'),
  ...[1, -1].map(s => box([s * (HX - W / 2), FOOT + H / 2, 0], [W, H, DEPTH], 'stone')),
  box([(-HX + BAY) / 2, FOOT + H / 2, HZ - W / 2], [BAY + HX, H, W], 'stone'),
  box([(BAY + HX) / 2, 2.2, HZ - W / 2], [HX - BAY, 0.6, W], 'stone'),
  ...[1, -1].flatMap(sx => [1, -1].map(sz => box([sx * HX, FOOT + H / 2, sz * HZ], [0.4, H, 0.4], 'stoneDark'))),
  box([BAY, FOOT + H / 2, HZ], [0.26, H, 0.34], 'timber'),
  // Top plate and the stone gables.
  ...[1, -1].map(s => box([0, TOP + 0.06, s * HZ], [LEN + 0.3, 0.12, 0.4], 'timber')),
  ...[1, -1].map(s => box([s * HX, TOP + 0.06, 0], [0.4, 0.12, DEPTH], 'timber')),
  gable(1), gable(-1),
  box([-HX - 0.03, TOP + 0.7, 0], [0.08, 0.4, 0.3], 'slit'),
  ...roof.parts,
  // Chimney on the +X gable: a wide base, a narrower stack, a cap.
  box([HX + 0.45, 2.5, -0.3], [0.8, 5.0, 1.2], 'stone'),
  box([HX + 0.45, 5.6, -0.3], [0.6, 1.4, 0.9], 'stone'),
  box([HX + 0.45, 6.36, -0.3], [0.78, 0.12, 1.08], 'stoneDark'),
  box([HX + 0.45, 6.45, -0.3], [0.4, 0.08, 0.6], 'fire'),
  box([HX + 0.45, 1.0, -0.3], [0.9, 0.12, 1.3], 'stoneDark'),

  // Hearth inside the bay: stone block, mouth with a glow, coals on top, a hood to the chimney.
  box([hearth[0], 0.45, hearth[1]], [1.1, 0.9, 1.3], 'stoneDark'),
  box([hearth[0], 0.42, hearth[1] + 0.66], [0.7, 0.4, 0.04], 'slit'),
  box([hearth[0], 0.36, hearth[1] + 0.68], [0.5, 0.2, 0.03], 'fire'),
  box([hearth[0], 0.93, hearth[1]], [0.85, 0.06, 0.95], 'fire'),
  box([hearth[0] + 0.1, 1.9, hearth[1]], [0.8, 0.9, 1.1], 'stoneDark'),
  box([hearth[0] - 0.2, 1.4, hearth[1]], [0.3, 0.1, 0.9], 'stoneDark'),
  // Bellows with a nozzle and a handle.
  box([1.0, 0.55, -0.15], [0.7, 0.26, 0.5], 'leather', { q: rotZ(-12 * DEG), pivot: [1.0, 0.55, -0.15] }),
  box([1.0, 0.4, -0.15], [0.6, 0.1, 0.4], 'timberLight'),
  box([1.45, 0.62, -0.15], [0.3, 0.07, 0.07], 'iron'),
  box([0.55, 0.85, -0.15], [0.3, 0.07, 0.07], 'timber'),

  // Anvil on a stump, a hammer across it.
  { c: [anvil[0], 0.3, anvil[1]], h: 0.6, r: [0.3, 0.27], n: 6, color: 'timberLight' },
  box([anvil[0], 0.68, anvil[1]], [0.3, 0.16, 0.2], 'iron'),
  box([anvil[0], 0.8, anvil[1]], [0.18, 0.14, 0.16], 'iron'),
  box([anvil[0], 0.93, anvil[1]], [0.72, 0.14, 0.24], 'iron'),
  { c: [anvil[0] + 0.5, 0.93, anvil[1]], h: 0.3, r: [0.1, 0.02], n: 4, q: rotZ(-90 * DEG), color: 'iron' },
  box([anvil[0] - 0.1, 1.03, anvil[1]], [0.04, 0.04, 0.45], 'timberLight', { q: rotX(0), pivot: [0, 0, 0] }),
  box([anvil[0] - 0.1, 1.06, anvil[1] - 0.2], [0.14, 0.1, 0.12], 'steel'),
  // Quenching trough and a stack of iron bars.
  box([0.75, 0.28, HZ + 0.95], [1.0, 0.5, 0.5], 'timber'),
  box([0.75, 0.52, HZ + 0.95], [0.84, 0.06, 0.34], 'water'),
  ...[0, 1, 2].map(i => box([0.9, 0.08 + i * 0.13, 0.9], [0.5, 0.1, 0.35], i % 2 ? 'iron' : 'steel')),

  // Door in the stone front: stone lintel, timber frame, plank leaf, iron strap.
  box([door.x, FOOT + door.h + 0.12, HZ + 0.04], [door.w + 0.5, 0.24, 0.12], 'stoneDark'),
  box([door.x, FOOT + door.h / 2, HZ + 0.02], [door.w + 0.14, door.h, 0.06], 'timber'),
  box([door.x, FOOT + (door.h - 0.05) / 2, HZ + 0.055], [door.w - 0.06, door.h - 0.1, 0.04], 'timberLight'),
  box([door.x, 1.3, HZ + 0.085], [door.w - 0.06, 0.1, 0.02], 'iron'),
  box([door.x, 0.6, HZ + 0.085], [door.w - 0.06, 0.1, 0.02], 'iron'),
  box([door.x + 0.3, 1.0, HZ + 0.095], [0.08, 0.08, 0.03], 'iron'),
  box([door.x, 0.1, HZ + 0.3], [door.w + 0.5, 0.2, 0.5], 'stoneDark'),
  // Window with team shutters and a hanging sign on an iron bracket.
  box([win.x, win.y, HZ + 0.02], [0.76, 0.66, 0.06], 'timber'),
  box([win.x, win.y, HZ + 0.045], [0.56, 0.46, 0.04], 'slit'),
  box([win.x, win.y - 0.4, HZ + 0.08], [0.9, 0.07, 0.14], 'timberLight'),
  ...[1, -1].map(s => box([win.x + s * 0.5, win.y, HZ + 0.06], [0.3, 0.64, 0.04], 'team')),
  box([win.x, 2.2, HZ + 0.26], [0.06, 0.06, 0.5], 'iron'),
  box([win.x, 2.0, HZ + 0.5], [0.46, 0.34, 0.05], 'team'),
  box([win.x, 2.0, HZ + 0.535], [0.28, 0.1, 0.02], 'gold'),
  box([win.x, 1.89, HZ + 0.535], [0.14, 0.1, 0.02], 'gold'),

  // Barrels with swords, a coal pile, a grindstone, a leather apron on the post.
  ...barrel(-2.85, HZ + 0.4, { color: 'timberLight' }),
  ...[-0.1, 0.0, 0.1].map((dx, i) => box([-2.85 + dx, 1.05, HZ + 0.4 + [-0.05, 0.06, 0][i]], [0.04, 0.8, 0.02], 'steel', { q: rotZ(dx * 40 * DEG), pivot: [-2.85 + dx, 0.7, HZ + 0.4] })),
  { c: [-3.3, 0.2, 0.9], h: 0.4, r: [0.5, 0.12], n: 6, color: 'slit' },
  box([3.45, 0.55, 1.4], [0.7, 0.07, 0.12], 'timber'),
  ...[1, -1].map(s => box([3.45, 0.31, 1.4 + s * 0.28], [0.08, 0.6, 0.08], 'timber', { q: rotX(s * 8 * DEG), pivot: [3.45, 0.31, 1.4 + s * 0.28] })),
  { c: [3.45, 0.58, 1.4], h: 0.14, r: [0.4, 0.4], n: 12, q: rotX(90 * DEG), color: 'stoneDark' },
  box([BAY, 1.5, HZ + 0.2], [0.3, 0.6, 0.03], 'leather'),
  box([BAY, 1.81, HZ + 0.2], [0.34, 0.1, 0.04], 'team'),

  // Flag on the ridge.
  ...flag(-1.8, RIDGE, 0, { pole: 1.5 }),
];

export default {
  name: 'smithy', static: true, joints: [], palette: PALETTE, parts: PARTS, clips: [],
  preview: '25,90,155', previewGap: 220,
  withAt: [-0.4, 3.0],
  previewZoom: 1.3,
};
