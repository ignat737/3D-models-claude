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

## Unit file anatomy (`tools/units/swordsman.mjs` is the template)

- `JOINTS` — `{ name, at, parent }`, `at` is the bind position in MODEL space (meters, feet
  at y = 0). The bind pose has no rotations. Copy the 11 humanoid joints (`hips`, `torso`,
  `head`, `armL/R`, `foreL/R`, `legL/R`, `shinL/R`) and add one joint per held item at the fist
  (`[±0.27, 0.85, 0]`, parent — the forearm).
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
  whatever the arm does (shield facing forward, banner upright).

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

## Checklist

1. New unit: copy `tools/units/swordsman.mjs`, add it to `UNITS` in `tools/make-units.mjs`
   and a row in `3D-models/README.md`.
2. `node tools/make-units.mjs <unit>` — read the triangle count it prints.
3. `node tools/check.mjs` passes (file = generator, one primitive, seamless loops, death on the ground).
4. `node tools/unit-preview.mjs <unit>`, `--squad`, and `--pose=` for every clip you touched —
   LOOK at the PNGs (open the image), lint must be clean. The default outputs in
   `3D-models/previews/` are the pictures users see: regenerate them after a visual change.
