import { createClient, defineQuery } from 'next-sanity';
import { pastEditions as fallbackEditions, type PastEdition, type PastEditionsContent } from '@/content/past-editions';

export const fallbackPastEditionsContent: PastEditionsContent = {
  eyebrow: 'PAST EDITIONS',
  heading: 'Every edition explores a defining question for the Indian industry.',
  editions: fallbackEditions,
};

const query = defineQuery(`*[_id == "pastEditions"][0]{
  eyebrow,heading,
  editions[]{_key,year,title,photos[]{_key,alt,"src":image.asset->url}}
}`);

const isObject = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === 'object' && !Array.isArray(value);

const text = (value: unknown, fallback: string) =>
  typeof value === 'string' && value.trim() ? value : fallback;

function isImageSource(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  if (value.startsWith('/assets/')) return true;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && url.hostname === 'cdn.sanity.io';
  } catch {
    return false;
  }
}

function normalize(document: unknown): PastEditionsContent {
  if (!isObject(document) || !Array.isArray(document.editions) || !document.editions.length) {
    return fallbackPastEditionsContent;
  }

  const editions: PastEdition[] = [];
  for (const [editionIndex, rawEdition] of document.editions.entries()) {
    if (!isObject(rawEdition) || !Array.isArray(rawEdition.photos) || !rawEdition.photos.length) {
      return fallbackPastEditionsContent;
    }
    const photos: PastEdition['photos'] = [];
    for (const [photoIndex, rawPhoto] of rawEdition.photos.entries()) {
      if (!isObject(rawPhoto) || !isImageSource(rawPhoto.src)) {
        return fallbackPastEditionsContent;
      }
      photos.push({
        id: text(rawPhoto._key, `${rawEdition.year}-${photoIndex}`),
        src: rawPhoto.src,
        alt: text(rawPhoto.alt, `Photo from the ${text(rawEdition.year, 'past')} edition`),
      });
    }
    editions.push({
      year: text(rawEdition.year, ''),
      title: text(rawEdition.title, ''),
      photos,
    });
    if (!editions[editionIndex].year || !editions[editionIndex].title) return fallbackPastEditionsContent;
  }

  return {
    eyebrow: text(document.eyebrow, fallbackPastEditionsContent.eyebrow),
    heading: text(document.heading, fallbackPastEditionsContent.heading),
    editions,
  };
}

export async function getPastEditionsContent(): Promise<PastEditionsContent> {
  const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
  if (!projectId) return fallbackPastEditionsContent;
  try {
    const client = createClient({
      projectId,
      dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
      apiVersion: '2026-10-01',
      useCdn: true,
      timeout: 10000,
      maxRetries: 1,
      perspective: 'published',
    });
    return normalize(await client.fetch(query, {}, { next: { revalidate: 60 } }));
  } catch (error) {
    console.warn('Using Past Editions fallback:', error instanceof Error ? error.message : 'CMS request failed');
    return fallbackPastEditionsContent;
  }
}
