// spruce.mjs — a spruce: a short trunk with a root flare, six stacked ten-sided cones (wide skirts
// that shrink towards the top, every tier turned against the one below) and a sharp leader, on a
// patch of needle litter. Static: one mesh, one palette material, no skeleton, no clips; written to
// 3D-models/3D-models-plants/ (folder). Model space: meters, feet at y = 0, the tree is 7.7 m tall
// with a crown 4.4 m across and is round about Y (the heading does not matter).
import { DEG, rotY } from '../unit-glb.mjs';

const PALETTE = [
  { name: 'bark', hex: '#5a3f27' },
  { name: 'barkDark', hex: '#432e1c' },
  { name: 'needles', hex: '#2f6b3a' },
  { name: 'needlesDark', hex: '#21502d' },
  { name: 'needlesLight', hex: '#3f8548' },
  { name: 'litter', hex: '#4b3b26' },
];

const SIDES = 10;
// Tiers bottom to top: [base y, height, base radius]. A tier's base sticks out of the cone below.
const TIERS = [[1.0, 2.2, 2.2], [2.0, 2.1, 1.95], [3.0, 2.0, 1.7], [4.0, 1.9, 1.45], [5.0, 1.8, 1.2], [6.0, 1.7, 0.9]];
const TIER_COLORS = ['needlesDark', 'needles', 'needlesDark', 'needles', 'needlesLight', 'needlesLight'];

const tiers = TIERS.map(([y, h, r], i) => ({
  c: [0, y + h / 2, 0], h, r: [r, i === TIERS.length - 1 ? 0.03 : r * 0.35], n: SIDES,
  color: TIER_COLORS[i], q: rotY(i * 18 * DEG),
}));

const PARTS = [
  { c: [0, 0.03, 0], h: 0.06, r: [1.15, 1.1], n: 8, color: 'litter' },
  { c: [0, 0.15, 0], h: 0.3, r: [0.55, 0.34], n: 6, color: 'barkDark' },
  { c: [0, 0.9, 0], h: 1.2, r: [0.34, 0.2], n: 6, color: 'bark' },
  ...tiers,
];

export default {
  name: 'spruce', folder: '3D-models-plants', static: true, joints: [], palette: PALETTE, parts: PARTS, clips: [],
  preview: '0,45,90', previewGap: 150, previewZoom: 1.6, withAt: [3.2, 0],
};
