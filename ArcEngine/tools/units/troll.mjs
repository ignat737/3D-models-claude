// Troll: a low-poly giant 2.5 m tall (the horn tips), broad and hunched: grey-green skin, a
// paunch, tusks, small horns, team shoulder pads, sash and loincloth, and a huge studded club in
// the right fist. Own body: the humanoid joints scaled (1.6 wide, 1.43 tall, 1.5 deep). Faces +Z.
// Clips: "idle" (the club head on the ground), "run" (club carried forward), "attack" (looped:
// raise the club over the head, smash it down with a lunge) and "death" (once, stays down).
import { DEG, add, loopClip, onceClip, qmul, qrot, rig, rotX, rotY, rotZ, tween } from '../unit-glb.mjs';
import { B, SIDES, armAngles, deathBody, idleBody, runBody } from './humanoid.mjs';
import { scaledBody, stoop } from './scaled.mjs';

const { BODY, FIST_R, HAND, S, limbs, grow } = scaledBody(1.6, 1.43, 1.5);
const TIP = 1.28;     // fist -> end of the club head along the club
const SINK = 0.02;    // the head rests this deep: the ground under it may slope away
const HIPS = 0.90 * 1.43;
const JOINTS = [...BODY, { name: 'club', at: FIST_R, parent: B.foreR }];
const { J, worldOf, aimJoint, reach } = rig(JOINTS);

// "team" and "teamDark" are the faction colours: recolour those two texels for another player.
const PALETTE = [
  { name: 'skin', hex: '#7b8a6a' },
  { name: 'skinDark', hex: '#5c6a51' },
  { name: 'belly', hex: '#9aa88a' },
  { name: 'eye', hex: '#f0b030' },
  { name: 'tusk', hex: '#ece3c8' },
  { name: 'team', hex: '#2f5da8' },
  { name: 'teamDark', hex: '#22447d' },
  { name: 'hair', hex: '#2b2a25' },
  { name: 'iron', hex: '#5b6067' },
  { name: 'leather', hex: '#5a3a22' },
  { name: 'cloth', hex: '#4a3b2f' },
  { name: 'wood', hex: '#7b5530' },
  { name: 'woodDark', hex: '#5c3f22' },
];

const clubAt = (y, x = 0, z = 0) => add(FIST_R, [x, y, z]);

