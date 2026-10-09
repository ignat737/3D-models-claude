---
name: units
description: Low-poly unit models for a strategy game (Diplomacy is Not an Option style) in 3D-models/3D-models-units/ — the generator tools/make-units.mjs, the shared GLB builder tools/unit-glb.mjs, unit descriptions tools/units/<unit>.mjs (joints, parts, palette, clips idle/run/attack/death), the horse and the swordsman's ride clips (a mount with a saddle joint), team colours, rotation signs, the triangle budget, previews. Read before creating a new unit, changing a unit's look, weapon, colours or animation, and before touching unit-glb.mjs.
---

# Unit models: 3D-models/3D-models-units/*.glb

```
node tools/make-units.mjs                      # regenerate every unit
node tools/make-units.mjs swordsman            # one unit
node tools/make-units.mjs --check              # exit 1 if a file differs from its generator
node tools/unit-preview.mjs swordsman          # 3D-models/3D-models-units/previews/swordsman.png (skill headless)
node tools/unit-preview.mjs swordsman --squad  # 30 units from the RTS camera
node tools/unit-preview.mjs swordsman --near   # close-up: faces, buckles, weapon grip
node tools/unit-preview.mjs swordsman --pose=run@0.16,attack@0.36,death@1.3 --out=x.png
node tools/unit-preview.mjs archer --heading=90 --pose=attack@1.0   # from the unit's left side
node tools/unit-preview.mjs horse --rider=swordsman            # a mount with a rider (also --squad)
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
| Triangles | <= 1000 (test); `maxTriangles` in the export raises it for a combined unit (mounted swordsman: 1400 for 1312) | hundreds on screen; the swordsman is 756 |
| Box | 12 triangles | the cheapest part — prefer boxes |
| Frustum of n sides | 4n triangles | helmet 8, shield 10, grip 6, blade 4 (with `sq`) |
| Joints | <= 255 (`JOINTS_0` is UBYTE) | humanoid: 11 + one per held item |
| Vertices | <= 65535 (16-bit indices) | never close for a unit |

Every part is outlined by the toon ink: ten tiny boxes read as noise, one bigger box reads as
a shape. Merge details before adding triangles.

## Unit file anatomy

Templates: `swordsman.mjs` (arms by angles, items by `aimJoint`), `orc.mjs` (an own taller skeleton 1.15x, `grow()` scales the shared clips' hips track, a two-handed axe, attack poses found by a search), `scaled.mjs` (`scaledBody(sx, sy, sz)`: the humanoid joints, limbs and `grow()` at another size — `goblin.mjs` 0.88x with a javelin that is thrown and hidden by scale, `troll.mjs` 1.43x with a club planted head-down in idle and held in both hands in run and attack: the left fist goes to the butt side of the handle, the near end of a downward smash), `spearman.mjs` (arms by IK,
a two-handed weapon), `archer.mjs` (IK, a stretching string, an item shown and hidden by scale), `goblin-wolf-rider.mjs` (the wolf and the goblin in one file, like `mounted-swordsman.mjs` but the rider has no clips of his own, he acts on top of the wolf's: a `ride()` pose (seated, IK on `rider_` joints hung on the wolf's `body`) per key, driven by key-pose tables (`JAB`, `THROW`); `throw`/`runThrow` exist only in the combined file, built from `wolf.mjs` exports `idle`/`run` with the javelin hidden by scale like `goblin.mjs`; a death clip that throws him off in the body's frame; the palette is cut to 16 by aliasing near colours), `worker.mjs` / `orc-worker.mjs` (workers: clips `idle`, `run`, `chop`, `mine` and no `attack`/`death` — `worker: true` in the export tells the tests; both share `worker-kit.mjs`: `toolParts()` builds the axe and the pickaxe on two joints in the right fist, the unused one hidden by scale in EVERY clip, `workerClips()` poses both hands by IK, the left fist goes to the grip point nearest to the left shoulder, `ground()` lowers the hips until the lower heel touches the ground; the orc is `scaledBody(1.3, 1.15, 1.25)` with the same clips), `wolf.mjs` (an animal, no hands: an own skeleton with a `jaw` joint, the horse's leg swing, `grounded()`/`extentY()` kept local; a pounce with `dy`/`dz` lifting the body off the ground).
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

## Mounts and riders (horse.mjs)

`horse.mjs` is a mount, not an infantry unit: an own skeleton (`body`, `neck`, `head`, `tail`,
four legs of two joints, `saddle`) and its own clips `idle`, `run`, `attack` (in place: a rear and
a stamp), `runAttack` (two gallop strides) and `death` (kneels, rolls onto its right side).
The rider is a second model: `Model3D.mount(rider, horse, 'saddle')` parents its root to the
`saddle` node (the joint node lives inside the mount's meters-to-px node, `Gltf3D.mount` undoes
that), so the rider follows the horse's bounce, pitch and roll. The swordsman has a paired clip for
EVERY horse clip, the same length and key count (test): `ride`, `rideRun`, `rideAttack`,
`rideRunAttack`, `rideDeath`. A game plays the pair together (`unit-preview.mjs` maps
`attack` -> `rideAttack` by name).

- Seat: hips at `SEAT` above the root, thighs by `pointJoint` forward and out, boots about 0.43 m
  aside / 1.09 m up in the horse's frame — the horse's stirrups sit exactly there. Change one
  side, change the other (the test keeps the knees outside the flanks).
- The sword cut is checked against the horse's boxes every frame (`tests/units.test.mjs`): the
  rider's sword axis sampled against the neck, head, body and saddle under the PAIRED horse
  clip. Change a horse clip -> the rider's cut may now go through its neck.
- `horse.mjs` exports `saddleFrame(pose)`, `deathPose(u)` and `extentY(pose)` (lowest and highest
  point of any part). `grounded(pose)` sets the body height so the hooves touch the ground in
  `attack` and `death` (a rearing horse or a rolled one needs no hand-tuned height); the test
  checks the hooves stay on the ground in `idle`/`attack` and the dead horse lies on it.
- `rideDeath` is written in the saddle's frame, which ROLLS with the horse: the clip defines the
  rider's path in the world (sits until u = 0.3, flies off over the back, lands at `LAND` on
  his back beside the horse) and converts it into the saddle frame every frame with
  `horseDeath(u)` and `saddleFrame`. A new horse death needs only the new `deathPose`.
- `mounted-swordsman.mjs` is the horse and the rider in ONE file: joints = horse + rider's (names
  prefixed `rider_`, the rider's root hangs on `saddle`, his joints and parts move by the saddle's
  bind position), palette merged by hex (the horse's `eye` texel becomes the mane's to stay at 16
  colours), each horse clip merged with its paired `ride*` clip (tracks of both, the horse's name).
  It draws nothing itself: change a horse or swordsman clip, `node tools/make-units.mjs` rebuilds
  all three files. A pair that differs in length makes the builder throw.
- A mount with another rider needs its own seated clips. `previewGap` in the unit export is the
  spacing of the preview poses and squad (default 28, the horse 62), `--gap=` overrides it
  (a fallen horse is wider); `riderPreview` — the default poses of `--rider=`.

## Buildings: 3D-models/3D-models-buildings/*.glb

Static buildings use the same builder and the same style (one mesh, one palette material,
`team`/`teamDark` texels on the door, shutters and pennant), but have no skeleton and no clips.

```
node tools/make-buildings.mjs [name] [--check]   # regenerate / verify 3D-models/3D-models-buildings/
node tools/unit-preview.mjs peasant-house        # three views (--pose lists headings in degrees, 0 = the front)
node tools/unit-preview.mjs peasant-house --squad    # a hamlet of 6 from the RTS camera
node tools/unit-preview.mjs peasant-house --near --pose=20
node tools/unit-preview.mjs peasant-house --with=spearman --pose=20   # a unit beside the building, for scale
```

- A building is `tools/buildings/<name>.mjs`: `{ name, static: true, joints: [], palette, parts, clips: [], preview: '25,90,155', previewGap, previewZoom, withAt: [x, z] }`; `withAt` is where `--with=<unit>` stands (building frame, meters).
  Parts have no `joint`; `buildGlb` writes plain POSITION/NORMAL/TEXCOORD_0, no skin, no animations.
  A new building is a file there plus a line in `BUILDINGS` of `tools/make-buildings.mjs`; `tests/buildings.test.mjs` covers it.
  Walls and fences (`tools/defense/*.mjs`: `palisade-segment`, 10 m along X, chains end to end; `palisade-tower`, 3 x 3 m centred on the wall line, an archers' deck at 3.6 m, any segment butts against any of its faces; `palisade-gate` and `palisade-gate-open`, a 10 m section that replaces a segment, one description `palisade-gate.mjs` for both: leaves closed / swung inward) are the same kind of model with `folder: '3D-models-defense'` and go to `3D-models/3D-models-defense/`. Stone twins `stone-wall-segment`, `stone-tower` (4.2 m, platform at 8.0 m), `stone-gate`, `stone-gate-open` share `stone-common.mjs` (masonry courses as thin proud boxes, `wallTop`, banners, slits) and the same frame, so a stone section replaces a wooden one 1:1; the wall walk is at 5.4 m, the tower platform above it. Timber (log-cabin style) middle type `timber-wall-segment`, `timber-tower` (4 m, platform at 7.0 m), `timber-gate`, `timber-gate-open` share `timber-common.mjs` (logs as hexagonal frusta: `logX`/`logZ` — the vertex is up for both, a Z log needs the extra `rotY(30°)` roll; `wallLogs` courses with staggered joints; plank `wallTop`): wood built like the stone wall, walk at 4.6 m, ends at x = +-5.
  Plants (`tools/plants/*.mjs`: `spruce` 7.7 m, `oak` 6.9 m with a 6 m crown, `pine` 8.7 m with a small crown on a bare trunk; all round about Y, 280-470 triangles) are the same with `folder: '3D-models-plants'` -> `3D-models/3D-models-plants/`.
- Model space: meters, feet at y = 0 and origin at the centre of the footprint, the front (door) faces +Z.
- A gable triangle is a 3-sided frustum turned by `rotZ(90°)` (apex up): height 1.5 r, base 1.732 r times `sq`.
  A sloped slab is a box with `q: rotX(±pitch)` about its own centre; a beam in the plane of a gable is a box turned by `rotX(atan2(-dy, dz))`.
- Keep decals >= 0.006 m above their surface (z-fighting) and the whole building within `MAX_TRIANGLES` = 2500 triangles (`tools/make-buildings.mjs`, checked by `tests/buildings.test.mjs`; units keep 1000). The peasant house is 804, the two-floor barracks 1996.

## Clips every unit has

| Clip | Loop | Typical | Notes |
|---|---|---|---|
| `idle` | yes | 2.4 s, 12 frames | small breathing + a look around |
| `run` | yes | 0.64 s, 16 frames | legs +-42°, shins bend after the swing, hips bounce |
| `attack` | yes | 0.9 s, 18 frames | guard -> wind-up -> strike with a step -> guard; melee loops it |
| `death` | no | 1.3 s, 13 frames | ends lying: hips y < 0.25 (test); play with `{ loop: false }` |
| `runAttack` | yes | 1.28 s, 32 frames | horse only (and `rideRunAttack` of the swordsman): an attack at a gallop |
| `ride`, `rideRun`, `rideAttack`, `rideRunAttack`, `rideDeath` | as the horse's | = the horse's | swordsman only: seated on a horse, each pairs with the horse clip of the same length |

A ranged unit keeps the names (`attack` = draw and release) so game code stays the same. Exceptions: the horse's `attack` is a rear and a stamp, `runAttack` is the same at a gallop; the swordsman also has the mounted `ride*` clips (see Mounts). `idle` and `run` come first in every file (test).

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
- `armAngles` applies `rotZ` after `rotX`, in the parent's frame: "rz < 0 moves the right arm
  outward" holds only while the arm hangs. On an arm raised overhead the sign flips — a negative
  rz tilts the fist over the helmet (the swordsman's wind-up put the sword through his head).
  A raised arm goes outward with rz > 0; check swings against the head with `clashes()` from
  `tests/unit-collision.mjs` (it samples between keys, where these cross-overs happen).
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
   `3D-models/3D-models-units/previews/` are the pictures users see: regenerate them after a visual change.
