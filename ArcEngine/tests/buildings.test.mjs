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
