# Spatial gallery CMS

The site has separate Sanity documents for the desktop and mobile spatial galleries. Each document edits the four category labels, headings, subtitles, glow radii, images, image positions, and photo-detail cards. The mobile document has independent images and placements. Animation and interaction remain in the website code.

1. Create a Sanity project and dataset. Copy `.env.example` to `.env.local` and set `NEXT_PUBLIC_SANITY_PROJECT_ID` and `NEXT_PUBLIC_SANITY_DATASET`.
2. Add the site origin to the project's Sanity CORS origins with credentials so the embedded Studio can authenticate.
3. Create a Sanity token with write access, set `SANITY_API_TOKEN` locally, and run `npm run sanity:import-gallery` once. The import uploads the existing gallery images and creates both documents without overwriting documents that already exist. Do not expose the token in a `NEXT_PUBLIC_` variable.
4. Open `/studio`, edit Desktop gallery and Mobile gallery independently, then publish. The website reads published content and refreshes it within 60 seconds. Until a complete document is published, that screen uses the bundled gallery content.

The Studio uses fixed singleton document IDs, `spatialGalleryDesktop` and `spatialGalleryMobile`. Do not rename those IDs; the website query uses them. Canvas positions are numbers measured against the existing 1440 × 900 reference canvas. Width and height must be positive.
