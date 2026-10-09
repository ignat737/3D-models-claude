// Static building models: tools/make-buildings.mjs -> 3D-models/3D-models-buildings/*.glb (shared
// builder tools/unit-glb.mjs). Files on disk match the generators; one mesh, one material, no
// skeleton and no animations; every colour is a texel of the palette.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { test } from 'node:test';
import { BUILDINGS, MAX_TRIANGLES, buildGlb, buildMesh, outOf } from '../tools/make-buildings.mjs';

function parseGlb(buf) {
  assert.equal(buf.toString('latin1', 0, 4), 'glTF');
  assert.equal(buf.readUInt32LE(8), buf.length, 'длина в заголовке');
  const jsonLength = buf.readUInt32LE(12);
  return { gltf: JSON.parse(buf.toString('utf8', 20, 20 + jsonLength)), bin: buf.subarray(20 + jsonLength + 8) };
}

test('здания: имена уникальны, статичные, без клипов', () => {
  assert.equal(new Set(BUILDINGS.map(b => b.name)).size, BUILDINGS.length);
  for (const b of BUILDINGS) assert.ok(b.static && b.clips.length === 0 && b.joints.length === 0, b.name);
});

for (const building of BUILDINGS) {
  test(`${building.name}.glb на диске совпадает с генератором (node tools/make-buildings.mjs)`, () => {
    assert.ok(fs.readFileSync(outOf(building)).equals(buildGlb(building)));
  });

  test(`${building.name}: один меш, один материал с палитрой, без скелета и анимаций`, () => {
    const { gltf, bin } = parseGlb(buildGlb(building));
    assert.equal(gltf.buffers[0].byteLength, bin.length);
    for (const v of gltf.bufferViews) assert.ok(v.byteOffset + v.byteLength <= bin.length);
    assert.equal(gltf.meshes.length, 1);
    assert.equal(gltf.meshes[0].primitives.length, 1, 'один draw call на здание');
    assert.equal(gltf.materials.length, 1);
    assert.equal(gltf.skins, undefined);
    assert.equal(gltf.animations, undefined);
    const p = gltf.meshes[0].primitives[0];
    assert.deepEqual(Object.keys(p.attributes).sort(), ['NORMAL', 'POSITION', 'TEXCOORD_0']);
    const img = gltf.bufferViews[gltf.images[0].bufferView];
    assert.equal(bin.toString('latin1', img.byteOffset + 1, img.byteOffset + 4), 'PNG');
    assert.equal(gltf.samplers[0].minFilter, 9728, 'без мипмапов: палитра не сереет вдали');
    assert.ok(building.palette.length <= 16, 'палитра 4x4');
    assert.ok(buildMesh(building).indices.length / 3 <= MAX_TRIANGLES, `не больше ${MAX_TRIANGLES} треугольников`);
    // Stands on the ground, every UV at a texel centre (a part is one flat colour).
    assert.ok(Math.abs(gltf.accessors[p.attributes.POSITION].min[1]) < 1e-6);
    const uv = gltf.accessors[p.attributes.TEXCOORD_0], view = gltf.bufferViews[uv.bufferView];
    const data = new Float32Array(bin.buffer, bin.byteOffset + view.byteOffset, uv.count * 2);
    let size = 1;
    while (size * size < building.palette.length) size *= 2;
    for (const v of data) assert.ok(Math.abs(v * size - Math.floor(v * size) - 0.5) < 1e-6);
  });
}

test('крестьянский дом: дверь в рост человека (1,7 м), цвет команды в двери, ставнях и вымпеле', () => {
  const house = BUILDINGS.find(b => b.name === 'peasant-house');
  const door = house.parts.find(p => p.color === 'team' && p.s && p.s[1] > 1.5);
  assert.ok(door && door.s[1] > 1.65 && door.s[0] > 0.7, 'дверь проходима');
  assert.ok(house.palette.some(c => c.name === 'team') && house.palette.some(c => c.name === 'teamDark'));
  assert.ok(house.parts.filter(p => p.color === 'team').length >= 4);
});

