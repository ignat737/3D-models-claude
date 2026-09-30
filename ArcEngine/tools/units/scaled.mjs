// scaled.mjs — the humanoid body stretched to another size: joints, limbs and the hips track of
// the shared clips scaled by (sx, sy, sz). For units that are not a human height (goblin, troll);
// a unit still writes its own head, clothes and weapon in the final, scaled coordinates, or in
// human coordinates passed through S().
import { DEG, qmul, rotX } from '../unit-glb.mjs';
import { BODY, FIST_L, FIST_R, HAND, limbs } from './humanoid.mjs';

export function scaledBody(sx, sy, sz) {
  const at = v => [v[0] * sx, v[1] * sy, v[2] * sz];
  // Axis-aligned parts only: a rotated part would shear.
  const S = p => ({ ...p, c: at(p.c), ...(p.s ? { s: [p.s[0] * sx, p.s[1] * sy, p.s[2] * sz] } : { h: p.h * sy, r: p.r.map(r => r * sx) }) });
  return {
    BODY: BODY.map(j => ({ ...j, at: at(j.at) })),
    FIST_L: at(FIST_L),
    FIST_R: at(FIST_R),
    HAND: HAND * sy,
    S,
    limbs: c => limbs(c).map(S),
    // The shared clips move the hips in human meters: stretch that track.
    grow(pose) {
      const h = pose['hips.translation'];
      if (h) pose['hips.translation'] = [h[0], h[1] * sy, h[2] * sy];
      return pose;
    },
  };
}

// Forward stoop on top of a body pose: the torso leans (deg), the head stays level.
export function stoop(pose, deg) {
  pose['torso.rotation'] = qmul(pose['torso.rotation'] || [0, 0, 0, 1], rotX(deg * DEG));
  pose['head.rotation'] = qmul(pose['head.rotation'] || [0, 0, 0, 1], rotX(-0.8 * deg * DEG));
  return pose;
}
