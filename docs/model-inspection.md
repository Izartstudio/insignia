# INSIGNIA model inspection

Inspected from the replacement camcorder asset on 14 October 2026. Reproduce with `npm run inspect:model`. Source: `/Users/manyaagureja/Downloads/camcorder-2.glb`; copied unchanged to `public/models/camcorder.glb`.

## Summary

- GLB v2; generator: Sketchfab-12.65.0.
- File: **7,699,456 bytes (7.34 MiB)**.
- 1 scene; 7 nodes; 3 mesh definitions; 3 rendered primitives/geometries; 131,704 position entries summed across primitives (not welded unique vertices).
- **199,999 triangles**, counted from index accessors for the active scene.
- 1 materials, 1 texture references, 1 embedded images; no external image requests required.
- **0 animation clips**; 0 skins.
- Extensions: KHR_materials_unlit.

## Bounds, orientation, and scale

Exact world-space bounds measured by transforming every POSITION vertex through the full node hierarchy:

- Minimum: (3576.36445, -278.43891, -769.35125)
- Maximum: (4858.11118, 470.41801, 570.91695)
- Center: (4217.23782, 95.98955, -99.21715)
- Dimensions: (1281.74673, 748.85692, 1340.26820)
- Bounding-box enclosing sphere radius: 999.9975276821963.

The glTF coordinate convention is right-handed, +Y up. The source hierarchy contains matrix transforms (including a root scale of approximately 271.77) which are preserved. Physical real-world dimensions are not established by this export; do not assume these values represent a realistically sized camcorder. Semantic front/lens and screen-facing axes cannot be established from generic node names alone. Runtime centers the imported scene using a parent translation, uniformly normalizes its bounding radius to 1, and applies a static 200-degree Y orientation in a separate parent group. Another outer group animates Y from 50 degrees to 0 degrees. Mesh transforms and original materials remain unchanged. Camera framing uses the enclosing sphere horizontally and the invariant height of this Y-only sweep vertically. See docs/hero-animation.md.

## Complete hierarchy and geometry counts

All three mesh nodes share the same name in this file. Indices disambiguate them. Parent column records actual hierarchy; all counts are primitive sums.

| Node | Node name | Parent | Mesh definition | Primitives | Positions | Triangles |
| --- | --- | --- | --- | ---: | ---: | ---: |
| 0 | Sketchfab_model | Scene | — | 0 | 0 | 0 |
| 1 | billyCam_v011_6-12_200K.fbx | 0: Sketchfab_model | — | 0 | 0 | 0 |
| 2 | RootNode | 1: billyCam_v011_6-12_200K.fbx | — | 0 | 0 | 0 |
| 3 | Model | 2: RootNode | — | 0 | 0 | 0 |
| 4 | Model_material0_0 | 3: Model | Model_material0_0 | 1 | 65532 | 107769 |
| 5 | Model_material0_0 | 3: Model | Model_material0_0 | 1 | 65533 | 91857 |
| 6 | Model_material0_0 | 3: Model | Model_material0_0 | 1 | 639 | 373 |

## Materials and texture references

| Index | Material name | Texture usage |
| --- | --- | --- |
| 0 | material0 | pbrMetallicRoughness.baseColorTexture → texture 0 → image 0 |

| Image | Name | Encoding | Embedded buffer view |
| --- | --- | --- | --- |
| 0 | (unnamed) | image/png | 3 |

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
