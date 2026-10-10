// sawmill.mjs — a water-driven sawmill: an open timber shed under a shingle roof, a circular saw
// bench with a log on it, a big undershot water wheel on the -X end fed by a flume and a pond,
// log pile, plank stacks, sawdust, an axe in a stump, team banners on the front posts and a flag
// on the ridge.
// Static: one mesh, one palette material, no skeleton, no clips.
// Model space: meters, feet at y = 0, origin at the centre of the footprint, the open side faces
// +Z, the ridge runs along X.
import { DEG, rotX, rotZ } from '../unit-glb.mjs';
import { box, flag, gableEnd, gableRoof } from './kit.mjs';

const PALETTE = [
  { name: 'stoneDark', hex: '#615f5a' },
  { name: 'wood', hex: '#a47a4a' },
  { name: 'woodDark', hex: '#5b3d25' },
  { name: 'woodLight', hex: '#d2aa6c' },
  { name: 'bark', hex: '#6f4f33' },
  { name: 'shingle', hex: '#7a5a3c' },
  { name: 'shingleDark', hex: '#5c4129' },
  { name: 'shingleLight', hex: '#98724a' },
  { name: 'sawdust', hex: '#dfc59a' },
  { name: 'slit', hex: '#1d2229' },
  { name: 'iron', hex: '#37373b' },
  { name: 'steel', hex: '#c4c9d0' },
  { name: 'leather', hex: '#a9743f' },
  { name: 'water', hex: '#4d7fa6' },
  { name: 'team', hex: '#2f5da8' },
  { name: 'teamDark', hex: '#22447d' },
];

const LEN = 6.4, DEPTH = 4.4, HX = LEN / 2, HZ = DEPTH / 2;
const FOOT = 0.2, TOP = 2.7;
const PITCH = 34 * DEG;

const roof = gableRoof({
  pitch: PITCH, halfZ: HZ + 0.1, baseY: TOP + 0.16, len: LEN + 0.7, over: [0.5, 0.4], thick: 0.22,
  colors: ['shingle', 'shingleDark', 'shingleLight'], courses: [0.7, 1.4, 2.1, 2.8],
});
const RIDGE = roof.ridge;
const gable = side => gableEnd({ x: HX + 0.05, side, baseY: TOP + 0.14, halfZ: HZ + 0.1, pitch: PITCH, color: 'wood' });

// The water wheel: two octagonal rims, four spokes, eight paddles, a hub; axis along X.
const WHEEL = { x: -HX - 0.8, y: 1.75, z: 0.25, r: 1.4 };
const wheel = (() => {
  const { x, y, z, r } = WHEEL, rho = r * Math.cos(22.5 * DEG), seg = 2 * r * Math.sin(22.5 * DEG);
  const at = (rad, th) => [y + rad * Math.sin(th * DEG), z + rad * Math.cos(th * DEG)];
  const parts = [];
  for (let k = 0; k < 8; k++) {
    const th = k * 45 + 22.5, [py, pz] = at(rho, th);
    for (const dx of [-0.3, 0.3]) parts.push(box([x + dx, py, pz], [0.1, 0.14, seg + 0.1], 'woodDark', { q: rotX((th - 90) * DEG), pivot: [x + dx, py, pz] }));
    const [qy, qz] = at(r, k * 45);
    parts.push(box([x, qy, qz], [0.6, 0.08, 0.36], 'wood', { q: rotX(-k * 45 * DEG), pivot: [x, qy, qz] }));
  }
  for (let k = 0; k < 4; k++) parts.push(box([x, y, z], [0.1, 0.1, 2 * rho], 'wood', { q: rotX(-k * 45 * DEG), pivot: [x, y, z] }));
  parts.push({ c: [x, y, z], h: 0.8, r: [0.22, 0.22], n: 6, q: rotZ(90 * DEG), color: 'woodDark' });
  return parts;
})();

// A log lying along Z with a pale cut at its +Z end.
const logZ = (x, y, z, len, r) => [
  { c: [x, y, z], h: len, r: [r, r], n: 6, q: rotX(90 * DEG), color: 'bark' },
  { c: [x, y, z + len / 2 + 0.01], h: 0.03, r: [r * 0.9, r * 0.9], n: 6, q: rotX(90 * DEG), color: 'woodLight' },
];

