// unit-glb.mjs — shared builder of the low-poly unit models in 3D-models/ (tools/make-units.mjs).
// A unit = joints + rigid parts (boxes and frustums) + clips -> one skinned GLB with ONE mesh,
// ONE material and a tiny palette texture (a colour = a texel, every vertex of a part samples the
// centre of its texel). However many colours a unit has, it is one draw call: an army of them
// costs CPU per unit, not per colour. Everything is generated — no source file, no licence questions.
//
// glTF: meters, Y up, right-handed, counter-clockwise front faces, quaternions [x, y, z, w].

// --- Math ---------------------------------------------------------------------------

export const DEG = Math.PI / 180;
export const rotX = a => [Math.sin(a / 2), 0, 0, Math.cos(a / 2)];
export const rotY = a => [0, Math.sin(a / 2), 0, Math.cos(a / 2)];
export const rotZ = a => [0, 0, Math.sin(a / 2), Math.cos(a / 2)];
export const qmul = (a, b) => [
  a[3] * b[0] + a[0] * b[3] + a[1] * b[2] - a[2] * b[1],
  a[3] * b[1] - a[0] * b[2] + a[1] * b[3] + a[2] * b[0],
  a[3] * b[2] + a[0] * b[1] - a[1] * b[0] + a[2] * b[3],
  a[3] * b[3] - a[0] * b[0] - a[1] * b[1] - a[2] * b[2],
];
export const qconj = q => [-q[0], -q[1], -q[2], q[3]];
export const qrot = (q, v) => qmul(qmul(q, [v[0], v[1], v[2], 0]), qconj(q)).slice(0, 3);
export const add = (a, b) => a.map((v, k) => v + b[k]);
export const sub = (a, b) => a.map((v, k) => v - b[k]);
export const scale3 = (v, k) => v.map(x => x * k);
export const lerp = (a, b, k) => a.map((v, i) => v + (b[i] - v) * k);
export const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
export const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
export const norm = v => v.map(x => x / Math.hypot(...v));
const normalize = norm;
const smooth = x => x * x * (3 - 2 * x);

// The shortest rotation taking direction u to direction v (any lengths).
export function fromTo(u, v) {
  const a = norm(u), b = norm(v), d = dot(a, b);
  if (d < -0.999999) return [...norm(Math.abs(a[0]) < 0.9 ? cross(a, [1, 0, 0]) : cross(a, [0, 1, 0])), 0];
  const c = cross(a, b), q = [c[0], c[1], c[2], 1 + d], l = Math.hypot(...q);
  return q.map(x => x / l);
}

// Key poses -> the pose at u: stops = [{ u, param: number, … }] sorted by u, the first at 0 and
// the last at 1; every stop has the same params. Smoothstep between neighbouring stops.
export function tween(u, stops) {
  let i = 0;
  while (i < stops.length - 2 && u > stops[i + 1].u) i++;
  const a = stops[i], b = stops[i + 1];
  const k = smooth(Math.min(1, Math.max(0, (u - a.u) / (b.u - a.u))));
  const out = {};
  for (const key of Object.keys(a)) if (key !== 'u') out[key] = a[key] + (b[key] - a[key]) * k;
  return out;
}

// --- Skeleton and clips -------------------------------------------------------------

// Every IK target an arm could not reach while the units were built: { joint, cm }. A hand that
// misses its shaft or string floats in the air — make-units warns, the tests fail.
export const IK_MISSES = [];