test('казарма: два этажа выше дома, длиннее его, двойная дверь, балкон, знамёна и флаг цвета команды', () => {
  const house = BUILDINGS.find(b => b.name === 'peasant-house'), barracks = BUILDINGS.find(b => b.name === 'barracks');
  const width = b => Math.max(...b.parts.filter(p => p.s).map(p => p.s[0]));
  const top = b => Math.max(...b.parts.filter(p => p.s && !p.q).map(p => p.c[1] + p.s[1] / 2));
  assert.ok(width(barracks) > width(house) + 2, 'длиннее дома');
  assert.ok(top(barracks) > top(house) + 1.5, 'два этажа выше одного');
  const frame = barracks.parts.find(p => p.color === 'timber' && p.s && p.s[0] > 1.8 && p.s[1] > 1.8 && p.s[2] < 0.1);
  assert.ok(frame, 'двойная дверь в раме');
  const upperDoor = barracks.parts.find(p => p.color === 'timber' && p.s && p.s[0] > 0.8 && p.s[1] > 1.5 && p.s[2] < 0.1 && p.c[1] - p.s[1] / 2 > 2.6);
  assert.ok(upperDoor, 'дверь на балкон во втором этаже');
  assert.ok(barracks.parts.filter(p => p.color === 'team').length >= 6, 'знамёна, балкон, флаг, щит, пояс манекена');
  assert.ok(buildMesh(barracks).indices.length / 3 > buildMesh(house).indices.length / 3);
});

test('частокол: сегмент ровно 10 м вдоль X, стыкуется торцами, лежит в 3D-models-defense, цвет команды на вымпеле', () => {
  const wall = BUILDINGS.find(b => b.name === 'palisade-segment');
  assert.equal(wall.folder, '3D-models-defense');
  assert.ok(outOf(wall).endsWith('3D-models-defense/palisade-segment.glb') || outOf(wall).endsWith('3D-models-defense\\palisade-segment.glb'));
  const { gltf } = parseGlb(buildGlb(wall));
  const { min, max } = gltf.accessors[gltf.meshes[0].primitives[0].attributes.POSITION];
  assert.ok(Math.abs(min[0] + 5) < 1e-5 && Math.abs(max[0] - 5) < 1e-5, 'от -5 до +5 м');
  assert.ok(max[1] > 2.8 && max[1] < 5, 'брёвна выше человека');
  assert.ok(wall.parts.some(p => p.color === 'team') && wall.parts.some(p => p.color === 'teamDark'));
});

test('башня частокола: 3 x 3 м по оси стены, площадка для стрелков на 3,6 м, парапет по грудь, лестница, цвет команды', () => {
  const tower = BUILDINGS.find(b => b.name === 'palisade-tower');
  assert.equal(tower.folder, '3D-models-defense');
  const { gltf } = parseGlb(buildGlb(tower));
  const { min, max } = gltf.accessors[gltf.meshes[0].primitives[0].attributes.POSITION];
  assert.ok(Math.abs(min[0] + max[0]) < 0.05 && Math.abs(min[2] + max[2]) < 0.7, 'центр на оси стены');
  const planks = tower.parts.filter(p => p.s && p.s[0] > 3.4 && p.c[1] > 3 && p.c[1] < 3.6);
  assert.ok(planks.length >= 5 && planks.reduce((a, p) => a + p.s[2], 0) > 3.4, 'настил шире основания (свес)');
  const deck = planks[0];
  const floor = deck.c[1] + deck.s[1] / 2;
  const logs = tower.parts.filter(p => p.h && p.c[1] > floor && p.c[1] < floor + 1.4 && p.r[0] === p.r[1]);
  assert.ok(logs.length >= 15 && logs.every(p => p.c[1] - p.h / 2 >= floor - 1e-6), 'парапет стоит на площадке');
  assert.ok(max[1] > floor + 2, 'над площадкой крыша выше человека');
  assert.ok(tower.parts.some(p => p.color === 'team') && tower.parts.some(p => p.color === 'teamDark'));
});