// A stack of boards: a block with proud darker bands.
const planks = (x, z, w, d, h) => [
  box([x, FOOT + h / 2, z], [w, h, d], 'woodLight'),
  ...[-0.35, 0.35].map(f => box([x + f * w, FOOT + h / 2, z], [0.1, h + 0.04, d + 0.04], 'wood')),
  ...[0.3, 0.6, 0.85].map(f => box([x, FOOT + f * h, z + d / 2 + 0.005], [w + 0.04, 0.025, 0.02], 'wood')),
];

const BENCH = { x0: -2.0, x1: 1.6, y: 0.9, z: 0.25 };
const SAW_X = 0.4;

const PARTS = [
  // Footing, six posts, the back wall of boards, plates and tie beams.
  box([0, FOOT / 2, 0], [LEN + 0.2, FOOT, DEPTH + 0.2], 'stoneDark'),
  ...[-HX, 0, HX].flatMap(x => [1, -1].map(s => box([x, FOOT + (TOP - FOOT) / 2, s * HZ], [0.3, TOP - FOOT, 0.3], 'woodDark'))),
  box([0, FOOT + (TOP - FOOT) / 2, -HZ + 0.12], [LEN, TOP - FOOT, 0.16], 'wood'),
  ...[-2.4, -1.6, -0.8, 0, 0.8, 1.6, 2.4].map(x => box([x, FOOT + (TOP - FOOT) / 2, -HZ + 0.2], [0.07, TOP - FOOT, 0.04], 'woodDark')),
  box([0, 1.2, -HZ + 0.2], [LEN, 0.09, 0.05], 'woodDark'),
  ...[1, -1].map(s => box([0, TOP + 0.08, s * HZ], [LEN + 0.3, 0.16, 0.3], 'woodDark')),
  ...[-HX, 0, HX].map(x => box([x, TOP + 0.08, 0], [0.3, 0.16, DEPTH], 'woodDark')),
  ...[1, -1].map(s => box([s * HX, 2.15, HZ - 0.3], [0.2, 0.2, 0.9], 'woodDark')),
  gable(1), gable(-1),
  ...[1, -1].map(s => box([s * (HX + 0.07), TOP + 0.75, 0], [0.04, 0.6, 0.4], 'slit')),
  ...roof.parts,

  // Circular saw bench: legs, a bed with a rail, a log on it, the blade, its hub.
  ...[BENCH.x0 + 0.2, BENCH.x1 - 0.2].flatMap(x => [BENCH.z - 0.35, BENCH.z + 0.35].map(z => box([x, BENCH.y / 2, z], [0.14, BENCH.y, 0.14], 'woodDark'))),
  box([(BENCH.x0 + BENCH.x1) / 2, BENCH.y - 0.05, BENCH.z], [BENCH.x1 - BENCH.x0, 0.1, 0.9], 'wood'),
  box([(BENCH.x0 + BENCH.x1) / 2, BENCH.y + 0.04, BENCH.z + 0.45], [BENCH.x1 - BENCH.x0, 0.12, 0.06], 'woodDark'),
  { c: [-0.8, 1.22, BENCH.z], h: 3.0, r: [0.34, 0.3], n: 6, q: rotZ(90 * DEG), color: 'bark' },
  { c: [0.71, 1.22, BENCH.z], h: 0.03, r: [0.3, 0.3], n: 6, q: rotZ(90 * DEG), color: 'woodLight' },
  { c: [SAW_X, 1.0, BENCH.z], h: 0.05, r: [0.6, 0.6], n: 12, q: rotX(90 * DEG), color: 'steel' },
  { c: [SAW_X, 1.0, BENCH.z], h: 0.12, r: [0.12, 0.12], n: 6, q: rotX(90 * DEG), color: 'iron' },
  // A drive shaft from the wheel axle, a drum on it and a belt down to the blade's hub.
  box([(WHEEL.x + SAW_X) / 2, WHEEL.y, WHEEL.z], [SAW_X - WHEEL.x, 0.1, 0.1], 'iron'),
  { c: [SAW_X, WHEEL.y, WHEEL.z], h: 0.22, r: [0.26, 0.26], n: 8, q: rotZ(90 * DEG), color: 'woodDark' },
  box([SAW_X, 1.4, BENCH.z + 0.35], [0.05, 1.0, 0.14], 'leather'),
  box([SAW_X, 1.0, BENCH.z + 0.17], [0.1, 0.1, 0.36], 'iron'),
  ...[1, -1].map(s => box([SAW_X + s * 0.3, 2.15, BENCH.z], [0.12, 0.7, 0.12], 'woodDark')),
  box([SAW_X, 2.5, BENCH.z], [0.8, 0.12, 0.12], 'woodDark'),
  // Boards cut and stacked, sawdust under the blade.
  { c: [1.3, FOOT + 0.2, 1.0], h: 0.4, r: [0.85, 0.15], n: 6, color: 'sawdust' },
  ...planks(2.15, -1.25, 1.9, 0.8, 0.8),
  // A sign over the bench: a team board with a saw.
  box([0, 2.1, -HZ + 0.25], [1.3, 0.5, 0.05], 'team'),
  { c: [0, 2.1, -HZ + 0.29], h: 0.03, r: [0.18, 0.18], n: 8, q: rotX(90 * DEG), color: 'steel' },

  // The wheel, the pond under it, the flume over it.
  ...wheel,
  box([WHEEL.x + 0.1, 0.1, WHEEL.z], [1.7, 0.2, 3.5], 'water'),
  ...[1, -1].map(s => box([WHEEL.x + 0.1, 0.12, WHEEL.z + s * 1.85], [1.9, 0.24, 0.16], 'stoneDark')),
  box([WHEEL.x, 3.42, -1.1], [0.6, 0.1, 2.6], 'wood'),
  ...[1, -1].map(s => box([WHEEL.x + s * 0.3, 3.6, -1.1], [0.07, 0.26, 2.6], 'woodDark')),
  box([WHEEL.x, 3.52, -1.1], [0.44, 0.1, 2.5], 'water'),
  box([WHEEL.x, 3.0, WHEEL.z + 0.1], [0.36, 0.9, 0.14], 'water'),
  ...[-2.2, -0.5].map(z => box([WHEEL.x, 1.7, z], [0.16, 3.4, 0.16], 'woodDark')),

  // Log pile at the +X end, an axe in a stump, a sawhorse at the front.
  ...logZ(HX + 1.15, 0.24, 0.1, 2.6, 0.24), ...logZ(HX + 1.65, 0.24, 0.1, 2.6, 0.24), ...logZ(HX + 0.65, 0.24, 0.1, 2.6, 0.24),
  ...logZ(HX + 0.9, 0.66, 0.1, 2.6, 0.24), ...logZ(HX + 1.4, 0.66, 0.1, 2.6, 0.24),
  ...logZ(HX + 1.15, 1.08, 0.1, 2.6, 0.24),
  { c: [-2.4, 0.25, HZ + 0.8], h: 0.5, r: [0.3, 0.27], n: 6, color: 'wood' },
  { c: [-2.4, 0.52, HZ + 0.8], h: 0.04, r: [0.27, 0.27], n: 6, color: 'woodLight' },
  box([-2.4, 0.85, HZ + 0.8], [0.05, 0.6, 0.05], 'woodDark', { q: rotZ(-20 * DEG), pivot: [-2.4, 0.55, HZ + 0.8] }),
  box([-2.4, 1.15, HZ + 0.8], [0.22, 0.14, 0.05], 'steel', { q: rotZ(-20 * DEG), pivot: [-2.4, 0.55, HZ + 0.8] }),
  box([-0.3, 0.7, HZ + 0.9], [1.3, 0.1, 0.12], 'woodDark'),
  ...[1, -1].flatMap(s => [1, -1].map(t => box([-0.3 + s * 0.5, 0.36, HZ + 0.9 + t * 0.1], [0.08, 0.7, 0.08], 'woodDark', { q: rotZ(s * 12 * DEG), pivot: [-0.3 + s * 0.5, 0.36, HZ + 0.9 + t * 0.1] }))),
  ...planks(-1.5, HZ + 0.3, 1.5, 0.7, 0.5),

  // Team banners on the front posts and a flag on the ridge.
  ...[HX, -HX + 0.0].map(x => box([x * 0.9, 1.7, HZ + 0.19], [0.55, 1.2, 0.04], 'team')),
  ...[HX, -HX].map(x => box([x * 0.9, 1.05, HZ + 0.19], [0.55, 0.15, 0.04], 'teamDark')),
  ...flag(2.2, RIDGE, 0, { pole: 1.5, poleColor: 'woodDark' }),
];

export default {
  name: 'sawmill', static: true, joints: [], palette: PALETTE, parts: PARTS, clips: [],
  preview: '25,90,155', previewGap: 380,
  withAt: [0.4, 3.4],
  previewZoom: 1.5,
};
