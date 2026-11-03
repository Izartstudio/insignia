# Cloudflare Pages launch: insignia.lumikai.com

This is an independent static site. The main Lumikai website keeps its existing hosting and DNS. Navigation links use the live https://www.lumikai.com domain and the verified `/people` route. The unavailable Research staging entry is replaced by verified About Us (menu) and Media (footer) links. Analytics no longer decorates links to the Webflow staging domain.

## Build settings

Create a Cloudflare **Pages** project connected to this repository (not a Workers full-stack Next.js preset).

- Production branch: `main` (or set `PRODUCTION_BRANCH` to your actual branch).
- Build command: `npm run build:cloudflare`
- Output directory: `out`
- Node version: `22` (minimum 22.12).
- Production environment: `NEXT_PUBLIC_SITE_URL=https://insignia.lumikai.com`; published Sanity project ID and dataset from `.env.example`; the intended `NEXT_PUBLIC_GA_MEASUREMENT_ID`.
- Preview environment: set `SITE_INDEXABLE=false`. Branch previews are also detected through `CF_PAGES_BRANCH`.
- Do not upload `.env.local` or set a Sanity write token in the website's public environment.

The export contains HTML, JS, media, robots, sitemap, sharing image and Pages `_headers`. There is no Next.js server or image optimization endpoint to provision. Assets above Pages' 25 MiB per-file limit fail the build. The current movie and GLB assets fit this limit.

Sanity content and published images are fetched at build time. Images are bounded to 1600 pixels and copied to content-hashed `/cms/` assets on the website, so WebGL does not depend on Sanity CORS permissions or runtime image requests. **Publishing CMS content requires a Pages rebuild** (configure a Sanity webhook to a private Pages deploy hook if automatic publishing is required). Cloudflare builds fail if the Sanity project is missing, published gallery records are invalid, or CMS/image requests fail; they do not silently publish fallback attendee names. Local development retains fallback content. Each export requests a fresh published snapshot from the origin API, independent of restored Next build caches. Inspect published content in the preview before promoting a build. The standalone CMS remains https://insigniacms.sanity.studio/; use that for deep Studio links. The public website does not host a second Studio: `/studio` and its deep links redirect to the existing standalone CMS.

## Squarespace DNS

1. Deploy the Pages project and note its exact `<project>.pages.dev` hostname.
2. In Pages → Custom domains, add `insignia.lumikai.com` **before** creating the DNS record.
3. In Squarespace DNS, add a CNAME with host `insignia` and value `<project>.pages.dev` (no `https://`, slash or path). Remove only conflicting records for the `insignia` host if any exist.
4. Keep all apex (`@`), `www`, MX, TXT and unrelated DNS records unchanged. No nameserver transfer is needed for this subdomain setup.
5. Wait until Pages reports the custom domain active and the HTTPS certificate issued. Restrictive CAA records may need adjustment according to Cloudflare's certificate guidance.
6. Verify https://insignia.lumikai.com and its certificate, then run `NEXT_PUBLIC_SITE_URL=https://insignia.lumikai.com npm run check:production -- https://insignia.lumikai.com`.

Do not add a wildcard SPA rewrite to `index.html`: unknown URLs must stay 404 for SEO. Do not enable Cloudflare Rocket Loader on this application. Use the built-in compression/CDN and retain MP4 fast-start metadata. Pages currently serves full HTTP 200 responses to Range requests; the production check accepts that documented behavior as well as partial 206 responses. Avoid long immutable caching on unversioned model/video filenames; their headers permit updates after redeployment.

## Launch verification

Run `npm run typecheck`, `npm test`, `npm audit --omit=dev --audit-level=moderate`, `npm run build:cloudflare`, and `npm run check:export` before publishing. CI runs these as well.

After DNS/HTTPS are active, run the production HTTP check above and PageSpeed Insights on the public domain. Verify mobile Safari and Android Chrome: hero rotation and LCD movie, resize/orientation changes, menu, all gallery categories, portrait dialog and escape/close, gallery exit, edition arrows, reduced motion and WebGL-disabled fallback. Check slow networks and blocked autoplay: the poster remains usable and the loader must release scrolling within 8.6 seconds. No code-only check can guarantee every GPU/browser or real-world Core Web Vitals.

Preview domains must return noindex. Submit the production sitemap to Search Console. Confirm the intended Analytics property receives events; its existing ID remains configurable and independent of the corporate site's configuration.

Sources: https://developers.cloudflare.com/pages/framework-guides/nextjs/deploy-a-static-nextjs-site/ and https://developers.cloudflare.com/pages/configuration/custom-domains/.

## Automatic CMS rebuilds

1. In the Pages project, open Settings → Builds & deployments → Deploy hooks. Create a production hook for your production branch and copy its URL.
2. In Sanity Manage → your project → API → Webhooks, add a webhook targeting that URL, using the website dataset, POST method and create/update/delete triggers. Keep draft and version events disabled so editing an unpublished draft does not rebuild the site.
3. Use this GROQ filter: `_id in ["spatialGalleryDesktop", "spatialGalleryMobile", "pastEditions"]` for this site's current documents.
4. Keep the hook URL private. It triggers builds and belongs in Sanity's webhook settings, never source code or NEXT_PUBLIC variables.
5. Publish one small change in the existing Studio; confirm a Pages deployment starts, succeeds, and the live site reflects it. A failed build leaves the previous deployment live.

Without a webhook, trigger a production rebuild manually in Pages after publishing CMS edits.

## Completed local audit

- Strict TypeScript and production export passed; 12 automated tests passed.
- npm production security audit: zero known vulnerabilities at audit time.
- Cloudflare local Pages runtime: seven HTTP checks passed (SEO, discovery, social image, dev route exclusion, standalone Studio redirect, real 404s, model/movie delivery).
- Export validation: 74 same-origin asset references checked; 48 CMS image snapshots total approximately 4.8 MiB. Private Sanity token absent from 238 exported text assets.
- Browser preview: camcorder and LCD film rendered; mobile animated gallery portraits, category navigation, portrait dialog and gallery exit exercised; exit scroll lock cleanup confirmed.
- Video compressed from 16,410,742 bytes to approximately 14.3 MB with the original 854×480 resolution and 101.2-second duration; measured SSIM against the original was 0.9919. Fast-start metadata retained.
- Production DNS, TLS, actual mobile hardware, Safari-specific behavior and deployed Core Web Vitals remain launch checks. Nothing has been deployed and no DNS records have been edited.

CMS recheck: the published desktop and mobile records now contain the corrected attendee names. The public site was observed serving bundled fallback content instead of these records. Set the Sanity build variables under the Cloudflare Production environment, redeploy the corrected code, and configure the publish webhook described above. Static exports do not update automatically when editing Sanity alone.