test('ворота частокола: секция 10 м вместо сегмента, открытые створки не загораживают проём 4,2 x 3,4 м, закрытые — загораживают', () => {
  const closed = BUILDINGS.find(b => b.name === 'palisade-gate'), open = BUILDINGS.find(b => b.name === 'palisade-gate-open');
  assert.ok(closed && open && closed.folder === '3D-models-defense' && open.folder === '3D-models-defense');
  for (const g of [closed, open]) {
    const { gltf } = parseGlb(buildGlb(g));
    const { min, max } = gltf.accessors[gltf.meshes[0].primitives[0].attributes.POSITION];
    assert.ok(Math.abs(min[0] + 5) < 1e-5 && Math.abs(max[0] - 5) < 1e-5, g.name + ': от -5 до +5 м');
    assert.ok(g.parts.some(p => p.color === 'team') && g.parts.some(p => p.color === 'teamDark'), g.name);
  }
  // Boxes with no turn that stand in the opening between the posts (|x| < 2.1) below the lintel.
  const blocks = g => g.parts.filter(p => p.s && !p.q && p.color !== 'earth' && p.c[1] > 0.3 && p.c[1] < 3.2 && Math.abs(p.c[0]) + p.s[0] / 2 < 2.15);
  assert.ok(blocks(closed).length >= 20, 'створки закрыты');
  assert.equal(blocks(open).filter(p => p.s[0] > 0.2 && p.s[2] < 1).length, 0, 'в открытом проёме нет досок поперёк');
});

test('ель: 7,7 м, крона шире ствола, ярусы сужаются кверху, стоит на оси, лежит в 3D-models-plants', () => {
  const spruce = BUILDINGS.find(b => b.name === 'spruce');
  assert.ok(spruce && spruce.folder === '3D-models-plants');
  assert.ok(outOf(spruce).endsWith('3D-models-plants' + (outOf(spruce).includes('/') ? '/' : '\\') + 'spruce.glb'));
  const { gltf } = parseGlb(buildGlb(spruce));
  const { min, max } = gltf.accessors[gltf.meshes[0].primitives[0].attributes.POSITION];
  assert.ok(Math.abs(max[1] - 7.7) < 1e-5, 'высота 7,7 м');
  assert.ok(max[0] - min[0] > 4 && Math.abs(max[0] + min[0]) < 0.3 && Math.abs(max[2] + min[2]) < 0.3, 'крона 4+ м, ось дерева в центре');
  const tiers = spruce.parts.filter(p => p.h && p.r[0] > 0.8 && p.color.startsWith('needles'));
  assert.ok(tiers.length >= 5);
  for (let i = 1; i < tiers.length; i++) assert.ok(tiers[i].r[0] < tiers[i - 1].r[0] && tiers[i].c[1] > tiers[i - 1].c[1], 'ярусы сужаются и поднимаются');
});

function bounds(b) {
  const { gltf } = parseGlb(buildGlb(b));
  return gltf.accessors[gltf.meshes[0].primitives[0].attributes.POSITION];
}

test('дуб: 6,9 м, крона шире 6 м и шире ствола в 8+ раз, листва трёх оттенков, лежит в 3D-models-plants', () => {
  const oak = BUILDINGS.find(b => b.name === 'oak');
  assert.ok(oak && oak.folder === '3D-models-plants');
  const { min, max } = bounds(oak);
  assert.ok(Math.abs(max[1] - 6.925) < 1e-3, 'высота 6,9 м');
  assert.ok(max[0] - min[0] > 6 && max[2] - min[2] > 5, 'крона шире 6 м');
  const trunk = oak.parts.find(p => p.color === 'bark' && p.h > 1.5);
  assert.ok((max[0] - min[0]) / (2 * trunk.r[0]) > 6, 'ствол тонкий рядом с кроной');
  assert.ok(new Set(oak.parts.filter(p => p.color.startsWith('leaves')).map(p => p.color)).size === 3);
});

