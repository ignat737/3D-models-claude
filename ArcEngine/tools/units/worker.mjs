// Worker: a low-poly peasant, 1.75 m tall (1.9 with the straw hat): team-coloured tunic and
// neckerchief, leather apron, a sack on the back, a felling axe and a pickaxe (one in the fist at a
// time). Faces +Z. Clips: "idle" (axe hanging), "run" (axe over the shoulder), "chop" (looped, at a
// trunk in front) and "mine" (looped, at a rock in front).
import { rig } from '../unit-glb.mjs';
import { B, BODY, FIST_R, HAND, face, limbs } from './humanoid.mjs';
import { toolParts, workerClips } from './worker-kit.mjs';

const JOINTS = [...BODY, { name: 'axe', at: FIST_R, parent: B.foreR }, { name: 'pick', at: FIST_R, parent: B.foreR }];
const { J } = rig(JOINTS);

// "team" and "teamDark" are the faction colours: recolour those two texels for another player.
const PALETTE = [
  { name: 'skin', hex: '#d9996b' },
  { name: 'hair', hex: '#5a3d22' },
  { name: 'eye', hex: '#2b1d14' },
  { name: 'team', hex: '#2f5da8' },
  { name: 'teamDark', hex: '#22447d' },
  { name: 'linen', hex: '#d8c9a3' },
  { name: 'straw', hex: '#d9b95a' },
  { name: 'cloth', hex: '#6b5a45' },
  { name: 'leather', hex: '#6a4325' },
  { name: 'wood', hex: '#9b6b3c' },
  { name: 'iron', hex: '#5b6067' },
  { name: 'steel', hex: '#9aa3ab' },
  { name: 'blade', hex: '#d8dee3' },
];

const PARTS = [
  ...face(),
  // Hair at the back and sides, a straw hat with a team band.
  { c: [0, 1.60, -0.115], s: [0.25, 0.16, 0.03], joint: B.head, color: 'hair' },
  ...[1, -1].map(k => ({ c: [0.122 * k, 1.64, -0.02], s: [0.03, 0.10, 0.20], joint: B.head, color: 'hair' })),
  { c: [0, 1.715, 0], h: 0.025, r: [0.30, 0.28], n: 10, joint: B.head, color: 'straw' },
  { c: [0, 1.78, 0], h: 0.13, r: [0.17, 0.13], n: 8, joint: B.head, color: 'straw' },
  { c: [0, 1.738, 0], h: 0.035, r: [0.178, 0.176], n: 8, joint: B.head, color: 'team' },
  // Tunic, neckerchief, apron, belt, sack on the back.
  { c: [0, 1.20, 0], s: [0.41, 0.50, 0.23], joint: B.torso, color: 'team' },
  { c: [0, 1.47, 0], s: [0.19, 0.07, 0.19], joint: B.torso, color: 'teamDark' },
  { c: [0, 1.12, 0.122], s: [0.28, 0.36, 0.012], joint: B.torso, color: 'leather' },
  { c: [0, 0.975, 0], s: [0.43, 0.07, 0.25], joint: B.torso, color: 'leather' },
  { c: [0, 0.975, 0.128], s: [0.06, 0.05, 0.01], joint: B.torso, color: 'steel' },
  { c: [0.03, 1.16, -0.19], s: [0.28, 0.26, 0.14], joint: B.torso, color: 'linen' },
  { c: [0.03, 1.31, -0.19], s: [0.20, 0.04, 0.12], joint: B.torso, color: 'cloth' },
  { c: [0, 0.87, 0], s: [0.38, 0.14, 0.22], joint: B.hips, color: 'cloth' },
  ...limbs({ upper: 'team', fore: 'skin', fist: 'skin', thigh: 'cloth', shin: 'cloth', boot: 'leather' }),
  ...toolParts(J, FIST_R, 1, { wood: 'wood', grip: 'leather', head: 'iron', edge: 'blade', team: 'team' }),
];

const CLIPS = workerClips({ JOINTS, at: v => v, grow: p => p, HAND, k: 1 });

export default { name: 'worker', joints: JOINTS, palette: PALETTE, parts: PARTS, clips: CLIPS, worker: true, preview: 'idle@0.6,run@0.16,chop@0.5,mine@0.62' };
