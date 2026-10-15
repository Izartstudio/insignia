# Who’s Been At Insignia

Mounted between InsigniaIntroduction and PastEditions. Existing hero/video logic is untouched.

## Files
- `src/components/experience/spatial-gallery/SpatialGallery.tsx`: section, single master ScrollTrigger, semantic fallback, overlays, pointer input, visibility tracking.
- `SpatialGalleryScene.tsx`: one demand-rendered R3F canvas scene, four depth groups, owned texture loading and disposal, camera composition.
- `GalleryEnvironment.tsx`: fullscreen gradient shader and original grid texture.
- `layout.ts`: design-space to perspective-world mapping.
- `spatial-gallery.css`: overlay typography, responsive UI, static fallback.
- `src/content/spatial-gallery.ts`: all photos, reference rectangles, depth offsets, gradient radii, timing and exploration limits.
- `public/assets/insignia/people/`: nine supplied PNGs plus the extracted SVG grid.
- `src/components/experience/InsigniaExperience.tsx`: integration.

## Geometry and motion
Reference size is 1440 × 900 for each state. Rectangle centers are normalized to this design space. Visible world height at each photograph is `2 * (8 - depthOffset) * tan(40° / 2)`; visible width is that height times viewport aspect. Texture aspect ratios determine plane height, preventing stretching. Reference photo slots include an allowance for the supplied PNG shadow borders.

Camera keyframes: `(0,0,8)`, `(0,0,-8)`, `(0,0,-24)`, `(0,0,-40)`. Groups occupy z = 0, -16, -32, -48. The camera always faces -Z. Outgoing photographs enlarge in perspective and pass behind the near plane; they are not scaled to fake travel. Distant incoming groups fade gently with distance, supplementing the real camera movement.

The one scrubbed timeline has explicit category/exit labels, holds at 0–15%, 30–40%, 55–65%, 80–100%, and travel in between. Reverse scrolling reverses the same timeline. Scroll distance is 4.5 section heights. Adjust `galleryConfig` and state data to tune.

Cursor exploration adds damped x/y offsets to the scroll-controlled z coordinate; it never writes scroll travel. Limits: x ±0.38, y ±0.2, damping 7. Coarse pointers remain centered and the cursor instruction is hidden. No touch gesture handler interferes with vertical scrolling.

## Background and UI
The SVG’s radial gradient uses #FE8C01 → #AA0009 at 36.8333% → black. Normalized ellipse radii are 1075.5/900, 732/900, 626/900, and 450/900. The shader interpolates radii with camera travel. The grid uses original SVG paths and mask, with subtle expansion during travel and a damped lateral offset. No bloom/postprocessing.

HTML overlays fade on the master timeline. The current progress label and yellow tick are coordinated with those transitions, with no additional ScrollTrigger. The existing ScrollIndicator is reused. The navbar remains shared.

## Responsive / lifecycle
Desktop mapping follows the reference coordinates. Portrait viewports use deterministic mobile photo placements rather than shrinking the desktop scene. Typography and UI use responsive CSS. Resize changes world mapping, preserving scroll travel. The canvas has DPR 1–1.5, demand rendering, and only schedules settling frames while visible. Texture resources, geometries/materials, listeners, observer and timeline are cleaned up. There are no React state updates on scroll frames.

Reduced motion and WebGL failures render all four categories in normal flow with real HTML images. A screen-reader representation remains available in animated mode. The fallback does not pin.

## Validation and known differences
Production build and TypeScript pass. Projection calculations and aspect ratios were checked at 1440×900, 1920×1080, 3440×1440, 1024×768, 768×1024, 390×844, 375×667, 844×390. Asset paths and outgoing-camera depth were checked.

Browser rendering, GPU shader output, visual alignment, and actual mobile performance still require browser verification. These checks are not claimed as completed. The supplied small PNGs are reused across categories as requested; enlarging them during travel can reveal their source resolution. Portrait mobile layouts are adapted, since only desktop reference layouts were supplied. Photograph border allowance, typography rendering and overlay/photo occlusion may differ slightly from Figma. Exact supplied gradient stops and original grid artwork are used.

