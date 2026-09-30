---
name: units
description: Low-poly unit models for a strategy game (Diplomacy is Not an Option style) in 3D-models/ — the generator tools/make-units.mjs, the shared GLB builder tools/unit-glb.mjs, unit descriptions tools/units/<unit>.mjs (joints, parts, palette, clips idle/run/attack/death), team colours, rotation signs, the triangle budget, previews. Read before creating a new unit, changing a unit's look, weapon, colours or animation, and before touching unit-glb.mjs.
---

# Unit models: 3D-models/*.glb

```
node tools/make-units.mjs                      # regenerate every unit
node tools/make-units.mjs swordsman            # one unit
node tools/make-units.mjs --check              # exit 1 if a file differs from its generator
node tools/unit-preview.mjs swordsman          # 3D-models/previews/swordsman.png (skill headless)
node tools/unit-preview.mjs swordsman --squad  # 30 units from the RTS camera
node tools/unit-preview.mjs swordsman --near   # close-up: faces, buckles, weapon grip
node tools/unit-preview.mjs swordsman --pose=run@0.16,attack@0.36,death@1.3 --out=x.png
node tools/unit-preview.mjs archer --heading=90 --pose=attack@1.0   # from the unit's left side
```

A unit is CODE, never a hand-edited file: `tools/units/<unit>.mjs` describes it,
`tools/unit-glb.mjs` turns it into a skinned GLB, `tests/units.test.mjs` fails when the file on
disk differs from the generator. Every model is ONE mesh with ONE material: colours are texels
of a tiny palette texture (4x4 up to 16 colours, NEAREST, no mipmaps) and every vertex of a
part samples the centre of its texel. One draw call per unit, whatever the number of colours.

## Style (the reference is Diplomacy is Not an Option)

- Read from far away: the player sees units at `scaling 0.25` from an RTS camera. Chunky
  proportions, a big helmet or hat, the weapon slightly oversized, large team-coloured areas
  (tabard, pauldrons, shield face). Small details are for the `--near` shot only.
- Silhouette per class: sword + round shield, bow + quiver, long spear, two-handed axe, a
  mounted unit. Two units must not be told apart by colour alone.
- Faction colour lives in two palette entries, `team` and `teamDark`. Every unit has both,
  used on the same kinds of surfaces, so a recolour is two texels.

## Budget

| Thing | Limit | Why |
|---|---|---|
| Triangles | <= 1000 (test) | hundreds on screen; the swordsman is 756 |
| Box | 12 triangles | the cheapest part — prefer boxes |
| Frustum of n sides | 4n triangles | helmet 8, shield 10, grip 6, blade 4 (with `sq`) |
| Joints | <= 255 (`JOINTS_0` is UBYTE) | humanoid: 11 + one per held item |
| Vertices | <= 65535 (16-bit indices) | never close for a unit |

Every part is outlined by the toon ink: ten tiny boxes read as noise, one bigger box reads as
a shape. Merge details before adding triangles.

## Unit file anatomy

Templates: `swordsman.mjs` (arms by angles, items by `aimJoint`), `orc.mjs` (an own taller skeleton 1.15x, `grow()` scales the shared clips' hips track, a two-handed axe, attack poses found by a search), `spearman.mjs` (arms by IK,
a two-handed weapon), `archer.mjs` (IK, a stretching string, an item shown and hidden by scale).
`tools/units/humanoid.mjs` is the shared body: `BODY` (11 joints), `B` (their indices),
`face()`, `limbs({ pauldron, upper, fore, fist, thigh, flap, shin, boot })` (a piece without a
colour is left out), `armAngles`, `idleBody(t)`, `runBody(t)`, `deathBody(u)`, `FIST_L/R`, `HAND`.

- `JOINTS` — `[...BODY, items]`; `{ name, at, parent }`, `at` is the bind position in MODEL space
  (meters, feet at y = 0). The bind pose has no rotations. One joint per held item at the fist
  (`FIST_L` / `FIST_R`, parent — the forearm).
