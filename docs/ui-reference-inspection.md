# Hero UI: reference inspection and integration

## Sources and verification method

Inspected the supplied `Herobg.svg`, `nav.svg`, and `scrollindicator.svg`, plus downloaded HTML, CSS, custom GSAP scripts, Webflow interaction definitions and Lottie JSON from:

- https://lumikai.webflow.io/
- https://lumikai.webflow.io/the-team
- Shared CSS: `lumikai.webflow.shared.d797709da.min.css`
- Interaction bundle: `webflow.schunk.2087d8f04cdf0d9f.js`
- Menu asset: `6aba892753c1f5ce3e724be4_lottieflow-menu-nav-04-000000-easey.json`

This is source-level verification, not a live browser observation. Browser/device appearance, keyboard interaction, actual hover timing and mobile scrolling still need visual/interactive QA. The production Webpack build and TypeScript check pass. No browser screenshot or device testing is claimed.

## Background

`HeroBackground` renders the original SVG unchanged as a centered, cover-sized CSS background. Its 1440×810 viewBox, 25% glow opacity, 175-unit static blur and original radial stops are retained. Cover preserves aspect ratio and crops sides on portrait screens rather than stretching. No JS, Three.js plane, animated filter or extra canvas is involved. The existing transparent R3F canvas remains untouched.

## Navbar

`Navbar` is mounted once in `src/app/layout.tsx`, outside the pinned hero. Original vector logo and outlined desktop glyphs are extracted from nav.svg. Desktop cells retain 129.25×56 dimensions; the menu block retains its 76×67 outline and 16×12 resting hamburger. No white presentation background is added.

Published reference behavior reproduced:

- Fixed navbar; no navbar entrance tween found in the inspected definitions.
- Logo alone hides to yPercent -200 on downward scroll beyond 50px, ignoring movements below 2px. It returns upward. Duration .5s, power3.out; cells stay fixed.
- Link characters roll upward with a duplicated row: .4s power2.in, .02s stagger. SVG glyphs preserve supplied typography. CSS cubic-bezier(1/3,0,2/3,0) reproduces cubic power2.in. Mouse exit reverses to the original row. Keyboard focus gets the same reveal plus a visible outline.
- No menu-button hover tween or link background-color tween was found; none was invented.
- Menu backdrop: opacity 0→1, .65s power2.out. Its blur remains static.
- Right panel: xPercent 100→0, 1s expo.out.
- Menu logo: xPercent 100→0 and opacity, .75s at .3s, power3.out.
- Links: xPercent 50→0 and opacity, .8s at .38s, stagger .055s, power3.out.
- Pitch link: opacity over .7s at .93s. Total timeline 1.63s.
- Closing reverses the timeline at timeScale 1.5. Scroll lock is released on completion; immediate close and reduced-motion paths also release it.
- Authored Lottie icon: tween current frame to half its total frames on open, back to zero on close, power3.inOut, synchronized to menu duration/close speed. The supplied SVG hamburger is shown at rest; the reference SVG player is lazy-loaded for the transition.

One dependency, `lottie-web`, was added because the reference uses authored multi-path/trim animations that a generic hamburger morph would not reproduce. Only its SVG player is imported. Instances and tweens are destroyed on unmount. The supplied icon remains a functional menu button if animation loading fails.

Navigation destinations are centralized in `src/config/navigation.ts`. Existing reference paths are preserved on the provided Webflow origin; only Insignia points to the existing local `/` route through Next.js Link. No placeholder pages were created. The menu includes the reference's Pixels, Research, Media, Contact Us and Pitch To Us links.

Accessibility: explicit labels/expanded state, Escape and backdrop dismissal, focus containment/restoration, inert hidden menu/background, navigation closes the menu, and live reduced-motion handling. No React frame updates.

## Scroll indicator

The supplied 83×53 SVG geometry and outlined SCROLL text are preserved. A nested SVG clips the moving 2×12 yellow rectangle to the supplied 2×20 dim track.

Webflow action list `a-17` (`line-scroll`) has an initial y=-110%, then a linear move to y=550% over 2000ms, followed by an instantaneous reset. PAGE_START loops it at all breakpoints. No repeat delay, line fade, scale or text motion is specified. The CSS keyframes reproduce those values; the supplied SVG's shorter track is retained rather than adopting Webflow's 50px track. This means the visible travel/hidden part of each cycle differs from the source site's taller design, intentionally prioritizing the supplied SVG.

The indicator is hero-scoped, at the existing bottom-center offset with safe-area clearance. It remains present while the camcorder rotates, uses no ScrollTrigger, and is static under reduced motion.

## Responsive layout and known differences

Desktop navigation fits 1440, 1280 and 1024 widths. At <=991px the cells hide, matching the reference CSS, and navigation remains available in the menu. At <=767px the logo is 82×25 and button 60×50, with a full-width panel. This covers the requested 768, 390 and 375 layouts without shrinking desktop text. These are CSS/layout checks, not browser measurements. The panel independently scrolls on short viewports.

Remaining differences: drawer text uses the existing app font (no licensed Webflow font was supplied); the resting menu icon follows nav.svg while its motion follows the reference Lottie; portrait background crops the supplied artwork; shortened SVG line-track changes its visible travel fraction. Actual interaction fidelity has not been visually verified. No camcorder source, orientation, camera, GLB, timeline or hero scroll duration was changed.

## File inventory

Created:
- `src/components/experience/HeroBackground.tsx`
- `src/components/experience/ScrollIndicator.tsx`
- `src/components/layout/Navbar.tsx`
- `src/components/layout/NavLabel.tsx`
- `src/components/layout/MenuIcon.tsx`
- `src/components/layout/navArtwork.ts`
- `src/components/layout/ui.css`
- `src/config/navigation.ts`
- `src/types/lottie-svg.d.ts`
- `public/assets/insignia/{hero-background,nav-reference,scroll-reference,lumikai-logo}.svg`
- `public/assets/insignia/menu-motion.json`
- This report.

Modified: `src/app/layout.tsx`, `src/app/globals.css`, `src/components/experience/InsigniaExperience.tsx`, `package.json`, `package-lock.json`.

Stacking tokens: background 0, canvas 1, indicator 2, shared navbar 100. Decorative elements do not intercept pointer input. The hero animation remains the sole ScrollTrigger.
