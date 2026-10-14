# INSIGNIA

Stage 1 scroll-driven camcorder hero for Lumikai. Next.js App Router, strict TypeScript, React Three Fiber, Drei, Three.js and Tailwind CSS. GSAP and ScrollTrigger drive one reversible, pinned hero rotation.

## Run

```sh
npm install
npm run dev
```

Open the URL printed by Next.js. Production checks: `npm run typecheck` and `npm run build`. Reproduce the model inventory with `npm run inspect:model`.

## Architecture

- `InsigniaExperience`: client-only canvas loading, page shell and error boundary.
- `ExperienceCanvas`: persistent demand-rendered canvas, DPR cap, loading and WebGL fallback.
- `CamcorderModel`: cached GLB, cloned object hierarchy, original shared materials/geometries, measured parent centering.
- `CameraRig`: fixed view and responsive framing for the Y-axis rotation. Updates only on camera/bounds/viewport changes.
- `SceneLighting`: hemisphere and directional lights without shadow maps.
- `src/config/scene.ts`: camera, lighting, model URL and renderer settings.
- `docs/model-inspection.md`: asset evidence and unresolved LCD structure.

The useGLTF cache owns shared geometry/material/texture resources; model unmounts deliberately do not dispose those cached resources. The canvas owns its renderer lifecycle. The GSAP timeline invalidates the demand-rendered canvas while scrubbing. No frame-by-frame React state, manual controls, remote textures, or postprocessing are used. ScrollTrigger and reduced-motion listeners are reverted on unmount.

The source GLB is copied unchanged. No LCD part is targeted until its identity and pivot are verified. Video playback, LCD zoom and deployment are outside this phase. See `docs/hero-animation.md` for Stage 1 settings.

## Verification

Production build and strict TypeScript checks passed. Dependency installation reported zero known vulnerabilities after upgrading to Next.js 16.4.0. SHA-256 comparison confirms the public GLB matches the source byte-for-byte.

Browser access to the local preview was denied in this session, so rendered appearance, loading/error behavior and physical-device responsiveness still require visual QA. Framing accounts for aspect ratio mathematically; no claim of device testing is made.

## Current asset

The replacement `/Users/manyaagureja/Downloads/camcorder-2.glb` is copied unchanged to `public/models/camcorder.glb`. Its URL includes a content-hash revision to invalidate the previous useGLTF/browser cache. It contains 199,999 triangles and is 7.34 MiB; mobile transfer performance needs measurement before release. Its original `KHR_materials_unlit` material intentionally does not respond to scene lighting. Embedded metadata credits omegadarling under CC BY 4.0; attribution is displayed on the page. LCD geometry and hinge control remain unverified.
