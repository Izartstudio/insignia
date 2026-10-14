# LCD video playback

## Files

Created: `src/components/three/LCDVideoSurface.tsx`, `src/lib/three/useLCDVideo.ts`, `src/lib/three/lcd-config.ts`, `src/lib/three/lcd-surface.json`, `public/videos/insignia-film.mp4`, `public/videos/insignia-poster.jpg`, `docs/lcd-measurements.json`, `docs/diagnostics/lcd-endpoint-projections.jpg`, this report.

Modified: `CamcorderModel.tsx` to mount the display beneath the existing centering/orientation/animation hierarchy; `ExperienceCanvas.tsx` to own the persistent video resource and show a small playback recovery button only when blocked/failed. Resource-disposal suppression is restricted to the cached GLB primitive so the LCD's own materials can be released normally.

No GLB, camera, hero style, navbar, scroll indicator, or GSAP timeline changes. No new dependencies. No zoom/fullscreen stage.

## Video

- Public URL: `/videos/insignia-film.mp4`
- Source: `Insignia Reel 2024-2.mp4`, copied byte-for-byte; not re-encoded.
- 1920×1080, 16:9, 25 fps.
- 340.202 seconds (5m 40.202s).
- H.264 High profile, level 4.0, yuv420p; AAC-LC audio (playback muted).
- 135,075,145 bytes (128.82 MiB), approximately 3.18 Mbps total.
- First decoded frame extracted as a JPEG poster; this does not change the video.

The codecs are conventional browser formats, but actual device decoding and autoplay have not been browser-tested. The `moov` atom is at offset 134,821,126, after media data; the deployment should support HTTP byte ranges. Without ranges, startup may require a large download. Preload is a browser hint; data-saver/low-power policies can delay or block playback. Fast-start remuxing could improve loading later without video re-encoding, but was not performed because the supplied asset is preserved.

## LCD identification and geometry

There is no dedicated, semantically named LCD mesh. The existing textured scan was projected at 225° Y with an orthographic scale of 1200 pixels per normalized unit, origin (1000,500), in a 2000×1000 diagnostic. The visible inner display boundary was traced at TL (437,410), TR (846,401), BR (862,724), BL (459,734). This is visual calibration tied to actual triangle intersections, not guessed world coordinates or a mesh-name assumption.

Boundary points were barycentrically intersected with source triangles. Their right/up directions establish the local basis. Front-facing source triangles within 18 source units of the fitted plane were clipped against that inner quadrilateral. The resulting **2,562-triangle conforming patch** follows the original uneven LCD surface (depth range −9.024 to +7.532 source units); it avoids the interference a flat plane would create. The GLB itself remains untouched. A projected homography gives the patch continuous display UVs.

The boundary is a calibrated estimate of a rough scanned bezel, not a manufacturer CAD measurement. It has been checked in offline textured projections at both hero endpoints. Live WebGL alignment and mobile playback remain unverified. The diagnostic image uses per-triangle color sampling, so its visible faceting is not representative of the browser's interpolated video texture.

## Transform values

All coordinates are in imported scene space **before** the existing centering/normalization groups:

- Position: `[4366.015793876227, 39.94788650070651, 163.30531570081564]`
- XYZ Euler rotation (radians): `[-3.0560346726736958, 0.42082953334677725, 3.1284911275409004]`
- Nominal width: `362.2674116025298`
- Nominal height: `270.5377278367416`
- Outward normal: `[0.4085177504020743, 0.07799783831204299, -0.9094116696112255]`
- Normal offset: `0.75` source units, about 0.00075 after normalization; the source-derived surface relief is retained.

One parent scene graph drives the GLB and video surface. There are no per-viewport coordinates, scroll setters, video seeks, or additional timelines. Width/height are calibration dimensions of the conforming patch, not a replacement primitive for the camcorder.

## Aspect ratio, material and rendering

The measured display ratio is approximately 1.3391. A centered cover crop uses approximately 75.32% of the video's horizontal extent and all of its height. There is no aspect stretching. UV top maps to video top; default texture flipY is retained. Both the poster and video use identical UVs.

The video uses `VideoTexture`, sRGB color space, linear min/mag filtering, clamp-to-edge and no mipmaps. The `MeshBasicMaterial` is unlit with tone mapping disabled and depth testing retained. A small normal offset plus negative polygon offset prevents z-fighting without making the screen float.

The existing demand-rendered canvas is invalidated on decoded video frames with requestVideoFrameCallback. A requestAnimationFrame fallback runs only while playing on browsers without that callback. Neither path updates React state per frame. This is necessary for playback to continue when scroll motion stops.

## Lifecycle and future reuse

`useLCDVideo` owns one HTMLVideoElement and one VideoTexture per live mount. It sets autoplay, muted/defaultMuted, loop, playsInline and preload=auto before assigning the source and calling play(). Playback starts at the file beginning; rotation/resize/refresh do not recreate, seek or restart it. React updates occur only for resource/readiness/playback status events.

`resource.video` is the existing element future fullscreen presentation can reuse; no second player or synchronization scheme is introduced. The hook belongs to the persistent experience canvas, not the rotating group. A later transition must retain this owner while moving presentation.

Cleanup removes listeners, cancels frame callbacks, pauses the video, removes its source, resets media loading and disposes the video/poster textures. The custom geometry is disposed explicitly; R3F disposes the attached LCD material. Shared GLB resources remain protected. Effect setup creates fresh owned resources following Strict Mode cleanup, and async callbacks check disposal before publishing state.

Autoplay rejection preserves the poster/decoded frame and exposes a small, keyboard-accessible “Play film” button. Media errors expose “Retry film”. Both act on the same video element. No visible HTML video overlay or normal-playback controls are added.

## Calibration

Edit `src/lib/three/lcd-config.ts` and reload the development scene. Position X/Y/Z, XYZ rotation in radians, width, height and normal offset are centralized. The mesh's X/Y coordinates are normalized to its measured dimensions; Z retains measured relief. Do not compensate for viewport size in this configuration.

Set `debug.enabled = true` in development to display a wireframe, nominal rectangle outline, local axes, outward normal arrow and an upright labeled checkerboard UV pattern. Flags can be enabled individually. The compile-time NODE_ENV check disables every debug visual in production even if the config flag is left on. The outline is nominal; the actual patch follows the measured quadrilateral and scan relief.

## Validation and limits

Production Webpack build and strict TypeScript pass. Checked finite geometry coordinates, UV bounds, source-file checksums and offline projections at initial/final orientations. Because the patch shares the entire transform hierarchy, attachment is independent of viewport framing. Browser playback, actual GPU depth behavior and portrait/landscape device performance still require interactive QA; no such tests are claimed. The large file and scan's irregular boundaries are the remaining practical limitations.

## Film audio

The hero provides an Enable sound / Mute sound control. It changes the existing video element's muted property; the MP4's AAC soundtrack stays synchronized with its video. Initial autoplay remains muted for browser compatibility. Enabling sound calls play() directly within the button gesture without seeking, replacing the source or creating another audio player. The control tracks volumechange events and is keyboard accessible. A rejected play request exposes the existing playback recovery control.
