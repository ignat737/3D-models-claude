// Orc worker: the orc's brawn at work, 1.95 m tall: green skin, tusks, a team headband and topknot,
// a bare chest with a team sash, a loincloth, heavy tools (the axe and the pick are 1.15 times
// the human's). The skeleton is the humanoid one stretched 1.3 x 1.15 x 1.25, the clips are the
// human worker's. Faces +Z. Clips: "idle", "run", "chop", "mine".
import { rig } from '../unit-glb.mjs';
import { B } from './humanoid.mjs';
import { scaledBody } from './scaled.mjs';
import { toolParts, workerClips } from './worker-kit.mjs';

const SX = 1.3, SY = 1.15, SZ = 1.25;
const { BODY, FIST_R, HAND, S, limbs, grow } = scaledBody(SX, SY, SZ);
const JOINTS = [...BODY, { name: 'axe', at: FIST_R, parent: B.foreR }, { name: 'pick', at: FIST_R, parent: B.foreR }];
const { J } = rig(JOINTS);

// "team" and "teamDark" are the faction colours: recolour those two texels for another player.
const PALETTE = [
  { name: 'skin', hex: '#6f9a45' },
  { name: 'skinDark', hex: '#557a33' },
  { name: 'eye', hex: '#f2c230' },
  { name: 'tusk', hex: '#ece3c8' },
  { name: 'team', hex: '#2f5da8' },
  { name: 'teamDark', hex: '#22447d' },
  { name: 'hair', hex: '#1f1a17' },
  { name: 'iron', hex: '#5b6067' },
  { name: 'steel', hex: '#9aa3ab' },
  { name: 'blade', hex: '#d8dee3' },
  { name: 'leather', hex: '#5a3a22' },
  { name: 'cloth', hex: '#4a3b2f' },
  { name: 'wood', hex: '#8a5d33' },
];

const PARTS = [
  // Head: heavy brow, yellow eyes, flat nose, a jutting jaw with two tusks, ears, headband, topknot.
  { c: [0, 1.81, 0.04], s: [0.30, 0.27, 0.29], joint: B.head, color: 'skin' },
  { c: [0, 1.875, 0.19], s: [0.31, 0.055, 0.06], joint: B.head, color: 'skinDark' },
  ...[1, -1].map(k => ({ c: [0.07 * k, 1.835, 0.192], s: [0.05, 0.03, 0.012], joint: B.head, color: 'eye' })),
  { c: [0, 1.785, 0.21], s: [0.08, 0.06, 0.05], joint: B.head, color: 'skinDark' },
  { c: [0, 1.715, 0.15], s: [0.28, 0.11, 0.17], joint: B.head, color: 'skin' },
  ...[1, -1].map(k => ({ c: [0.095 * k, 1.80, 0.225], s: [0.035, 0.09, 0.035], joint: B.head, color: 'tusk' })),
  ...[1, -1].flatMap(k => [
    { c: [0.185 * k, 1.84, -0.02], s: [0.07, 0.10, 0.06], joint: B.head, color: 'skin' },
    { c: [0.225 * k, 1.925, -0.02], s: [0.05, 0.07, 0.04], joint: B.head, color: 'skin' },
  ]),
  { c: [0, 1.925, 0.02], s: [0.32, 0.06, 0.31], joint: B.head, color: 'team' },
  { c: [0, 1.99, -0.03], s: [0.09, 0.09, 0.09], joint: B.head, color: 'hair' },
  // Torso: bare chest and belly, a team sash across it (front and back), belt with a bone buckle.
  { c: [0, 1.46, 0], s: [0.56, 0.40, 0.30], joint: B.torso, color: 'skin' },
  { c: [0, 1.19, 0], s: [0.44, 0.14, 0.27], joint: B.torso, color: 'skin' },
  { c: [0, 1.42, 0.156], s: [0.10, 0.62, 0.012], q: [0, 0, 0.3007, 0.9537], joint: B.torso, color: 'team' },
  { c: [0, 1.42, -0.156], s: [0.10, 0.62, 0.012], q: [0, 0, -0.3007, 0.9537], joint: B.torso, color: 'team' },
  { c: [0, 1.08, 0], s: [0.47, 0.08, 0.29], joint: B.torso, color: 'leather' },
  { c: [0, 1.08, 0.148], s: [0.09, 0.06, 0.012], joint: B.torso, color: 'tusk' },
  { c: [0, 0.97, 0], s: [0.44, 0.16, 0.26], joint: B.hips, color: 'cloth' },
  ...limbs({ upper: 'skin', fore: 'skin', fist: 'skin', thigh: 'cloth', flap: 'team', shin: 'skin', boot: 'leather' }),
  ...toolParts(J, FIST_R, 1.15, { wood: 'wood', grip: 'leather', head: 'iron', edge: 'steel', team: 'team' }),
];

const CLIPS = workerClips({ JOINTS, at: v => [v[0] * SX, v[1] * SY, v[2] * SZ], grow, HAND, k: 1.15 });

export default { name: 'orc-worker', joints: JOINTS, palette: PALETTE, parts: PARTS, clips: CLIPS, worker: true, preview: 'idle@0.6,run@0.16,chop@0.5,mine@0.62' };
