import { defineField, defineType } from 'sanity';

export const socialPreviewSchema = defineType({
  name: 'socialPreview',
  title: 'Social Preview',
  type: 'document',
  fields: [
    defineField({
      name: 'thumbnail',
      title: 'Thumbnail',
      type: 'image',
      options: { accept: 'image/png,image/jpeg' },
      description: 'Use a landscape image with a 1.91:1 aspect ratio, such as 1200 × 630.',
      validation: rule => rule.required(),
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'text',
      rows: 2,
      validation: rule => rule.required(),
    }),
  ],
  preview: { prepare: () => ({ title: 'Social Preview' }) },
});
