// make-buildings.mjs — low-poly static building models: 3D-models/3D-models-buildings/<building>.glb
// (a model with `folder: '3D-models-defense'` — walls and fences — or `'3D-models-plants'` — trees —
// goes to 3D-models/<folder>/).
// A building is described in tools/buildings/<building>.mjs (palette, parts) and built by the same
// tools/unit-glb.mjs as the units: one mesh, one palette material, no skeleton, no animation.
//
//   node tools/make-buildings.mjs                  # writes every building
//   node tools/make-buildings.mjs peasant-house    # only the named ones
//   node tools/make-buildings.mjs --check          # exit 1 if a file on disk differs from its generator
import fs from 'node:fs';
import path from 'node:path';
import url from 'node:url';
import { buildGlb, buildMesh } from './unit-glb.mjs';
import barracks from './buildings/barracks.mjs';
import peasantHouse from './buildings/peasant-house.mjs';
import smithy from './buildings/smithy.mjs';
import stable from './buildings/stable.mjs';
import sawmill from './buildings/sawmill.mjs';
import townHall from './buildings/town-hall.mjs';
import castle from './buildings/castle.mjs';
import orcHut from './buildings/orc-hut.mjs';
import orcBarracks from './buildings/orc-barracks.mjs';
import orcSmithy from './buildings/orc-smithy.mjs';
import orcSawmill from './buildings/orc-sawmill.mjs';
import orcFortress from './buildings/orc-fortress.mjs';
import orcTrollLair from './buildings/orc-troll-lair.mjs';
import palisadeSegment from './defense/palisade-segment.mjs';
import palisadeTower from './defense/palisade-tower.mjs';
import stoneWallSegment from './defense/stone-wall-segment.mjs';
import stoneTower from './defense/stone-tower.mjs';
import { closed as stoneGate, opened as stoneGateOpen } from './defense/stone-gate.mjs';
import timberWallSegment from './defense/timber-wall-segment.mjs';
import timberTower from './defense/timber-tower.mjs';
import { closed as timberGate, opened as timberGateOpen } from './defense/timber-gate.mjs';
import orcPalisadeSegment from './defense/orc-palisade-segment.mjs';
import orcPalisadeTower from './defense/orc-palisade-tower.mjs';
import { closed as orcPalisadeGate, opened as orcPalisadeGateOpen } from './defense/orc-palisade-gate.mjs';
import orcTimberWallSegment from './defense/orc-timber-wall-segment.mjs';
import orcTimberTower from './defense/orc-timber-tower.mjs';
import { closed as orcTimberGate, opened as orcTimberGateOpen } from './defense/orc-timber-gate.mjs';
import orcStoneWallSegment from './defense/orc-stone-wall-segment.mjs';
import orcStoneTower from './defense/orc-stone-tower.mjs';
import { closed as orcStoneGate, opened as orcStoneGateOpen } from './defense/orc-stone-gate.mjs';
import { closed as palisadeGate, opened as palisadeGateOpen } from './defense/palisade-gate.mjs';
import oak from './plants/oak.mjs';
import pine from './plants/pine.mjs';
import spruce from './plants/spruce.mjs';

const ROOT = path.resolve(path.dirname(url.fileURLToPath(import.meta.url)), '..');
const OUT_DIR = path.join(ROOT, '3D-models', '3D-models-buildings');
const BUILDINGS = [peasantHouse, barracks, smithy, stable, sawmill, townHall, castle, orcHut, orcBarracks, orcSmithy, orcSawmill, orcFortress, orcTrollLair, palisadeSegment, palisadeTower, palisadeGate, palisadeGateOpen, stoneWallSegment, stoneTower, stoneGate, stoneGateOpen, timberWallSegment, timberTower, timberGate, timberGateOpen, orcPalisadeSegment, orcPalisadeTower, orcPalisadeGate, orcPalisadeGateOpen, orcTimberWallSegment, orcTimberTower, orcTimberGate, orcTimberGateOpen, orcStoneWallSegment, orcStoneTower, orcStoneGate, orcStoneGateOpen, spruce, oak, pine];
// The triangle budget of every building (units: 1000). One draw call each, there are few of them.
const MAX_TRIANGLES = 2500;
const outOf = building => path.join(ROOT, '3D-models', building.folder || '3D-models-buildings', building.name + '.glb');

export { BUILDINGS, MAX_TRIANGLES, OUT_DIR, outOf, buildGlb, buildMesh };

if (process.argv[1] && path.resolve(process.argv[1]) === url.fileURLToPath(import.meta.url)) {
  const names = process.argv.slice(2).filter(a => !a.startsWith('--'));
  const unknown = names.filter(n => !BUILDINGS.some(b => b.name === n));
  if (unknown.length) {
    console.error(`Нет таких зданий: ${unknown.join(', ')}. Есть: ${BUILDINGS.map(b => b.name).join(', ')}`);
    process.exit(1);
  }
  const chosen = names.length ? BUILDINGS.filter(b => names.includes(b.name)) : BUILDINGS;
  let stale = 0;
  for (const building of chosen) {
    const glb = buildGlb(building), out = outOf(building), rel = path.relative(ROOT, out);
    if (process.argv.includes('--check')) {
      const same = fs.existsSync(out) && fs.readFileSync(out).equals(glb);
      if (!same) stale++;
      console.log(same ? `${rel}: совпадает с генератором` : `${rel}: отличается от генератора`);
      continue;
    }
    fs.mkdirSync(path.dirname(out), { recursive: true });
    fs.writeFileSync(out, glb);
    console.log(`${rel}: ${glb.length} байт, ${buildMesh(building).indices.length / 3} треугольников`);
  }
  process.exit(stale ? 1 : 0);
}
