'use client';

import { defineConfig } from 'sanity';
import { structureTool } from 'sanity/structure';
import { spatialGallerySchema } from './src/sanity/schemaTypes/spatialGallery';

export default defineConfig({
  name: 'insignia',
  title: 'Insignia gallery',
  basePath: '/studio',
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'placeholder',
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  plugins: [structureTool({ structure: S => S.list().title('Spatial galleries').items([
    S.listItem().title('Desktop gallery').id('desktop').child(S.document().schemaType('spatialGalleryDesktop').documentId('spatialGalleryDesktop')),
    S.listItem().title('Mobile gallery').id('mobile').child(S.document().schemaType('spatialGalleryMobile').documentId('spatialGalleryMobile')),
  ]) })],
  schema: { types: spatialGallerySchema },
  document: { newDocumentOptions: () => [] },
});
