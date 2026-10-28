import { createReadStream, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { createClient } from '@sanity/client';
import design from '../src/content/gallery-design.json' with { type: 'json' };

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
const token = process.env.SANITY_API_TOKEN;
if (!projectId || !token) throw new Error('Set NEXT_PUBLIC_SANITY_PROJECT_ID and SANITY_API_TOKEN.');
const client = createClient({ projectId, token, dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production', apiVersion: '2026-10-01', useCdn: false, maxRetries: 0, timeout: 20000 });
const ids = ['spatialGalleryDesktop', 'spatialGalleryMobile', 'drafts.spatialGalleryDesktop', 'drafts.spatialGalleryMobile'];
const documents = (await client.getDocuments(ids)).filter(Boolean);
for (const id of ids.slice(0, 2)) if (!documents.some(document => document._id === id)) throw new Error(`Missing ${id}`);
const inputs = Object.entries(design).flatMap(([group, slots]) => slots.map(slot => ({ group, ...slot, path: join(process.cwd(), 'public/assets/insignia/gallery', group, `${slot.file}.webp`) })));
for (const input of inputs) if (!existsSync(input.path)) throw new Error(`Missing ${input.path}`);
console.log(JSON.stringify({ documents: documents.map(document => document._id), photos: inputs.length, categories: Object.fromEntries(Object.entries(design).map(([group, slots]) => [group, slots.length])) }));
if (!process.argv.includes('--apply')) {
  console.log('Dry run: no assets uploaded or documents changed. Pass --apply to publish.');
  process.exit(0);
}
mkdirSync('.sanity-backups', { recursive: true });
const backup = join('.sanity-backups', `gallery-design-${Date.now()}.json`);
writeFileSync(backup, JSON.stringify(documents, null, 2));
console.log(`Saved ${backup}`);
const assets = new Map();
// Keep network/GPU asset work bounded; Sanity deduplicates identical uploads.
let cursor = 0;
await Promise.all(Array.from({ length: 3 }, async () => {
  while (cursor < inputs.length) {
    const input = inputs[cursor++];
    const asset = await client.assets.upload('image', createReadStream(input.path), { filename: `${input.group}-${input.file}.webp` });
    assets.set(`${input.group}/${input.file}`, asset._id);
  }
}));
let transaction = client.transaction();
for (const document of documents) {
  const fields = {};
  for (const [group, slots] of Object.entries(design)) {
    const current = document[group]?.photos || [];
    fields[`${group}.photos`] = slots.map((slot, index) => {
      const key = `gallery-design-${slot.file}`;
      const existing = current.find(photo => photo._key === key) ?? (slot.legacyIndex === null ? undefined : current[slot.legacyIndex]);
      const [x, y, width, height] = slot.rect;
      return {
        ...existing,
        _key: key,
        _type: 'spatialPhoto',
        image: { _type: 'image', asset: { _type: 'reference', _ref: assets.get(`${group}/${slot.file}`) } },
        alt: existing?.name || `Insignia ${group} photograph ${index + 1}`,
        placement: { _type: 'spatialPlacement', x, y, width, height },
        depthOffset: 0,
        referenceCrop: false,
        name: existing?.name || '',
        bio: existing?.bio || '',
      };
    });
  }
  transaction = transaction.patch(document._id, patch => patch.ifRevisionId(document._rev).set(fields));
}
await transaction.commit();
const updated = (await client.getDocuments(ids)).filter(Boolean);
for (const document of updated) for (const [group, slots] of Object.entries(design)) {
  if (document[group]?.photos?.length !== slots.length) throw new Error(`Verification failed: ${document._id}/${group} count`);
  slots.forEach((slot, index) => {
    const photo = document[group].photos[index];
    if (photo.image.asset._ref !== assets.get(`${group}/${slot.file}`)) throw new Error(`Verification failed: ${group}/${slot.file} image`);
    const actual = [photo.placement.x, photo.placement.y, photo.placement.width, photo.placement.height];
    if (JSON.stringify(actual) !== JSON.stringify(slot.rect)) throw new Error(`Verification failed: ${group}/${slot.file} placement`);
  });
}
console.log(`Verified ${inputs.length} images and placements in ${updated.length} published/draft gallery documents. Existing attendee details preserved; the additional seventh leader has blank details.`);