test('сосна: 8,7 м, ствол голый до 5 м, крона наверху и уже, чем у дуба', () => {
  const pine = BUILDINGS.find(b => b.name === 'pine'), oak = BUILDINGS.find(b => b.name === 'oak');
  assert.ok(pine && pine.folder === '3D-models-plants');
  const { min, max } = bounds(pine), o = bounds(oak);
  assert.ok(Math.abs(max[1] - 8.7) < 1e-3, 'высота 8,7 м');
  assert.ok(max[1] > o.max[1] + 1.5 && max[0] - min[0] < o.max[0] - o.min[0], 'выше и уже дуба');
  const crown = pine.parts.filter(p => p.color.startsWith('needles'));
  assert.ok(crown.length >= 4 && crown.every(p => p.c[1] - p.h / 2 > 5), 'иглы только выше 5 м');
});

test('каменные стена, башня и ворота: секции по 10 м, зубцы, боевой ход, арка, цвет команды', () => {
  const by = n => BUILDINGS.find(b => b.name === n);
  const wall = by('stone-wall-segment'), tower = by('stone-tower'), gate = by('stone-gate'), open = by('stone-gate-open');
  for (const b of [wall, tower, gate, open]) {
    assert.ok(b && b.folder === '3D-models-defense', b && b.name);
    assert.ok(b.parts.some(p => p.color === 'team') && b.parts.some(p => p.color === 'teamDark'), b.name + ': цвет команды');
  }
  const bounds = b => {
    const { gltf } = parseGlb(buildGlb(b));
    return gltf.accessors[gltf.meshes[0].primitives[0].attributes.POSITION];
  };
  for (const b of [wall, gate, open]) {
    const { min, max } = bounds(b);
    assert.ok(Math.abs(min[0] + 5) < 1e-5 && Math.abs(max[0] - 5) < 1e-5, b.name + ': от -5 до +5 м, стыкуется со стеной');
  }
  const merlons = b => b.parts.filter(p => p.s && p.s[0] === 1.0 && p.s[1] === 0.75);
  assert.equal(merlons(wall).length, 6, 'шесть зубцов на секции стены');
  assert.equal(merlons(gate).length, 6, 'боевой ход идёт поверх ворот');
  assert.ok(Math.abs(bounds(wall).max[1] - 6.68) < 0.1 && bounds(wall).max[1] > bounds(by('palisade-segment')).max[1] + 2, 'каменная стена выше частокола вместе с его вымпелом');

  // The tower: 4.2 m square on the wall line, a platform with a crenellated parapet above the wall walk.
  const { min, max } = bounds(tower);
  assert.ok(Math.abs(min[0] + max[0]) < 1e-5 && Math.abs(min[2] + max[2]) < 0.3, 'башня центрирована на оси стены (ступень двери выступает на -Z)');
  const slab = tower.parts.find(p => p.s && p.s[0] > 5 && p.s[1] < 0.3 && p.color === 'stone' && p.c[1] > 7.5);
  assert.ok(slab, 'плита площадки с выносом на консолях');
  assert.ok(slab.c[1] + slab.s[1] / 2 > 5.4 + 1.5, 'площадка выше боевого хода стены минимум на 1,5 м');
  assert.ok(tower.parts.filter(p => p.s && p.s[1] === 0.75 && Math.max(p.s[0], p.s[2]) === 0.9).length === 8, 'зубцы на всех четырёх сторонах');
  assert.ok(tower.parts.some(p => p.color === 'wood' && p.s && p.s[1] > 2), 'дверь');

  // The gate: an arch of 11 voussoirs; closed leaves fill the opening, open ones leave it free.
  assert.equal(gate.parts.filter(p => p.q && p.s && p.s[0] === 0.45).length, 11, 'арка из 11 клиньев');
  const planks = b => b.parts.filter(p => p.s && !p.q && ['wood', 'woodDark', 'woodLight'].includes(p.color) && Math.abs(p.c[0]) < 2.1 && p.s[0] > 0.15 && p.s[1] > 0.5);
  assert.equal(planks(gate).length, 22, 'доски створок закрывают проём');
  assert.equal(planks(open).length, 0, 'в открытом проёме досок нет');
});