// joints: [{ name, at: bind position in model space, parent: index | -1 }].
export function rig(joints) {
  const J = Object.fromEntries(joints.map((j, i) => [j.name, i]));
  // World rotation q and position p of a joint under a pose; a track the pose lacks stays at bind.
  const worldOf = (pose, index) => {
    const j = joints[index];
    const parent = j.parent < 0 ? { q: [0, 0, 0, 1], p: [0, 0, 0] } : worldOf(pose, j.parent);
    const t = pose[j.name + '.translation'] || (j.parent < 0 ? j.at : sub(j.at, joints[j.parent].at));
    const r = pose[j.name + '.rotation'] || [0, 0, 0, 1];
    return { q: qmul(parent.q, r), p: add(parent.p, qrot(parent.q, t)) };
  };
  const setRotation = (pose, name, q) => { pose[name + '.rotation'] = q[3] < 0 ? q.map(v => -v) : q; };
  const parentQ = (pose, i) => (joints[i].parent < 0 ? [0, 0, 0, 1] : worldOf(pose, joints[i].parent).q);
  // An item joint (shield, spear…) turns to the world rotation aim, whatever the arm does.
  // slide (optional) — meters along the item's +Y: the item slides through the fist.
  const aimJoint = (pose, name, aim, slide) => {
    const j = joints[J[name]], inv = qconj(parentQ(pose, J[name]));
    setRotation(pose, name, qmul(inv, aim));
    if (slide !== undefined) pose[name + '.translation'] = add(sub(j.at, joints[j.parent].at), qrot(inv, qrot(aim, [0, slide, 0])));
    return pose;
  };
  // Turn a joint so that its bind direction rest points along worldDir.
  const pointJoint = (pose, name, worldDir, rest = [0, -1, 0]) => {
    setRotation(pose, name, fromTo(rest, qrot(qconj(parentQ(pose, J[name])), worldDir)));
    return pose;
  };
  // Two-bone IK: the point `hand` meters below the fore joint goes to target (model space), the
  // elbow bends towards pole. Returns how far the target stays out of reach (0 — reached).
  const reach = (pose, upper, fore, target, pole, hand) => {
    const bone = sub(joints[J[fore]].at, joints[J[upper]].at), a = Math.hypot(...bone);
    const s = worldOf(pose, J[upper]).p, d = sub(target, s), full = Math.hypot(...d);
    const dist = Math.min(Math.max(full, 1e-4), a + hand - 1e-4), dir = norm(d);
    const cosA = Math.max(-1, Math.min(1, (a * a + dist * dist - hand * hand) / (2 * a * dist)));
    const side = norm(sub(pole, scale3(dir, dot(pole, dir))));
    const elbow = add(s, scale3(add(scale3(dir, cosA), scale3(side, Math.sqrt(1 - cosA * cosA))), a));
    pointJoint(pose, upper, sub(elbow, s), norm(bone));
    pointJoint(pose, fore, sub(add(s, scale3(dir, dist)), elbow));
    if (full - dist > 0.005) IK_MISSES.push({ joint: upper, cm: +((full - dist) * 100).toFixed(1) });
    return full - dist;
  };
  // Move a joint (its translation track) to a model-space point: a string nock, a sliding item.
  const placeJoint = (pose, name, worldPos) => {
    const par = worldOf(pose, joints[J[name]].parent);
    pose[name + '.translation'] = qrot(qconj(par.q), sub(worldPos, par.p));
    return pose;
  };
  return { J, worldOf, aimJoint, pointJoint, reach, placeJoint };
}

// A looped clip: frames + 1 keys, the last one repeats the first — the loop has no seam.
// pose(t), t in [0, 2π).
export function loopClip(name, duration, frames, pose) {
  return sampleClip(name, duration, frames, true, i => pose(2 * Math.PI * (i % frames) / frames));
}

// A clip played once (death…): pose(u), u from 0 to 1 inclusive; the model stays in the last pose.
export function onceClip(name, duration, frames, pose) {
  return sampleClip(name, duration, frames, false, i => pose(i / frames));
}

function sampleClip(name, duration, frames, loop, poseAt) {
  const times = [], tracks = new Map();
  for (let i = 0; i <= frames; i++) {
    times.push(duration * i / frames);
    for (const [key, value] of Object.entries(poseAt(i))) {
      if (!tracks.has(key)) tracks.set(key, []);
      tracks.get(key).push(value);
    }
  }
  for (const [key, values] of tracks) if (values.length !== times.length) throw new Error(`${name}: track ${key} is missing in some frames`);
  return { name, loop, times, tracks };
}

// --- Geometry -----------------------------------------------------------------------

// Parts, rigid on one joint, coloured by a palette name. A box: center c, size s. A round part
// (s absent) — a frustum about the vertical axis: center c, height h, radii r [bottom, top],
// n sides, smooth side normals, sq — squash along Z (a sword blade). Optional q — a rotation of
// the whole part about pivot (default c): a shield disc facing forward, a sword along the fist.
// A span { span: [a, b], joints: [ja, jb], w } — a thin square bar from a to b whose a-end is
// skinned to ja and b-end to jb: it stretches when the joints move apart (a bow string).
const FACES = [
  { n: [1, 0, 0], v: [[1, -1, 1], [1, -1, -1], [1, 1, -1], [1, 1, 1]] },
  { n: [-1, 0, 0], v: [[-1, -1, -1], [-1, -1, 1], [-1, 1, 1], [-1, 1, -1]] },
  { n: [0, 1, 0], v: [[-1, 1, 1], [1, 1, 1], [1, 1, -1], [-1, 1, -1]] },
  { n: [0, -1, 0], v: [[-1, -1, -1], [1, -1, -1], [1, -1, 1], [-1, -1, 1]] },
  { n: [0, 0, 1], v: [[-1, -1, 1], [1, -1, 1], [1, 1, 1], [-1, 1, 1]] },
  { n: [0, 0, -1], v: [[1, -1, -1], [-1, -1, -1], [-1, 1, -1], [1, 1, -1]] },
];

