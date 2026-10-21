'use client';

import { defineConfig } from 'sanity';
import { structureTool } from 'sanity/structure';
import { spatialGallerySchema } from './src/sanity/schemaTypes/spatialGallery';

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || process.env.SANITY_STUDIO_PROJECT_ID;
if (!projectId || projectId === 'placeholder') {
  throw new Error('Set SANITY_STUDIO_PROJECT_ID in .env.local before building the standalone Studio.');
}

export default defineConfig({
  name: 'insignia',
  title: 'Insignia content',
  basePath: '/',
  projectId,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || process.env.SANITY_STUDIO_DATASET || 'production',
  plugins: [structureTool({ structure: S => S.list().title('Experience content').items([
    S.listItem().title('Desktop gallery').id('desktop').child(S.document().schemaType('spatialGalleryDesktop').documentId('spatialGalleryDesktop')),
    S.listItem().title('Mobile gallery').id('mobile').child(S.document().schemaType('spatialGalleryMobile').documentId('spatialGalleryMobile')),
    S.listItem().title('Past Editions').id('past-editions').child(S.document().schemaType('pastEditions').documentId('pastEditions')),
  ]) })],
  schema: { types: spatialGallerySchema },
  document: {
    newDocumentOptions: () => [],
    actions: (actions) => actions.filter(({ action }) => action !== 'duplicate' && action !== 'delete'),
  },
});
