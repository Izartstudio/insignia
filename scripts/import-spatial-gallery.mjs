import { createReadStream } from 'node:fs';
import { basename, join } from 'node:path';
import { createClient } from '@sanity/client';
import { galleryStates, mobilePlacements } from '../src/content/spatial-gallery.ts';

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || 'production';
const token = process.env.SANITY_API_TOKEN;
if (!projectId || !token) {
  console.error('Set NEXT_PUBLIC_SANITY_PROJECT_ID and SANITY_API_TOKEN before importing the gallery.');
  process.exit(1);
}

const client = createClient({ projectId, dataset, apiVersion: '2026-10-01', token, useCdn: false });
const assets = new Map();
async function imageReference(src) {
  if (!assets.has(src)) {
    const path = join(process.cwd(), 'public', src.replace(/^\//, ''));
    const asset = await client.assets.upload('image', createReadStream(path), { filename: basename(path) });
    assets.set(src, { _type: 'image', asset: { _type: 'reference', _ref: asset._id } });
  }
  return assets.get(src);
}

for (const screen of ['desktop', 'mobile']) {
  const _id = screen === 'desktop' ? 'spatialGalleryDesktop' : 'spatialGalleryMobile';
  if (await client.getDocument(_id)) {
    console.log(`${_id} already exists; leaving published edits untouched.`);
    continue;
  }
  const document = {
    _id, _type: _id,
    dialogTitle: 'Who has been at Insignia',
    explorePrompt: 'Move to explore the canvas.',
    touchExplorePrompt: 'Swipe here to scroll',
    nextLabel: 'NEXT',
    learnMoreLabel: 'LEARN MORE',
  };
  for (const state of galleryStates) {
    const photos = [];
    for (const [index, photo] of state.photos.entries()) {
      const [x, y, width, height] = screen === 'mobile'
        ? (photo.mobileLayout || mobilePlacements[index % mobilePlacements.length])
        : photo.layout;
      photos.push({
        _key: `${state.id}-${index + 1}`,
        _type: 'spatialPhoto',
        image: await imageReference(photo.src),
        alt: photo.alt,
        placement: { _type: 'spatialPlacement', x, y, width, height },
        depthOffset: photo.depthOffset,
        referenceCrop: photo.referenceCrop ?? false,
        name: photo.name || 'Lorem Ipsum',
        bio: photo.bio || 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
        learnMoreUrl: photo.learnMoreUrl || 'https://example.com',
      });
    }
    document[state.id] = {
      _type: 'spatialCategory', category: state.category, label: state.label,
      heading: state.heading, subtitle: state.subtitle || '', radius: state.radius, photos,
    };
  }
  await client.createIfNotExists(document);
  console.log(`Imported ${_id}.`);
}