const PARTS = [
  // Head: a small skull on a thick neck pushed forward, a heavy brow, yellow eyes, a flat nose,
  // a jutting jaw with two upturned tusks, small ears and two short horns.
  { c: [0, 2.29, 0.04], s: [0.34, 0.26, 0.34], joint: B.head, color: 'skin' },
  { c: [0, 2.36, 0.19], s: [0.36, 0.06, 0.08], joint: B.head, color: 'skinDark' },
  ...SIDES.flatMap(k => [
    { c: [0.08 * k, 2.32, 0.217], s: [0.05, 0.04, 0.014], joint: B.head, color: 'eye' },
    { c: [0.10 * k, 2.27, 0.225], s: [0.04, 0.11, 0.04], joint: B.head, color: 'tusk' },
    { c: [0.205 * k, 2.29, 0.0], s: [0.06, 0.10, 0.07], joint: B.head, color: 'skin' },
    { c: [0.12 * k, 2.46, 0.0], h: 0.08, r: [0.05, 0.008], n: 5, q: rotZ(-20 * k * DEG), pivot: [0.12 * k, 2.42, 0.0], joint: B.head, color: 'tusk' },
  ]),
  { c: [0, 2.27, 0.25], s: [0.10, 0.08, 0.06], joint: B.head, color: 'skinDark' },
  { c: [0, 2.20, 0.13], s: [0.30, 0.12, 0.22], joint: B.head, color: 'skinDark' },
  // Torso: a barrel chest, a paunch, a hump on the back, a team sash across (front and back),
  // belt with a bone buckle, a hide loincloth on the hips.
  S({ c: [0, 1.20, 0], s: [0.40, 0.50, 0.22], joint: B.torso, color: 'skin' }),
  { c: [0, 1.47, 0.20], s: [0.56, 0.34, 0.14], joint: B.torso, color: 'belly' },
  { c: [0, 2.03, -0.21], s: [0.50, 0.30, 0.16], joint: B.torso, color: 'skin' },
  { c: [0, 1.80, 0.178], s: [0.13, 0.86, 0.014], q: rotZ(32 * DEG), joint: B.torso, color: 'team' },
  { c: [0, 1.80, -0.178], s: [0.13, 0.86, 0.014], q: rotZ(-32 * DEG), joint: B.torso, color: 'team' },
  S({ c: [0, 0.975, 0], s: [0.43, 0.07, 0.25], joint: B.torso, color: 'leather' }),
  S({ c: [0, 0.975, 0.128], s: [0.07, 0.05, 0.01], joint: B.torso, color: 'tusk' }),
  S({ c: [0, 0.87, 0], s: [0.38, 0.14, 0.22], joint: B.hips, color: 'cloth' }),
  ...limbs({ pauldron: 'teamDark', upper: 'skin', fore: 'skin', fist: 'skinDark', thigh: 'cloth', flap: 'team', shin: 'skin', boot: 'skinDark' }),
  // Club, bind pose upright through the right fist: butt cap, handle, leather grip, team band,
  // a thick head in two frustums with an iron ring and iron spikes, a rounded cap.
  { c: clubAt(-0.27), h: 0.05, r: [0.075, 0.075], n: 6, joint: J.club, color: 'leather' },
  { c: clubAt(0.125), h: 0.75, r: [0.055, 0.062], n: 6, joint: J.club, color: 'wood' },
  { c: clubAt(0), h: 0.20, r: [0.072, 0.072], n: 6, joint: J.club, color: 'leather' },
  { c: clubAt(0.42), h: 0.06, r: [0.075, 0.075], n: 6, joint: J.club, color: 'team' },
  { c: clubAt(0.72), h: 0.44, r: [0.10, 0.22], n: 8, joint: J.club, color: 'woodDark' },
  { c: clubAt(1.07), h: 0.26, r: [0.22, 0.17], n: 8, joint: J.club, color: 'woodDark' },
  { c: clubAt(0.94), h: 0.05, r: [0.235, 0.235], n: 8, joint: J.club, color: 'iron' },
  { c: clubAt(1.24), h: 0.08, r: [0.17, 0.09], n: 8, joint: J.club, color: 'wood' },
  ...[[0.26, 0, 90], [-0.26, 0, -90]].map(([x, z, a]) => ({ c: clubAt(1.02, x, z), h: 0.13, r: [0.045, 0.006], n: 4, q: rotZ(-a * DEG), joint: J.club, color: 'iron' })),
  { c: clubAt(1.02, 0, 0.26), h: 0.13, r: [0.045, 0.006], n: 4, q: rotX(90 * DEG), joint: J.club, color: 'iron' },
  { c: clubAt(1.02, 0, -0.26), h: 0.13, r: [0.045, 0.006], n: 4, q: rotX(-90 * DEG), joint: J.club, color: 'iron' },
];

// The club head down: the club at the world rotation aim, slid so its end touches the ground.
function restHead(pose, aim) {
  const fist = worldOf(pose, J.club).p, up = qrot(aim, [0, 1, 0]);
  return aimJoint(pose, 'club', aim, (-SINK - fist[1]) / up[1] - TIP);
}

