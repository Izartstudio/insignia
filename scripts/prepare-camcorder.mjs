import { readFileSync, writeFileSync } from 'node:fs';
import { BufferAttribute, BufferGeometry } from 'three';
import { toCreasedNormals } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

// Bake the existing surface smoothing once, keeping browser startup responsive.
const input = readFileSync('public/models/camcorder-realism-v2.glb');
const jsonLength = input.readUInt32LE(12);
const gltf = JSON.parse(input.toString('utf8', 20, 20 + jsonLength));
const binary = input.subarray(28 + jsonLength);
const chunks = [binary];
let byteLength = binary.length;
const sizes = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4 };
const arrays = { 5121: Uint8Array, 5123: Uint16Array, 5125: Uint32Array, 5126: Float32Array };
function attribute(index) {
  const a = gltf.accessors[index];
  const view = gltf.bufferViews[a.bufferView];
  const ArrayType = arrays[a.componentType];
  if (!ArrayType || !sizes[a.type] || a.sparse) throw new Error('Unsupported model accessor');
  const size = sizes[a.type];
  const data = new ArrayType(a.count * size);
  const stride = view.byteStride || size * ArrayType.BYTES_PER_ELEMENT;
  for (let i = 0; i < a.count; i++) {
    const offset = (view.byteOffset || 0) + (a.byteOffset || 0) + i * stride;
    const bytes = binary.subarray(offset, offset + size * ArrayType.BYTES_PER_ELEMENT);
    data.set(new ArrayType(Uint8Array.from(bytes).buffer), i * size);
  }
  return new BufferAttribute(data, size, a.normalized);
}
for (const mesh of gltf.meshes) for (const primitive of mesh.primitives) {
  const geometry = new BufferGeometry();
  for (const [name, index] of Object.entries(primitive.attributes)) geometry.setAttribute(name.toLowerCase(), attribute(index));
  if (primitive.indices !== undefined) geometry.setIndex(attribute(primitive.indices));
  geometry.scale(100, 100, 100);
  const smooth = toCreasedNormals(geometry, Math.PI / 3);
  smooth.scale(.01, .01, .01);
  smooth.computeBoundingBox();
  for (const [name, attr] of Object.entries(smooth.attributes)) {
    const padding = (4 - byteLength % 4) % 4;
    chunks.push(Buffer.alloc(padding));
    byteLength += padding;
    const bytes = Buffer.from(attr.array.buffer, attr.array.byteOffset, attr.array.byteLength);
    const bufferView = gltf.bufferViews.push({ buffer: 0, byteOffset: byteLength, byteLength: bytes.length }) - 1;
    chunks.push(bytes);
    byteLength += bytes.length;
    const accessor = { bufferView, componentType: Number(Object.keys(arrays).find(key => attr.array instanceof arrays[key])), count: attr.count, type: Object.keys(sizes).find(key => sizes[key] === attr.itemSize) };
    if (attr.normalized) accessor.normalized = true;
    if (name === 'position') {
      accessor.min = smooth.boundingBox.min.toArray();
      accessor.max = smooth.boundingBox.max.toArray();
    }
    primitive.attributes[name.toUpperCase()] = gltf.accessors.push(accessor) - 1;
  }
  delete primitive.indices;
}
const padding = (4 - byteLength % 4) % 4;
chunks.push(Buffer.alloc(padding));
byteLength += padding;
gltf.buffers[0].byteLength = byteLength;
const json = Buffer.from(JSON.stringify(gltf));
const jsonPadded = Buffer.concat([json, Buffer.alloc((4 - json.length % 4) % 4, 32)]);
const header = Buffer.alloc(20);
header.write('glTF');
header.writeUInt32LE(2, 4);
header.writeUInt32LE(28 + jsonPadded.length + byteLength, 8);
header.writeUInt32LE(jsonPadded.length, 12);
header.writeUInt32LE(0x4e4f534a, 16);
const binHeader = Buffer.alloc(8);
binHeader.writeUInt32LE(byteLength);
binHeader.writeUInt32LE(0x004e4942, 4);
writeFileSync('public/models/camcorder-prepared.glb', Buffer.concat([header, jsonPadded, binHeader, ...chunks]));
console.log('Prepared camcorder normals.');
