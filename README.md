# Insignia by Lumikai

Event website built with Next.js App Router, strict TypeScript, React, Three.js/React Three Fiber, GSAP ScrollTrigger, native mobile scrolling, Lenis on desktop, and Sanity CMS.

## Development

```sh
npm install
cp .env.example .env.local
npm run dev
```

Configure Sanity using [the CMS guide](docs/sanity-gallery.md). The Studio is available separately at https://insigniacms.sanity.studio/ and embedded at `/studio`. Seed content with `npm run sanity:seed`; write tokens are for local/server tooling only.

## Production

```sh
npm run typecheck
npm test
npm run build
npm start
npm run check:production -- http://localhost:3000
npm audit --omit=dev
```

[Production configuration, SEO, analytics events, Webflow cross-domain setup and release checks](docs/production-readiness.md).

Public URL: https://insignia-lumikai.vercel.app/. Set `NEXT_PUBLIC_SITE_URL` and redeploy when connecting a custom domain. GA4 uses `G-FBKLWYJ4WZ` and is disabled in development, on Vercel previews and on Studio/development routes.

## Architecture

- `src/app`: server-rendered content, metadata, structured data, robots, sitemap and social share image.
- `src/components/experience`: hero/video, About Insignia, spatial gallery, photo dialog and past editions.
- `src/components/three` and `src/lib/three`: model/camera control, LCD video texture, antialiased video boundaries and WebGL lifecycle.
- `src/components/analytics` and `src/lib/analytics.ts`: deferred Google tag, section/interaction/video coverage.
- `src/sanity`: published CMS queries, response normalization and local fallback content.

The canvases render on demand and release owned GPU resources on cleanup. CMS/image failures use local fallbacks. Reduced-motion and accessible HTML alternatives are retained. The camcorder model is credited to omegadarling under CC BY 4.0; see the model inspection/animation documents for source and implementation details.
