import { readFileSync, writeFileSync } from 'node:fs';
import { Box3, Matrix4, Quaternion, Vector3 } from 'three';
const path = process.argv[2] ?? 'public/models/camcorder.glb';
const file = readFileSync(path);
if (file.toString('ascii', 0, 4) !== 'glTF' || file.readUInt32LE(4) !== 2) throw new Error('Expected GLB v2');
const jsonLength = file.readUInt32LE(12);
const gltf = JSON.parse(file.toString('utf8', 20, 20 + jsonLength));
const binary = file.subarray(28 + jsonLength);
const accessors = gltf.accessors;
const bounds = new Box3();
const rows = [];
let triangles = 0;
let vertices = 0;
let primitives = 0;
function visit(index, parentMatrix, parentName = 'Scene', depth = 0) {
  const node = gltf.nodes[index];
  const local = node.matrix ? new Matrix4().fromArray(node.matrix) : new Matrix4().compose(new Vector3(...(node.translation ?? [0,0,0])), new Quaternion(...(node.rotation ?? [0,0,0,1])), new Vector3(...(node.scale ?? [1,1,1])));
  const world = parentMatrix.clone().multiply(local);
  const mesh = gltf.meshes[node.mesh];
  let count = 0, verts = 0;
  const nodeBounds = new Box3();
  for (const p of mesh?.primitives ?? []) {
    if ((p.mode ?? 4) !== 4) throw new Error('Non-triangle primitive requires separate accounting');
    const a = accessors[p.attributes.POSITION];
    if (a.componentType !== 5126 || a.sparse) throw new Error('Unsupported position accessor');
    const view = gltf.bufferViews[a.bufferView];
    for (let i=0;i<a.count;i++) {
      const offset = (view.byteOffset ?? 0) + (a.byteOffset ?? 0) + i * (view.byteStride ?? 12);
      nodeBounds.expandByPoint(new Vector3(binary.readFloatLE(offset),binary.readFloatLE(offset+4),binary.readFloatLE(offset+8)).applyMatrix4(world));
    }
    count += (p.indices === undefined ? a.count : accessors[p.indices].count) / 3;
    verts += a.count;
    primitives++;
  }
  if (!nodeBounds.isEmpty()) bounds.union(nodeBounds);
  triangles += count; vertices += verts;
  rows.push({ index, name: node.name, parent: parentName, mesh: mesh?.name ?? '—', primitives: mesh?.primitives.length ?? 0, vertices: verts, triangles: count, depth, bounds: nodeBounds.isEmpty() ? null : {min:nodeBounds.min.toArray(), max:nodeBounds.max.toArray()}, origin: new Vector3().setFromMatrixPosition(world).toArray() });
  for (const child of node.children ?? []) visit(child, world, `${index}: ${node.name}`, depth+1);
}
for (const index of gltf.scenes[gltf.scene ?? 0].nodes) visit(index,new Matrix4());
const fmt = a => a.map(v => v.toFixed(5)).join(', ');
const materialRows = gltf.materials.map((m,i) => {
  const refs = [];
  function scan(o, path='') { for(const [k,v] of Object.entries(o)) { if(v && typeof v === 'object') {if (k.toLowerCase().endsWith('texture') && Number.isInteger(v.index)) refs.push(`${path}${k} → texture ${v.index} → image ${gltf.textures[v.index].source}`); else scan(v,`${path}${k}.`); } } }
  scan(m);
  return `| ${i} | ${m.name} | ${refs.join('; ') || 'None'} |`;
});
const report = `# INSIGNIA model inspection

Inspected from the replacement camcorder asset on 14 October 2026. Reproduce with \`npm run inspect:model\`. Source: \`/Users/manyaagureja/Downloads/camcorder-2.glb\`; copied unchanged to \`public/models/camcorder.glb\`.

## Summary

- GLB v2; generator: ${gltf.asset.generator}.
- File: **${file.length.toLocaleString('en-US')} bytes (${(file.length/1024/1024).toFixed(2)} MiB)**.
- ${gltf.scenes.length} scene; ${gltf.nodes.length} nodes; ${gltf.meshes.length} mesh definitions; ${primitives} rendered primitives/geometries; ${vertices.toLocaleString('en-US')} position entries summed across primitives (not welded unique vertices).
- **${triangles.toLocaleString('en-US')} triangles**, counted from index accessors for the active scene.
- ${gltf.materials.length} materials, ${gltf.textures.length} texture references, ${gltf.images.length} embedded images; no external image requests required.
- **${gltf.animations?.length ?? 0} animation clips**; ${gltf.skins?.length ?? 0} skins.
- Extensions: ${(gltf.extensionsUsed ?? []).join(', ')}.

## Bounds, orientation, and scale

Exact world-space bounds measured by transforming every POSITION vertex through the full node hierarchy:

- Minimum: (${fmt(bounds.min.toArray())})
- Maximum: (${fmt(bounds.max.toArray())})
- Center: (${fmt(bounds.getCenter(new Vector3()).toArray())})
- Dimensions: (${fmt(bounds.getSize(new Vector3()).toArray())})
- Bounding-box enclosing sphere radius: ${bounds.getSize(new Vector3()).length()/2}.

The glTF coordinate convention is right-handed, +Y up. The source hierarchy contains matrix transforms (including a root scale of approximately 271.77) which are preserved. Physical real-world dimensions are not established by this export; do not assume these values represent a realistically sized camcorder. Semantic front/lens and screen-facing axes cannot be established from generic node names alone. Runtime centers the imported scene using a parent translation, uniformly normalizes its bounding radius to 1, and applies a static 200-degree Y orientation in a separate parent group. Another outer group animates Y from 50 degrees to 0 degrees. Mesh transforms and original materials remain unchanged. Camera framing uses the enclosing sphere horizontally and the invariant height of this Y-only sweep vertically. See docs/hero-animation.md.

## Complete hierarchy and geometry counts

All three mesh nodes share the same name in this file. Indices disambiguate them. Parent column records actual hierarchy; all counts are primitive sums.

| Node | Node name | Parent | Mesh definition | Primitives | Positions | Triangles |
| --- | --- | --- | --- | ---: | ---: | ---: |
${rows.map(r=>`| ${r.index} | ${r.name} | ${r.parent} | ${r.mesh} | ${r.primitives} | ${r.vertices} | ${r.triangles} |`).join('\n')}

## Materials and texture references

| Index | Material name | Texture usage |
| --- | --- | --- |
${materialRows.join('\n')}

| Image | Name | Encoding | Embedded buffer view |
| --- | --- | --- | --- |
${gltf.images.map((im,i)=>`| ${i} | ${im.name ?? '(unnamed)'} | ${im.mimeType} | ${im.bufferView} |`).join('\n')}

The sole material, material0, uses KHR_materials_unlit with an embedded PNG base-color texture. It is intentionally preserved: scene lights do not shade this unlit material. Replacing it with a lit material would alter the supplied appearance.

## LCD assessment

**The LCD cannot be identified reliably from programmatic inspection.** No nodes, materials, or animation channels semantically identify a screen or hinge. The three identically named Model_material0_0 nodes and geometric bounds are not sufficient evidence to label a particular mesh as the LCD.

- A — Separate mesh: unverified.
- B — Part of a larger mesh: unverified.
- C — Already animated: **no**, there are no animation clips.
- D — Hinge/pivot: unverified. Existing parent-child relationships exist, but none is explicitly identified as a hinge. The three mesh nodes are siblings beneath Model; there is no distinct screen/hinge node. Three mesh partitions do not establish semantic separation of the LCD.

Independent LCD control is therefore **not established**. No guessed mesh selectors or fake opening motion were added.

## Blender recommendations and limitations

The user confirms that the LCD is already open; offline textured geometry projections also show the open LCD. Stage 1 rotates the entire model and requires no hinge identification or Blender edits. The three mesh partitions remain untouched. The imported scan has surface geometry underneath the camcorder, a colored LCD image, and a different silhouette from the reference screenshots; these are preserved. Matching the reference object exactly would require a different or edited asset, which is outside this request.

The current asset has a substantial transfer size. Measure load time and GPU behavior on target devices before texture compression or geometry reduction; retain the source asset for visual comparisons. Embedded asset metadata credits omegadarling and declares CC-BY-4.0, with source https://sketchfab.com/3d-models/camcorder-953afa3f7e7e4ad687a0bf19a05ec294. The page includes author/source and license links.

## Implementation scope

Stage 1: one reversible GSAP ScrollTrigger timeline rotates the entire camcorder around world Y. The LCD remains open. Static camera with responsive framing, normalized model hierarchy, warm dark gradient, yellow scroll indicator, DPR capped at 1.5, demand rendering, preload, loading/error fallback, and reduced-motion handling. No controls, hinge animation, video, hotspot, postprocessing, or shadows. See docs/hero-animation.md for tuning and verification limits.
`;
writeFileSync('docs/model-inspection.md',report);
writeFileSync('docs/model-inspection.json',JSON.stringify({fileBytes:file.length,triangles,vertices,primitives,bounds:{min:bounds.min.toArray(),max:bounds.max.toArray()},nodes:rows},null,2));
console.log(JSON.stringify({fileBytes:file.length,triangles,vertices,primitives,bounds:{min:bounds.min.toArray(),max:bounds.max.toArray()}}));