function emitter(out, p, uv) {
  const pivot = p.pivot || p.c;
  return (pos, normal, joint = p.joint) => {
    const v = p.q ? add(pivot, qrot(p.q, sub(pos, pivot))) : pos;
    out.positions.push(...v);
    out.normals.push(...(p.q ? qrot(p.q, normal) : normal));
    out.uvs.push(...uv);
    out.joints.push(joint, 0, 0, 0);
    return out.positions.length / 3 - 1;
  };
}

function addBox(out, p, uv) {
  const emit = emitter(out, p, uv);
  for (const f of FACES) {
    const [a, b, c, d] = f.v.map(v => emit([0, 1, 2].map(k => p.c[k] + v[k] * p.s[k] / 2), f.n));
    out.indices.push(a, b, c, a, c, d);
  }
}

function addSpan(out, p, uv) {
  const [from, to] = p.span, len = Math.hypot(...sub(to, from)), c = lerp(from, to, 0.5);
  const emit = emitter(out, { ...p, c, q: fromTo([0, 1, 0], sub(to, from)), pivot: c }, uv);
  for (const f of FACES) {
    const [a, b, cc, d] = f.v.map(v => emit([c[0] + v[0] * p.w / 2, c[1] + v[1] * len / 2, c[2] + v[2] * p.w / 2], f.n, p.joints[v[1] < 0 ? 0 : 1]));
    out.indices.push(a, b, cc, a, cc, d);
  }
}

function addRound(out, p, uv) {
  const emit = emitter(out, p, uv);
  const y0 = p.c[1] - p.h / 2, y1 = p.c[1] + p.h / 2, n = p.n, sq = p.sq || 1;
  const slope = (p.r[0] - p.r[1]) / p.h;
  const ring = (y, r, normal) => {
    const ids = [];
    for (let i = 0; i < n; i++) {
      const a = 2 * Math.PI * i / n, cos = Math.cos(a), sin = Math.sin(a);
      ids.push(emit([p.c[0] + r * cos, y, p.c[2] + r * sin * sq], normal || normalize([cos, slope, sin / sq])));
    }
    return ids;
  };
  const b = ring(y0, p.r[0]), t = ring(y1, p.r[1]);
  const bc = emit([p.c[0], y0, p.c[2]], [0, -1, 0]), bcap = ring(y0, p.r[0], [0, -1, 0]);
  const tc = emit([p.c[0], y1, p.c[2]], [0, 1, 0]), tcap = ring(y1, p.r[1], [0, 1, 0]);
  for (let i = 0; i < n; i++) {
    const k = (i + 1) % n;
    out.indices.push(b[i], t[i], t[k], b[i], t[k], b[k]);
    out.indices.push(bc, bcap[i], bcap[k], tc, tcap[k], tcap[i]);
  }
}

// Every triangle must run counter-clockwise from outside (cross product along the vertex
// normals): the loader sets the side orientation from that, a flipped part renders inside out.
function checkWinding(p, name) {
  const at = i => p.positions.slice(i * 3, i * 3 + 3);
  for (let i = 0; i < p.indices.length; i += 3) {
    const [a, b, c] = [0, 1, 2].map(k => at(p.indices[i + k]));
    const u = sub(b, a), w = sub(c, a);
    const cross = [u[1] * w[2] - u[2] * w[1], u[2] * w[0] - u[0] * w[2], u[0] * w[1] - u[1] * w[0]];
    const normal = [0, 1, 2].map(k => p.normals[p.indices[i] * 3 + k] + p.normals[p.indices[i + 1] * 3 + k] + p.normals[p.indices[i + 2] * 3 + k]);
    if (cross[0] * normal[0] + cross[1] * normal[1] + cross[2] * normal[2] <= 0) throw new Error(`${name}: triangle ${i / 3} is wound against its normals`);
  }
}

// Palette: the smallest square power-of-two texture that fits the colours, row by row.
const paletteSize = count => {
  let size = 1;
  while (size * size < count) size *= 2;
  return size;
};

