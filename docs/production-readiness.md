# Production readiness and analytics

Cloudflare deployment and browser-runtime fixes are recorded in the deployment guide.

## Configuration

- `NEXT_PUBLIC_SITE_URL`: current canonical origin `https://insignia.lumikai.com`. Set the custom domain here and redeploy when ready. The canonical tag, sitemap, robots sitemap URL, social sharing URLs and JSON-LD all use it.
- `NEXT_PUBLIC_GA_MEASUREMENT_ID`: `G-FBKLWYJ4WZ`. This ID is public and also has a code default to cover the Vercel deployment.
- `GOOGLE_SITE_VERIFICATION`: optional Search Console HTML verification token. Verification/indexing is separate from Google Analytics.
- Keep Sanity write tokens server-side; never prefix them with `NEXT_PUBLIC_`.

Analytics runs only in production, on `/`. Local development, Vercel preview deployments, Studio and development routes are excluded. A disabled tag or an ad blocker can prevent events from arriving.

## Independent Cloudflare hosting

See [the Cloudflare and Squarespace deployment guide](cloudflare-deployment.md). The production canonical is `https://insignia.lumikai.com`. Corporate links go to `https://www.lumikai.com`; no Webflow staging linker is configured. Cloudflare branch previews and `SITE_INDEXABLE=false` builds disable indexing and analytics. Static CMS content updates require a rebuild.

## Measurement coverage

| Event | Trigger |
| --- | --- |
| `page_view` | Public home page load; config's automatic pageview is disabled to avoid a duplicate |
| `section_view` | First visibility of hero, About Insignia, spatial gallery and Past Editions |
| `scroll_depth` | 25%, 50%, 75%, 90% of document scroll distance; once per page visit |
| `link_click` | Navigation, footer, outbound links and portrait profile links |
| `menu_open`, `menu_close` | Menu button interaction |
| `gallery_enter`, `gallery_exit` | Mobile gallery entry/close controls |
| `gallery_state_view` | Desktop/mobile gallery state changes |
| `portrait_view` | A portrait opens or changes within the photo dialog |
| `edition_navigation` | Previous/next edition buttons |
| `video_start`, `video_progress` | Showreel playback and 10/25/50/75/90% milestones |

Event parameters contain section/category IDs, ordinal portrait indexes, link domains/paths and playback percentages. They do not intentionally send attendee names, biographies, emails, phone numbers or URL query strings. Advertising personalization and Google signals are disabled. Any future consent manager should control Google tag loading according to the site's consent policy; this audit does not introduce visible consent UI.

In GA4, register custom dimensions needed for reports (for example `section_id`, `gallery_state`, `device_layout`, `link_region`, `direction`, `percent_scrolled`, `video_percent`). Events do not need registration to appear in Realtime or DebugView, but custom parameters need definitions for use as report dimensions. Do not mark every interaction as a key event; choose actual business outcomes.

## SEO and indexing

The home page has an absolute canonical, metadata, Open Graph/Twitter sharing image, and WebSite/Organization/WebPage structured data. No event dates, ticket offers or ratings are invented. Existing attendee and event descriptions remain server-rendered outside the WebGL canvas. Studio and development routes have `noindex` metadata and headers, and are omitted from the sitemap. Vercel previews are noindexed.

After deployment:

1. Confirm `/robots.txt`, `/sitemap.xml`, and `/opengraph-image` return 200 on the production domain.
2. Verify domain ownership in Google Search Console and submit `/sitemap.xml`; use URL Inspection to request indexing of `/`.
3. In GA4 Realtime, open the production home page, scroll through sections, open a portrait and use an edition button. Confirm events arrive in the correct property. Verify outbound links reach the live corporate site. Standard reporting can take time to populate.
4. Test mobile hardware, Safari, Chrome and a reduced-motion setting. Run PageSpeed Insights against the deployed site. Build success alone does not certify real-device performance or Core Web Vitals.

Google Analytics does not submit a site for Google Search indexing. Search visibility, account ownership, reporting and session stitching must be verified in the relevant Google accounts after deployment.

## Validation

Run `npm run typecheck`, `npm test`, `npm run build`, and `npm audit --omit=dev`. Run `npm run check:production -- https://your-domain` after deployment (or against a running local production server). Review the dependency overrides before future package upgrades; they patch vulnerable transitive packages without downgrading Sanity.
