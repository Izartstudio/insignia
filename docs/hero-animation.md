# Hero camera sequence

The existing scene architecture is retained. No dependencies were added and the optimized GLB was not changed.

## Orientation evidence and reference limits

Inspected the existing report, full GLB node matrices, and textured software projections at eight Y angles. After the imported hierarchy is applied, world +Y is upright. Views at 250° and 200° show the LCD on the left and move from a side/three-quarter view to a rear-facing battery view respectively. The existing camera's diagonal direction is replaced by a fixed +Z camera so world Y maps to a screen-vertical rotation axis.

The asset is a different scanned camcorder from Hero-1.png/Hero-2.png. Its colored screen, silver body, strap and scanned surface beneath it prevent an exact silhouette/appearance match. Materials, LCD and scan geometry are preserved. No Blender edits are necessary for this rotation. The checkout contains only an INSIGNIA / By Lumikai masthead, not the reference navbar; that existing copy is preserved. Existing asset attribution remains below the hero.

## Transform hierarchy

1. Animation group: `[0, 50°, 0]` → `[0, 0°, 0]` (XYZ Euler).
2. Static orientation group: `[0, 200°, 0]`; uniform scale `1 / measuredRadius`.
3. Centering group: negative world-space GLB bounding-box center.
4. Unchanged cloned source object hierarchy; shared original geometry/materials.

Total parent rotation relative to the imported scene: `[0, 250°, 0]` → `[0, 200°, 0]`. In radians, animation Y is `0.8726646259971648 → 0`; static Y is `3.490658503988659`. This remains a continuous -50° Y sweep. After it settles, the perspective camera follows the calibrated LCD normal and the LCD's existing video surface covers the viewport.

## Fine-tuning

`src/config/scene.ts` centralizes:

- `model.orientation`: constant orientation correction.
- `model.normalizedRadius`: normalization target (1).
- `hero.rotation.initialY` / `finalY`: animated endpoints in radians.
- `hero.scroll.start`: `top top`.
- `hero.scroll.distanceInViewports`: `3`; end is `+=section.clientHeight * 3` (300% of the hero height).
- `hero.scroll.scrub`: `1` second smoothing.
- Camera: 28° perspective FOV, +Z direction, target `[0, 0.08, 0]`, base distance 3.6 normalized radii. Aspect-aware horizontal sphere fit and vertical-height/depth clearance increase distance when necessary. The Y-only motion preserves height. If a later stage introduces X/Z rotation, extend the framing calculation for that motion.
- DPR: `[1, 1.5]`.

`src/lib/animations/camcorderTimeline.ts` creates the one timeline, with `pin: true`, `pinSpacing: false`, `anticipatePin: 1`, `invalidateOnRefresh: true`, and linear timeline segments. The model rotation ends at 35%, zoom starts at 45%, and the scroll indicator fades from 88%. A track reserves 400svh before the asset loads. The final camera pose is recomputed from the LCD world position, quaternion, scale and surface normal on refresh. The screen's projected width and height determine the closest cover-framed camera distance for the current aspect ratio. Camera position follows a two-segment path; its quaternion uses smooth interpolation to finish perpendicular to the LCD. GSAP owns scroll/resize handling; media/context cleanup removes the timeline, pin and listeners on unmount. React state is not used for frame updates.

The LCD surface, HTMLVideoElement and VideoTexture stay mounted throughout the sequence. Fullscreen is the same WebGL surface at the same playback position. Reverse scrolling changes only model and camera transforms; it never seeks, reloads or restarts the film.

Reduced-motion preference displays the final pose without pinning or extra scroll distance. Preference changes are handled through GSAP matchMedia and cleaned up with the context.

## Changed files

- `src/config/scene.ts`: centralized transforms, scroll settings, framing and DPR.
- `src/lib/animations/camcorderTimeline.ts`: new timeline factory and cleanup.
- `src/components/three/CamcorderModel.tsx`: separate animation/orientation/centering groups.
- `src/components/three/CameraRig.tsx`: fixed +Z view and responsive framing.
- `src/lib/three/modelUtils.ts`: measured half-height for framing.
- `src/components/experience/ExperienceCanvas.tsx`: transparent canvas and hero ref plumbing.
- `src/components/experience/InsigniaExperience.tsx`: reserved scroll track, pinned section, indicator and existing attribution.
- `src/app/globals.css`: gradient, scroll indicator and reduced-motion layout.
- `scripts/inspect-model.mjs`, `docs/model-inspection.md`, `README.md`: current implementation notes.

## Verification

- Production build with `npm run build -- --webpack` passed, including strict TypeScript.
- Projected every vertex at 51 steps through the sweep for 1440×810, 1024×768, 768×1024, 390×844, 844×390, and 320×568. All vertices remain inside the camera frustum. Largest horizontal absolute NDC was 0.796; largest vertical absolute NDC was 0.594 (visible range is -1 to 1).
- Inspected offline textured projections of both endpoint poses. These are geometry diagnostics, not browser screenshots.
- Browser access was previously denied in this chat; live scrolling, pinning, reduced-motion switching and actual mobile GPU performance still require browser/device QA. No claim of pixel-exact reference matching is made.