export function buildMesh(unit) {
  const size = paletteSize(unit.palette.length);
  const index = Object.fromEntries(unit.palette.map((c, i) => [c.name, i]));
  const out = { positions: [], normals: [], uvs: [], joints: [], indices: [] };
  for (const p of unit.parts) {
    const i = index[p.color];
    if (i === undefined) throw new Error(`${unit.name}: no palette colour "${p.color}"`);
    if (!unit.static) for (const j of p.span ? p.joints : [p.joint]) if (!(j >= 0 && j < unit.joints.length)) throw new Error(`${unit.name}: bad joint ${j}`);
    (p.span ? addSpan : p.s ? addBox : addRound)(out, p, [(i % size + 0.5) / size, (Math.floor(i / size) + 0.5) / size]);
  }
  checkWinding(out, unit.name);
  if (out.positions.length / 3 > 65535) throw new Error(`${unit.name}: too many vertices for 16-bit indices`);
  return out;
}

// --- PNG (the palette) ----------------------------------------------------------------

const CRC_TABLE = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
const crc32 = (buf) => {
  let c = 0xffffffff;
  for (const b of buf) c = CRC_TABLE[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
};

// RGB, 8 bits, zlib with a single stored block: no compressor involved, so the bytes do not
// depend on the zlib build of the Node that runs the generator (the --check stays stable).
function palettePng(palette) {
  const size = paletteSize(palette.length);
  const raw = Buffer.alloc((size * 3 + 1) * size);
  palette.forEach((c, i) => {
    const row = Math.floor(i / size), col = i % size, at = row * (size * 3 + 1) + 1 + col * 3;
    for (let k = 0; k < 3; k++) raw[at + k] = parseInt(c.hex.slice(1 + k * 2, 3 + k * 2), 16);
  });
  let s1 = 1, s2 = 0;
  for (const b of raw) { s1 = (s1 + b) % 65521; s2 = (s2 + s1) % 65521; }
  const stored = Buffer.alloc(5);
  stored.writeUInt8(1, 0);
  stored.writeUInt16LE(raw.length, 1);
  stored.writeUInt16LE(raw.length ^ 0xffff, 3);
  const adler = Buffer.alloc(4);
  adler.writeUInt32BE(((s2 << 16) | s1) >>> 0);
  const chunk = (type, data) => {
    const len = Buffer.alloc(4), crc = Buffer.alloc(4), body = Buffer.concat([Buffer.from(type, 'latin1'), data]);
    len.writeUInt32BE(data.length);
    crc.writeUInt32BE(crc32(body));
    return Buffer.concat([len, body, crc]);
  };
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr.set([8, 2, 0, 0, 0], 8);
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', Buffer.concat([Buffer.from([0x78, 0x01]), stored, raw, adler])),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

// --- GLB --------------------------------------------------------------------------------

const FLOAT = 5126, USHORT = 5123, UBYTE = 5121;
const ARRAY_BUFFER = 34962, ELEMENT_ARRAY_BUFFER = 34963;
const NEAREST = 9728, CLAMP = 33071;

// unit: { name, joints, palette: [{ name, hex }], parts, clips }.
// A static unit (buildings: `static: true`, no joints, no clips) is a plain mesh: no skin, no
// joint nodes, no animations.
export function buildGlb(unit) {
  const { joints } = unit, skinned = !unit.static;
  const chunks = [], bufferViews = [], accessors = [];
  let offset = 0;
  const view = (typed, target) => {
    const bytes = Buffer.from(typed.buffer, typed.byteOffset, typed.byteLength);
    const pad = (4 - bytes.length % 4) % 4;
    bufferViews.push({ buffer: 0, byteOffset: offset, byteLength: bytes.length, ...(target ? { target } : {}) });
    chunks.push(bytes, Buffer.alloc(pad));
    offset += bytes.length + pad;
    return bufferViews.length - 1;
  };
  const accessor = (typed, componentType, type, width, target, bounds) => {
    const a = { bufferView: view(typed, target), componentType, count: typed.length / width, type };
    if (bounds) {
      a.min = Array.from({ length: width }, (_, k) => Math.min(...typed.filter((__, i) => i % width === k)));
      a.max = Array.from({ length: width }, (_, k) => Math.max(...typed.filter((__, i) => i % width === k)));
    }
    accessors.push(a);
    return accessors.length - 1;
  };

  const m = buildMesh(unit);
  const primitive = {
    attributes: {
      POSITION: accessor(new Float32Array(m.positions), FLOAT, 'VEC3', 3, ARRAY_BUFFER, true),
      NORMAL: accessor(new Float32Array(m.normals), FLOAT, 'VEC3', 3, ARRAY_BUFFER),
      TEXCOORD_0: accessor(new Float32Array(m.uvs), FLOAT, 'VEC2', 2, ARRAY_BUFFER),
      ...(skinned ? {
        JOINTS_0: accessor(new Uint8Array(m.joints), UBYTE, 'VEC4', 4, ARRAY_BUFFER),
        WEIGHTS_0: accessor(new Float32Array(m.joints.map((_, i) => (i % 4 === 0 ? 1 : 0))), FLOAT, 'VEC4', 4, ARRAY_BUFFER),
      } : {}),
    },
    indices: accessor(new Uint16Array(m.indices), USHORT, 'SCALAR', 1, ELEMENT_ARRAY_BUFFER),
    material: 0,
  };
  const image = view(new Uint8Array(palettePng(unit.palette)));

  // The bind pose has no rotations: the inverse bind matrix is a translation by −position.
  const inverseBind = new Float32Array(joints.length * 16);
  joints.forEach((j, i) => inverseBind.set([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, -j.at[0], -j.at[1], -j.at[2], 1], i * 16));
  const inverseBindMatrices = skinned ? accessor(inverseBind, FLOAT, 'MAT4', 16) : -1;

  // Nodes: 0 — the skinned mesh, 1… — joints (node = joint index + 1).
  const nodes = [{ name: unit.name, mesh: 0, ...(skinned ? { skin: 0 } : {}) }];
  joints.forEach((j, i) => {
    const p = j.parent < 0 ? [0, 0, 0] : joints[j.parent].at;
    const children = joints.map((c, k) => (c.parent === i ? k + 1 : 0)).filter(Boolean);
    nodes.push({ name: j.name, translation: j.at.map((v, k) => +(v - p[k]).toFixed(6)), ...(children.length ? { children } : {}) });
  });
  const J = Object.fromEntries(joints.map((j, i) => [j.name, i]));

  const animations = unit.clips.map((c) => {
    const input = accessor(new Float32Array(c.times), FLOAT, 'SCALAR', 1, 0, true);
    const samplers = [], channels = [];
    for (const [key, values] of c.tracks) {
      const [joint, prop] = key.split('.');
      if (!(joint in J)) throw new Error(`${unit.name}/${c.name}: no joint "${joint}"`);
      const width = prop === 'rotation' ? 4 : 3;
      samplers.push({ input, output: accessor(new Float32Array(values.flat()), FLOAT, width === 4 ? 'VEC4' : 'VEC3', width), interpolation: 'LINEAR' });
      channels.push({ sampler: samplers.length - 1, target: { node: J[joint] + 1, path: prop } });
    }
    return { name: c.name, samplers, channels };
  });

  const gltf = {
    asset: { version: '2.0', generator: 'ArcEngine tools/make-units.mjs' },
    scene: 0,
    scenes: [{ nodes: skinned ? [0, 1] : [0] }],
    nodes,
    meshes: [{ name: unit.name, primitives: [primitive] }],
    ...(skinned ? { skins: [{ joints: joints.map((_, i) => i + 1), skeleton: 1, inverseBindMatrices }] } : {}),
    materials: [{ name: unit.name, pbrMetallicRoughness: { baseColorTexture: { index: 0 }, metallicFactor: 0, roughnessFactor: 1 } }],
    // NEAREST without mipmaps: a far-away unit keeps its colours instead of a grey palette average.
    samplers: [{ magFilter: NEAREST, minFilter: NEAREST, wrapS: CLAMP, wrapT: CLAMP }],
    textures: [{ sampler: 0, source: 0 }],
    images: [{ name: unit.name + '_palette', bufferView: image, mimeType: 'image/png' }],
    ...(animations.length ? { animations } : {}),
    accessors,
    bufferViews,
    buffers: [{ byteLength: offset }],
  };

  const pad4 = (buf, fill) => Buffer.concat([buf, Buffer.alloc((4 - buf.length % 4) % 4, fill)]);
  const json = pad4(Buffer.from(JSON.stringify(gltf), 'utf8'), 0x20);
  const bin = pad4(Buffer.concat(chunks), 0);
  const header = Buffer.alloc(12);
  header.write('glTF', 0, 'latin1');
  header.writeUInt32LE(2, 4);
  header.writeUInt32LE(12 + 8 + json.length + 8 + bin.length, 8);
  const chunkHeader = (length, type) => {
    const h = Buffer.alloc(8);
    h.writeUInt32LE(length, 0);
    h.write(type, 4, 'latin1');
    return h;
  };
  return Buffer.concat([header, chunkHeader(json.length, 'JSON'), json, chunkHeader(bin.length, 'BIN\0'), bin]);
}
