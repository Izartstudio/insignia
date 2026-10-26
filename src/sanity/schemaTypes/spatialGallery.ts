import { defineArrayMember, defineField, defineType } from 'sanity';

const placement = defineType({
  name: 'spatialPlacement', title: 'Position and size', type: 'object',
  fields: [
    defineField({ name: 'x', type: 'number', validation: rule => rule.required() }),
    defineField({ name: 'y', type: 'number', validation: rule => rule.required() }),
    defineField({ name: 'width', type: 'number', validation: rule => rule.required().greaterThan(0) }),
    defineField({ name: 'height', type: 'number', validation: rule => rule.required().greaterThan(0) }),
  ],
});

const photo = defineType({
  name: 'spatialPhoto', title: 'Gallery photo', type: 'object',
  fields: [
    defineField({ name: 'image', title: 'Image', type: 'image', options: { hotspot: true }, validation: rule => rule.required() }),
    defineField({ name: 'alt', title: 'Image description (optional)', type: 'string' }),
    defineField({ name: 'placement', title: 'Legacy placement', type: 'spatialPlacement', hidden: true }),
    defineField({ name: 'depthOffset', title: 'Depth offset', type: 'number', initialValue: 0, hidden: true }),
    defineField({ name: 'referenceCrop', title: 'Use reference crop', type: 'boolean', initialValue: false, hidden: true }),
    defineField({ name: 'name', title: 'Name (optional)', type: 'string' }),
    defineField({ name: 'bio', title: 'Description (optional)', type: 'text', rows: 3 }),
    defineField({ name: 'learnMoreUrl', title: 'Learn more URL (optional)', type: 'url', validation: rule => rule.uri({ scheme: ['http', 'https'] }) }),
  ],
  preview: { select: { title: 'name', subtitle: 'alt', media: 'image' } },
});

const category = defineType({
  name: 'spatialCategory', title: 'Gallery category', type: 'object',
  fields: [
    defineField({ name: 'category', title: 'Eyebrow / watermark', type: 'string', validation: rule => rule.required() }),
    defineField({ name: 'label', title: 'Navigation label', type: 'string', validation: rule => rule.required() }),
    defineField({ name: 'heading', type: 'string', validation: rule => rule.required() }),
    defineField({ name: 'subtitle', type: 'string' }),
    defineField({ name: 'radius', title: 'Background glow radius', type: 'number', validation: rule => rule.required().greaterThan(0) }),
    defineField({ name: 'photos', title: 'Gallery images (up to 10)', type: 'array',
      description: 'Add or replace images here. Drag cards to reorder. All images automatically fit one screen; coordinates are not needed. Desktop and Mobile galleries are edited separately.',
      of: [defineArrayMember({ type: 'spatialPhoto' })],
      validation: rule => rule.required().min(1).max(10).custom(photos => {
        if (!Array.isArray(photos)) return true;
        const refs = photos.map(photo => (photo as { image?: { asset?: { _ref?: string } } })?.image?.asset?._ref).filter(Boolean);
        return new Set(refs).size === refs.length || 'Use each image only once in this category.';
      }),
    }),
  ],
});

const sections = [
  ['leaders', 'Leaders'], ['founders', 'Founders'], ['experts', 'Experts'], ['investors', 'Investors'],
] as const;

const createGallery = (name: string, title: string) => defineType({
  name, title, type: 'document',
  fields: [
    defineField({ name: 'dialogTitle', title: 'Photo detail heading', type: 'string', initialValue: 'Who has been at Insignia', validation: rule => rule.required() }),
    defineField({ name: 'explorePrompt', title: 'Explore instruction', type: 'string', initialValue: 'Move to explore the canvas.', validation: rule => rule.required() }),
    defineField({ name: 'touchExplorePrompt', title: 'Touch scroll instruction', type: 'string', initialValue: 'Swipe here to scroll', validation: rule => rule.required() }),
    defineField({ name: 'nextLabel', title: 'Next arrow label', type: 'string', initialValue: 'NEXT', validation: rule => rule.required() }),
    defineField({ name: 'learnMoreLabel', title: 'Photo link label', type: 'string', initialValue: 'LEARN MORE', validation: rule => rule.required() }),
    defineField({ name: 'entryTitle', title: 'Mobile entry heading', type: 'string', initialValue: 'Who has been at Insignia' }),
    defineField({ name: 'entryNote', title: 'Mobile entry note', type: 'text', rows: 2, initialValue: 'Designed to adapt across devices, with an experience best enjoyed on the desktop.' }),
    defineField({ name: 'enterLabel', title: 'Mobile entry button', type: 'string', initialValue: 'ENTER TO EXPERIENCE' }),
    defineField({ name: 'copyLinkLabel', title: 'Mobile copy link button', type: 'string', initialValue: 'COPY LINK' }),
    ...sections.map(([field, label]) => defineField({
      name: field, title: label, type: 'spatialCategory', validation: rule => rule.required(),
    })),
  ],
  preview: { prepare: () => ({ title }) },
});

const pastEditionPhoto = defineType({
  name: 'pastEditionPhoto', title: 'Past edition photo', type: 'object',
  fields: [
    defineField({ name: 'image', title: 'Image', type: 'image', options: { hotspot: true }, validation: rule => rule.required() }),
    defineField({ name: 'alt', title: 'Image description', type: 'string', validation: rule => rule.required() }),
  ],
  preview: { select: { title: 'alt', media: 'image' } },
});

const pastEdition = defineType({
  name: 'pastEdition', title: 'Past edition', type: 'object',
  fields: [
    defineField({ name: 'year', type: 'string', validation: rule => rule.required() }),
    defineField({ name: 'title', title: 'Edition title', type: 'string', validation: rule => rule.required() }),
    defineField({ name: 'photos', type: 'array', of: [defineArrayMember({ type: 'pastEditionPhoto' })], validation: rule => rule.required().min(1) }),
  ],
  preview: { select: { title: 'year', subtitle: 'title' } },
});

export const pastEditionsSchema = defineType({
  name: 'pastEditions', title: 'Past Editions section', type: 'document',
  fields: [
    defineField({ name: 'eyebrow', title: 'Section label', type: 'string', initialValue: 'PAST EDITIONS', validation: rule => rule.required() }),
    defineField({ name: 'heading', title: 'Section heading', type: 'string', initialValue: 'Every edition explores a defining question for the Indian industry.', validation: rule => rule.required() }),
    defineField({ name: 'editions', type: 'array', of: [defineArrayMember({ type: 'pastEdition' })], validation: rule => rule.required().min(1) }),
  ],
  preview: { prepare: () => ({ title: 'Past Editions section' }) },
});

export const spatialGallerySchema = [
  placement, photo, category,
  createGallery('spatialGalleryDesktop', 'Desktop spatial gallery'),
  createGallery('spatialGalleryMobile', 'Mobile spatial gallery'),
  pastEditionPhoto, pastEdition, pastEditionsSchema,
];
