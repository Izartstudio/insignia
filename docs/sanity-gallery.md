# Sanity setup and editing

Sanity Studio is embedded at `/studio` in this Next.js app. The schema, website queries and seed script are already installed; do not run a scaffolding initializer over this project.

## Connect your account (once)

1. Use Node.js 22.13 or newer (Node 22 LTS recommended), then run `npm install` if dependencies are missing.
2. Open https://www.sanity.io/manage and create or select your Insignia project. Create a **public** dataset named `production`. The website reads published content without a token; private datasets are not supported by the current readers.
3. Fill in `.env.local` at the project root (copy `.env.example` if it is missing):

   ```dotenv
   NEXT_PUBLIC_SANITY_PROJECT_ID=your_actual_project_id
   NEXT_PUBLIC_SANITY_DATASET=production
   SANITY_API_TOKEN=your_editor_token
   ```

   Find the project ID in the project settings. Create an **Editor** API token under API → Tokens for the initial import. Keep it local; never use a `NEXT_PUBLIC_` prefix for a token or commit `.env.local`.
4. Under API → CORS origins, add `http://localhost:3000` with **Allow credentials** enabled. Match the actual port if Next.js starts on another port. Add your production website origin with credentials before deploying. Use origins, not `/studio` paths or wildcards.
5. Seed the existing website content:

   ```sh
   npm run sanity:seed
   ```

   This uploads local images and creates **published** Desktop gallery, Mobile gallery and Past Editions documents. Existing published documents or drafts are skipped. Run before making edits in Studio; rerunning does not replace content. `sanity:import-gallery` is a compatibility alias for the same full import.
6. Run `npm run dev`, visit `http://localhost:3000/studio`, and sign in with a Sanity account that has access to this project. Edit a document and click **Publish**. Verify the result on the homepage; drafts are not displayed. Queries revalidate after 60 seconds, and CDN caching may add delay.

## CLI

`npm run sanity -- login` authenticates the CLI. `npm run sanity -- projects list` lists accessible projects. `npm run sanity -- dataset list` checks the configured project's datasets. The wrapper loads `.env.local`; `sanity.cli.ts` supplies the project and dataset. CLI login and the seed script's Editor token are separate credentials.

## Deploy

Set `NEXT_PUBLIC_SANITY_PROJECT_ID` and `NEXT_PUBLIC_SANITY_DATASET` in your hosting provider **before building**. Add the deployed origin to Sanity CORS with credentials, then deploy the Next.js app normally. Studio is served at your site's `/studio`; no separate `sanity deploy` is required. The website and Studio do not need the seed token in hosting environment variables. Remove/revoke the import token when finished.

## Content model

The fixed document IDs are `spatialGalleryDesktop`, `spatialGalleryMobile`, and `pastEditions`. Do not rename them; the queries depend on them. Studio disables duplicate/delete actions for these singletons.

Desktop and mobile galleries independently control the four categories, labels, headings, subtitles, glow radii, images, positions and detail cards. Positions use the existing 1440 × 900 reference canvas; width and height must be positive. Past Editions controls the section copy, years, titles and photographs. Animation and interaction remain in website code.

With no project ID, the site uses bundled content and `/studio` shows setup instructions. Missing, incomplete or unreadable CMS content also falls back to bundled content; inspect server logs if published changes do not appear. Restart the development server after changing `.env.local`.
