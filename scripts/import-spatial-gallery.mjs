import { createReadStream } from 'node:fs';
import { basename, join } from 'node:path';
import { createClient } from '@sanity/client';
import { pastEditions } from '../src/content/past-editions.ts';
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

async function exists(id) {
  const documents = await client.getDocuments([id, `drafts.${id}`]);
  return documents.some(Boolean);
}

for (const screen of ['desktop', 'mobile']) {
  const _id = screen === 'desktop' ? 'spatialGalleryDesktop' : 'spatialGalleryMobile';
  if (await exists(_id)) {
    console.log(`${_id} already exists; leaving existing published or draft edits untouched.`);
    continue;
  }
  const document = {
    _id, _type: _id,
    dialogTitle: 'Who has been at Insignia',
    explorePrompt: 'Move to explore the canvas.',
    touchExplorePrompt: 'Swipe here to scroll',
    nextLabel: 'NEXT',
    learnMoreLabel: 'LEARN MORE',
    entryTitle: 'Who has been at Insignia',
    entryNote: 'Designed to adapt across devices, with an experience best enjoyed on the desktop.',
    enterLabel: 'ENTER TO EXPERIENCE',
    copyLinkLabel: 'COPY LINK',
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

if (await exists('pastEditions')) {
  console.log('pastEditions already exists; leaving existing published or draft edits untouched.');
} else {
  const editions = [];
  for (const edition of pastEditions) {
    const photos = [];
    for (const photo of edition.photos) {
      photos.push({ _key: photo.id, _type: 'pastEditionPhoto', alt: photo.alt, image: await imageReference(photo.src) });
    }
    editions.push({ _key: edition.year, _type: 'pastEdition', year: edition.year, title: edition.title, photos });
  }
  await client.createIfNotExists({
    _id: 'pastEditions', _type: 'pastEditions', eyebrow: 'PAST EDITIONS',
    heading: 'Every edition explores a defining question for the Indian industry.', editions,
  });
  console.log('Imported pastEditions.');
}