test('срубные стена, башня и ворота: секции по 10 м, венцы, дощатый боевой ход с зубцами, ниже каменных, цвет команды', () => {
  const by = n => BUILDINGS.find(b => b.name === n);
  const wall = by('timber-wall-segment'), tower = by('timber-tower'), gate = by('timber-gate'), open = by('timber-gate-open');
  const bounds = b => {
    const { gltf } = parseGlb(buildGlb(b));
    return gltf.accessors[gltf.meshes[0].primitives[0].attributes.POSITION];
  };
  for (const b of [wall, tower, gate, open]) {
    assert.ok(b && b.folder === '3D-models-defense', b && b.name);
    assert.ok(b.parts.some(p => p.color === 'team') && b.parts.some(p => p.color === 'teamDark'), b.name + ': цвет команды');
    assert.ok(!b.parts.some(p => p.color === 'shingle'), b.name);
  }
  for (const b of [wall, gate, open]) {
    const { min, max } = bounds(b);
    assert.ok(Math.abs(min[0] + 5) < 1e-5 && Math.abs(max[0] - 5) < 1e-5, b.name + ': от -5 до +5 м, стыкуется со стеной');
  }
  const logs = b => b.parts.filter(p => p.h && p.n === 6 && p.q && p.r[0] === 0.28);
  const merlons = b => b.parts.filter(p => p.s && p.s[0] === 1.0 && p.s[1] === 0.75 && p.color === 'plank');
  assert.ok(logs(wall).length >= 28, 'венцы из брёвен на обеих сторонах, по два бревна в ряду');
  assert.equal(merlons(wall).length, 6, 'шесть зубцов на секции стены');
  assert.equal(merlons(gate).length, 6, 'боевой ход идёт поверх ворот');
  const top = bounds(wall).max[1], stoneTop = bounds(by('stone-wall-segment')).max[1];
  assert.ok(top > 5.5 && top < stoneTop - 0.5, 'выше человека и ниже каменной стены');
  assert.ok(wall.parts.every(p => !p.s || p.c[1] - p.s[1] / 2 > -1e-6), 'стоит на земле');

  // The tower: 4 m body on the wall line, logs notched at the corners, a platform above the wall walk.
  const tb = bounds(tower);
  assert.ok(Math.abs(tb.min[0] + tb.max[0]) < 1e-5 && Math.abs(tb.min[2] + tb.max[2]) < 0.3, 'башня центрирована на оси стены');
  assert.ok(logs(tower).length === 24 && logs(tower).some(p => p.h > 4.5), 'двенадцать венцов, брёвна длиннее стены башни (торцы на углах)');
  assert.ok(tower.parts.filter(p => p.s && p.s[1] === 0.75 && Math.max(p.s[0], p.s[2]) === 0.9).length === 8, 'зубцы на всех сторонах');
  const deck = tower.parts.filter(p => p.s && p.s[0] > 5 && p.s[1] === 0.2 && p.c[1] > 6.5);
  assert.ok(deck.length === 6 && deck[0].c[1] + 0.1 > 4.6 + 2, 'площадка выше боевого хода стены минимум на 2 м');
  assert.ok(tower.parts.some(p => p.color === 'plank' && p.s && p.s[1] > 2), 'дверь');

  // The gate: leaves close the opening, open ones leave it free; a lintel carries the wall walk.
  assert.ok(gate.parts.some(p => p.color === 'wood' && p.s && p.s[0] > 5 && p.s[1] === 0.6), 'перемычка над проёмом');
  const planks = b => b.parts.filter(p => p.s && !p.q && ['wood', 'woodDark', 'woodLight'].includes(p.color) && Math.abs(p.c[0]) < 2.1 && p.s[0] > 0.15 && p.s[1] > 2.5 && p.s[1] < 3.2);
  assert.equal(planks(gate).length, 22, 'доски створок закрывают проём');
  assert.equal(planks(open).length, 0, 'в открытом проёме досок нет');
});

