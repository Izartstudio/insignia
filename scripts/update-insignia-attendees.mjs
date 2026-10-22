import { createReadStream, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { createClient } from '@sanity/client';
import { galleryStates, mobilePlacements } from '../src/content/spatial-gallery.ts';

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
const token = process.env.SANITY_API_TOKEN;
if (!projectId || !token) throw new Error('Set NEXT_PUBLIC_SANITY_PROJECT_ID and SANITY_API_TOKEN in .env.local.');
const client = createClient({ projectId, dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production', token, apiVersion: '2026-10-01', useCdn: false, maxRetries: 0 });
const ids = ['spatialGalleryDesktop', 'spatialGalleryMobile', 'drafts.spatialGalleryDesktop', 'drafts.spatialGalleryMobile'];
const documents = (await client.getDocuments(ids)).filter(Boolean);
for (const id of ids.slice(0, 2)) {
  if (!documents.some(document => document._id === id)) throw new Error(`Missing ${id}; run sanity:seed first.`);
}
console.log(JSON.stringify(documents.map(document => ({ id: document._id, counts: Object.fromEntries(galleryStates.map(state => [state.id, { before: document[state.id]?.photos?.length || 0, after: state.photos.length }])) })), null, 2));
if (!process.argv.includes('--apply')) {
  console.log('Dry run only. Pass --apply to update attendee arrays.');
  process.exit(0);
}
const backupDir = join(process.cwd(), '.sanity-backups');
mkdirSync(backupDir, { recursive: true });
const backup = join(backupDir, `attendees-${Date.now()}.json`);
writeFileSync(backup, JSON.stringify(documents, null, 2));
console.log(`Saved backup: ${backup}`);
const asset = await client.assets.upload('image', createReadStream(join(process.cwd(), 'public/assets/insignia/people/attendee-placeholder.png')), { filename: 'attendee-placeholder.png' });
let transaction = client.transaction();
for (const document of documents) {
  const mobile = document._id.endsWith('Mobile');
  const fields = {};
  for (const state of galleryStates) {
    fields[`${state.id}.photos`] = state.photos.map((photo, index) => {
      const existing = document[state.id]?.photos?.find(item => item.name?.trim().toLowerCase() === photo.name.toLowerCase());
      const [x, y, width, height] = mobile ? (photo.mobileLayout || mobilePlacements[index % mobilePlacements.length]) : photo.layout;
      return {
        _key: existing?._key || `${state.id}-${photo.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
        _type: 'spatialPhoto',
        image: existing?.image || { _type: 'image', asset: { _type: 'reference', _ref: asset._id } },
        alt: existing?.image ? photo.name : photo.alt,
        placement: existing?.placement || { _type: 'spatialPlacement', x, y, width, height },
        depthOffset: existing?.depthOffset ?? photo.depthOffset,
        referenceCrop: existing?.referenceCrop ?? photo.referenceCrop ?? false,
        name: photo.name, bio: photo.bio, learnMoreUrl: photo.learnMoreUrl,
      };
    });
  }
  transaction = transaction.patch(document._id, patch => patch.ifRevisionId(document._rev).set(fields));
}
await transaction.commit();
console.log('Updated attendee names, designations, links and placeholders in published documents and any existing drafts.');
