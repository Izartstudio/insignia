# Supplied gallery designs

The four 1440 × 900 reference compositions and photo filenames are defined in `src/content/gallery-design.json` and shared by the local fallback and Sanity sync. Original assets came from the supplied `Downloads/leaders/` folder. All 29 photographs are copied into `public/assets/insignia/gallery/` as optimized WebP files without additional cropping.

Desktop uses the editor's reference rectangles and uniformly contains the entire composition, centred in the viewport. Each source image is contained within its rectangle without stretching or cropping. Phones and tablets redistribute the same images into safe upper/lower bands around the heading and controls, retaining the existing touch-size reduction. The blurred mobile entry preview is also kept within its container.

There are 7 Leaders, 7 Founders, 8 Industry Experts and 7 Investors. The extra `leader7` photo is included in the left-middle position from the design; its name, description and link are intentionally blank for the user to complete.

`npm run sanity:sync-design` previews the migration. `npm run sanity:sync-design -- --apply` uploads the optimized photos and updates image references, placement, depth and crop settings in the desktop/mobile documents and any existing drafts. It backs up all documents to ignored `.sanity-backups/` before mutation, preserves existing attendee details, and commits using revision guards. Matching stable photo keys make subsequent runs safe after the first migration. Do not manually reorder the migration manifest's legacy indexes when running it against unmigrated documents.

Sanity updates are live immediately. The Next.js site caches published content for 60 seconds. Deploy the updated frontend/assets as well: the previously deployed frontend does not have the new seven-Leaders reference composition.

Validation: `npm test` includes exact reference-centre checks, complete-image aspect/crop checks and non-overlap/viewport-bound checks across 17 phone, tablet, laptop and ultrawide sizes, including the desktop pointer-parallax margin. These are layout/projection checks; physical-device and visual browser checks are separate.