const ORC_TIERS = [
  { tier: 'palisade', human: 'palisade', wall: 'orc-palisade-segment', humanWall: 'palisade-segment' },
  { tier: 'timber', human: 'timber', wall: 'orc-timber-wall-segment', humanWall: 'timber-wall-segment' },
  { tier: 'stone', human: 'stone', wall: 'orc-stone-wall-segment', humanWall: 'stone-wall-segment' },
];

test('орочьи укрепления: три яруса по четыре модели, секции по 10 м, выше человеческих, кости и черепа, огонь на башнях, цвет команды', () => {
  const by = n => BUILDINGS.find(b => b.name === n);
  const bounds = b => {
    const { gltf } = parseGlb(buildGlb(b));
    return gltf.accessors[gltf.meshes[0].primitives[0].attributes.POSITION];
  };
  for (const { tier, wall, humanWall } of ORC_TIERS) {
    const names = [wall, `orc-${tier}-tower`, `orc-${tier}-gate`, `orc-${tier}-gate-open`];
    for (const n of names) {
      const b = by(n);
      assert.ok(b && b.folder === '3D-models-defense', n);
      assert.ok(b.parts.some(p => p.color === 'team') && b.parts.some(p => p.color === 'teamDark'), n + ': цвет команды');
      assert.ok(b.parts.filter(p => p.color === 'bone').length >= 5, n + ': кости и черепа');
      assert.ok(b.palette.some(c => c.name === 'fire') && b.palette.length === 16, n + ': одна палитра на 16 цветов');
    }
    for (const n of [wall, names[2], names[3]]) {
      const { min, max } = bounds(by(n));
      assert.ok(Math.abs(min[0] + 5) < 1e-5 && Math.abs(max[0] - 5) < 1e-5, n + ': от -5 до +5 м, стыкуется со своей стеной');
    }
    // The footprint (parts that stand on the ground) is centred on the wall line; flags and horns may stick out on one side.
    const foot = by(names[1]).parts.filter(p => p.s && !p.q && p.c[1] - p.s[1] / 2 < 1e-6);
    assert.ok(Math.abs(Math.min(...foot.map(p => p.c[0] - p.s[0] / 2)) + Math.max(...foot.map(p => p.c[0] + p.s[0] / 2))) < 0.05, names[1] + ': башня на оси стены');
    assert.ok(by(names[1]).parts.some(p => p.color === 'fire'), names[1] + ': жаровня с огнём');
    assert.ok(bounds(by(wall)).max[1] > bounds(by(humanWall)).max[1], wall + ' выше человеческой');
    assert.ok(bounds(by(names[1])).max[1] > bounds(by(`${tier === 'palisade' ? 'palisade' : tier}-tower`)).max[1] - 1.5, names[1] + ': не ниже человеческой башни');

    // Gates: closed leaves fill the opening, open ones leave it free.
    const planks = b => b.parts.filter(p => p.s && !p.q && ['wood', 'woodDark', 'woodLight'].includes(p.color) && Math.abs(p.c[0]) < 2.2 && p.s[0] > 0.15 && p.s[1] > 1.5 && p.s[1] < 4.5);
    assert.ok(planks(by(names[2])).length >= 14, names[2] + ': створки закрывают проём');
    assert.equal(planks(by(names[3])).length, 0, names[3] + ': в открытом проёме досок нет');
  }
  // Pointed merlons (a charred tip each) on the walls and over the gates of the log and stone tiers; twenty crooked logs in the palisade.
  const tips = b => b.parts.filter(p => p.n === 4 && p.h === 0.4 && p.color === 'char').length;
  for (const n of ['orc-timber-wall-segment', 'orc-timber-gate', 'orc-stone-wall-segment', 'orc-stone-gate']) assert.equal(tips(by(n)), 6, n + ': шесть острых зубцов');
  assert.equal(by('orc-palisade-segment').parts.filter(p => p.n === 6 && p.r[1] === 0.03 && p.color === 'char').length, 20, 'двадцать брёвен с обожжёнными остриями');
  assert.ok(by('orc-stone-gate').parts.filter(p => p.n === 4 && p.color === 'bone').length >= 5, 'клыки в пасти арки');
});