- `PALETTE` — `{ name, hex }` (sRGB). Order is texel order; appending keeps other texels.
- `PARTS` — rigid on one joint. Box `{ c, s }`; frustum about the vertical axis
  `{ c, h, r: [bottom, top], n, sq }` (`sq` squashes Z: a flat blade); optional `q` + `pivot`
  rotate the whole part. Items are built along +Y from the fist and turned with
  `rotX(90°)` to point forward; a roll about the item's own axis goes FIRST:
  `qmul(rotX(90°), rotY(roll))` (the sword's edge orientation).
- `CLIPS` — `loopClip(name, seconds, frames, t => pose)` with `t` in [0, 2π) (the last key
  repeats the first — no seam), `onceClip(name, seconds, frames, u => pose)` with `u` in [0, 1],
  `tween(u, stops)` for key poses (attacks). A pose is `{ 'joint.rotation': quat,
  'hips.translation': [x, y, z] }`; every frame must set the same tracks (the builder throws).
- `aimJoint(pose, 'shield', worldQuat)` — an item that keeps its own world orientation
  whatever the arm does (shield facing forward, banner upright); a 4th argument slides the item
  along its +Y through the fist (a spear planted on the ground: `spearman.mjs` `plant`).
- `reach(pose, 'armR', 'foreR', target, pole, HAND)` — two-bone IK: the fist goes to a
  model-space point, the elbow bends towards `pole`. Set the body tracks first (the shoulder
  moves with the torso). A two-handed weapon: right fist by IK, weapon by `aimJoint`, left fist
  by IK to a point along the weapon. Targets out of reach go to `IK_MISSES`: `make-units`
  prints them and a test fails — a hand floating next to its shaft.
- `pointJoint(pose, name, worldDir)`, `placeJoint(pose, name, worldPoint)` — aim a limb, move a
  joint (its translation track: the bow's `nock` follows the drawing fist).
- Span part `{ span: [a, b], joints: [ja, jb], w }` — a bar whose ends are skinned to two
  joints: it stretches (the bow string: tip on `bow`, middle on `nock`).
- `'arrow.scale': [s, s, s]` hides and shows an item. Never 0: a zero-scaled skinned normal
  normalizes to NaN and the HDR pipeline spreads it over the whole frame; 0.02 inside a fist is
  invisible.
- A track only some clips have (the `nock` translation) is fine: `Clips3D` fades the old clip
  to weight 0 and the bone returns to bind. Inside ONE clip every frame sets the same tracks.
- `preview: 'idle@0.6,attack@1.0'` in the export — the default poses of `unit-preview.mjs`:
  pick the moment that shows the unit best (the full draw, the thrust).

## Axes and signs (the model faces +Z, +X is the unit's LEFT)

| Rotation | Effect |
|---|---|
| `rotX(-a)` on a hanging limb | swings it FORWARD |
| `rotX(+a)` on the torso or head | leans it forward / looks down |
| `rotZ(+a)` on a left limb, `rotZ(-a)` on a right one | moves it outward |
| `rotY(+a)` | turns toward the unit's left (counter-clockwise from above) |
| `rotX(-86°)` on `hips` + lowering `hips.translation` | falls on the back |

In ArcEngine `Gltf3D.build` turns the file by 90°: the unit's nose is +X of the root, like
FBX models; `root.rotation.y` is the heading.

## Clips every unit has

| Clip | Loop | Typical | Notes |
|---|---|---|---|
| `idle` | yes | 2.4 s, 12 frames | small breathing + a look around |
| `run` | yes | 0.64 s, 16 frames | legs +-42°, shins bend after the swing, hips bounce |
| `attack` | yes | 0.9 s, 18 frames | guard -> wind-up -> strike with a step -> guard; melee loops it |
| `death` | no | 1.3 s, 13 frames | ends lying: hips y < 0.25 (test); play with `{ loop: false }` |

A ranged unit keeps the names (`attack` = draw and release) so game code stays the same.

## Pitfalls met so far

- A shield strapped to the forearm is pierced by the fist when the arm is raised: hold it by a
  centre grip, disc just in front of the fist, the boss covering the hand.
- Coplanar faces z-fight: a decal (cross, stripe) sits >= 0.006 m above its surface.
- A helmet octagon must cover the head box corners: its radius >= half the box diagonal.
- A tabard skirt as one box is cut by running legs: split it into flaps on the thighs.
- A textured GLB that renders too dark means sRGB buffers: `Gltf3D.load` passes
  `useSRGBBuffers: false`, keep it (skill `world3d`).
- `tween` smoothsteps between stops: a strike needs its stops close together (0.4 -> 0.58),
  or it looks like a slow push.
- Check reach before posing: an arm reaches `0.55` m from the shoulder. Nocking an arrow with
  the bow already at full arm's length put the string 7 cm out of reach — bring the bow close,
  then extend while drawing.
- An item lying on the ground after death: exactly flat in model space it sinks into any rise
  of the terrain (a 2.6 m spear always does) — tilt it a few degrees up.
- A front view hides depth: check draws, thrusts and swings with `--heading=90`.
- A two-handed weapon held "in front of the belly" goes through the chest: the rear fist must be
  OUTSIDE the torso box (|x| >= 0.205 + shaft radius), the torso turned toward the weapon side so
  the other hand still reaches the shaft. Pictures miss a 5 cm overlap — measure it: sample the
  shaft axis against the body boxes in every frame (`tests/units.test.mjs`, spearman and orc tests).

## Checklist

1. New unit: copy the closest template, add it to `UNITS` in `tools/make-units.mjs`, a row in
   the tables of `3D-models/README.md` and its preview images there.
2. `node tools/make-units.mjs <unit>` — read the triangle count it prints.
3. `node tools/check.mjs` passes (file = generator, one primitive, seamless loops, death on the
   ground, no IK misses). After touching `humanoid.mjs` or `unit-glb.mjs`, unchanged units must
   stay byte-identical: `node tools/make-units.mjs --check` before regenerating.
4. `node tools/unit-preview.mjs <unit>`, `--squad`, `--heading=90`, and `--pose=` for every clip
   you touched — LOOK at the PNGs (open the image), lint must be clean. The default outputs in
   `3D-models/previews/` are the pictures users see: regenerate them after a visual change.