const GUARD = { u: 0, hx: -0.52, hy: 1.50, hz: 0.30, pitch: 40, ty: -10, lean: 8, step: 0, hips: HIPS, lx: -20, flx: -35, lz: 12 };
const SMASH = [
  GUARD,
  { u: 0.30, hx: -0.46, hy: 2.15, hz: -0.12, pitch: -45, ty: -28, lean: -8, step: 0.2, hips: HIPS, lx: -50, flx: -20, lz: 35 },
  { u: 0.50, hx: -0.50, hy: 1.20, hz: 0.66, pitch: 150, ty: -6, lean: 38, step: 1, hips: HIPS - 0.12, lx: -10, flx: -30, lz: 25 },
  { u: 0.66, hx: -0.50, hy: 1.16, hz: 0.68, pitch: 155, ty: -6, lean: 40, step: 1, hips: HIPS - 0.13, lx: -10, flx: -30, lz: 25 },
  { u: 0.85, hx: -0.52, hy: 1.40, hz: 0.40, pitch: 90, ty: -10, lean: 18, step: 0.3, hips: HIPS - 0.03, lx: -18, flx: -34, lz: 15 },
  { ...GUARD, u: 1 },
];

const CLIPS = [
  // At ease: a slow heavy breath, the club head resting on the ground at the right side.
  loopClip('idle', 3.0, 12, (t) => {
    const pose = stoop(armAngles({ lz: 10, lx: -8 - 2 * Math.sin(t), flx: -20, rz: -6, rx: -4, frx: -6 }, grow(idleBody(t))), 10 + 2 * Math.sin(t));
    return restHead(pose, qmul(rotZ(2 * DEG), rotX(172 * DEG)));
  }),
  // Run: a heavy stomp, the club carried forward and up at the right side, the left arm pumping.
  loopClip('run', 0.8, 16, (t) => {
    const pose = stoop(armAngles({ lz: 14, lx: 32 * Math.sin(t), flx: -55, rz: 0, rx: 0, frx: 0 }, grow(runBody(t))), 10);
    reach(pose, 'armR', 'foreR', [-0.52, 1.42 + 0.05 * Math.abs(Math.sin(t)), 0.40], [-1, -0.6, -0.4], HAND);
    return aimJoint(pose, 'club', qmul(rotY(10 * DEG), rotX((38 + 4 * Math.sin(2 * t)) * DEG)), 0);
  }),
  // Attack: guard -> the club over the head behind the shoulder -> a smash down in front with a
  // lunge -> hold -> back to guard.
  loopClip('attack', 1.4, 24, (t) => {
    const p = tween(t / (2 * Math.PI), SMASH);
    const pose = armAngles({ lz: p.lz, lx: p.lx, flx: p.flx, rz: 0, rx: 0, frx: 0 }, {
      'hips.translation': [0, p.hips, 0],
      'torso.rotation': qmul(rotY(p.ty * DEG), rotX(p.lean * DEG)),
      'head.rotation': qmul(rotY(-0.9 * p.ty * DEG), rotX(-0.8 * p.lean * DEG)),
      'legL.rotation': qmul(rotZ(5 * DEG), rotX(-24 * DEG * p.step)),
      'legR.rotation': qmul(rotZ(-5 * DEG), rotX(14 * DEG * p.step)),
      'shinL.rotation': rotX(20 * DEG * p.step),
      'shinR.rotation': rotX(8 * DEG * p.step),
    });
    reach(pose, 'armR', 'foreR', [p.hx, p.hy, p.hz], [-1, -0.5, -0.3], HAND);
    return aimJoint(pose, 'club', qmul(rotY(8 * DEG), rotX(p.pitch * DEG)), 0);
  }),
  // Death: the knees buckle, he falls on his back, the club lies along the body rolled onto its
  // side, the head a few degrees up: flat along the model it sinks into any rise of the ground.
  onceClip('death', 1.6, 16, (u) => {
    const { b, fall, pose: body } = deathBody(u);
    const pose = armAngles({ lz: 8 + 45 * fall, lx: -8, flx: -20 + 10 * fall, rz: -8 - 50 * fall, rx: -40 + 30 * b, frx: -50 + 30 * fall }, grow(body));
    return aimJoint(pose, 'club', qmul(worldOf(pose, J.hips).q, qmul(rotX((-4 + 12 * fall) * DEG), rotY(90 * DEG * fall))), 0);
  }),
];

export default { name: 'troll', joints: JOINTS, palette: PALETTE, parts: PARTS, clips: CLIPS, preview: 'idle@0.6,attack@0.55' };