## Leaders correction — 15 October

Confirmed in the browser: the original two-row screenshot was the static fallback, not the intended WebGL scene. A component passed as Canvas fallback called onFailure in useEffect; React mounts canvas fallback children even when WebGL works. Removed that effect; the error boundary remains responsible for actual render failures.

The extracted grid lost the source SVG root's `fill="none"`. This filled open paths as polygons. Restored the inherited fill and generated a line-opacity mask from the same grid paths. The shader now explicitly converts its sRGB-interpolated colors through Three's output color conversion.

Leaders now uses nine exact cropped photographs extracted from the supplied SVG, including the separate hand-gesturing speaker image. Explicit reference rectangles determine both plane width and height; centered UV cover preserves photo proportions on other aspect ratios. Leaders has explicit per-photo mobile positions, not index-based placement. Other category photo configurations were not corrected in this pass.

Development preview: `/dev/leaders?galleryPreview=leaders`. This route returns not-found in production. Camera travel and automatic pointer exploration are disabled in the preview, so it opens at the Leaders keyframe. User-requested horizontal dragging remains available, preserving the keyframe depth.

Dragging pans the entire viewpoint, not individual image meshes or DOM canvas transforms. Each category stores its own bounded horizontal pan (±35% of viewport world width). Scroll travel interpolates between those offsets without controlling them. Release retains the pan. Pointer capture, pointer cancellation and lost capture are handled; `touch-action: pan-y` preserves vertical scroll intent.

Verified actual rendering at 1440×900, no runtime errors in the isolated preview, horizontal dragging in both directions, unchanged section position during drag, and clean release. Saved `leaders-preview.jpg` and `leaders-dragged.jpg`. Browser view includes the site's shared navbar, which is absent in the Figma scene-only reference. Text/photograph overlap remains an HTML-overlay difference from Figma's layer ordering; no claim of pixel-exact matching. Full mobile touch and full camera-journey regression were not browser-verified in this correction pass.

## Infinite worlds update

- All four states use exact photograph crops extracted from the supplied master SVG. No missing-photo substitutions remain in these reference tiles.
- `InfiniteCanvasPlane.tsx` uses one instanced draw per photograph, shared plane geometry and one material per photograph. A frustum-derived integer tile range is rebuilt into a bounded instance buffer without React updates or texture loading during dragging. Tile spacing includes negative-space margins so adjacent copies do not intrude into the reference frame.
- Desktop pointer deltas independently update each world's unbounded X/Y coordinates. The master timeline still exclusively controls travel. A single frame callback composes damped X/Y with Z; transitions interpolate remembered world coordinates. Dragging is suspended during active depth travel.
- Touch horizontal exploration preserves native one-finger vertical scrolling (`touch-action: pan-y`). Full vertical/diagonal exploration is available with mouse/pen; no touch-only free-pan mode was added.
- The procedural curved grid repeats without texture boundaries and moves with exploration. The glow's small sinusoidal displacement stays bounded even after long drags. State-specific radii interpolate through depth.
- Development-only preview supports `?galleryPreview=leaders|founders|experts|investors` on `/dev/leaders`. Without the query it exercises the normal master timeline.
- Verified all four desktop resting frames, long diagonal drags across tiles, reverse scroll restoring Leaders, mobile portrait sizing and ultrawide coverage in the browser. No console errors observed. Physical touchscreen behavior has not been device-tested. The procedural grid is an approximation of the original curves; HTML category text still draws above photographs.

## Explored-world coverage

The opening tile remains the exact SVG composition. Once the camera moves beyond it, neighboring tiles use deterministic photo placement permutations and jitter. A staggered, recycled photo field fills the joins between those larger tiles; cells inside the initial reference frame are skipped. This avoids large empty patches after long drags without random jumps, extra texture loads, or changes to the starting frame.
