import { createClient } from '@sanity/client';
import { cache } from 'react';
import { siteDescription } from '@/config/site';

const alt = 'Insignia by Lumikai';
const fallbackImage = { url: '/insignia-social.png', width: 2400, height: 1260, alt };

export const getSocialPreview = cache(async () => {
  const fallback = { description: siteDescription, image: fallbackImage };
  const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
  if (!projectId) return fallback;

  try {
    const client = createClient({
      projectId,
      dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
      apiVersion: '2026-10-01',
      perspective: 'published',
      useCdn: false,
      timeout: 5000,
      maxRetries: 0,
    });
    const preview = await client.fetch<{
      description?: string;
      image?: { url: string; width: number; height: number };
    } | null>(`*[_id == "socialPreview"][0]{
      description,
      "image": thumbnail.asset->{url, "width": metadata.dimensions.width, "height": metadata.dimensions.height}
    }`, process.env.CLOUDFLARE_PAGES === '1' ? { _build: Date.now().toString() } : {});
    const image = preview?.image;
    return {
      description: preview?.description?.trim() || siteDescription,
      image: image?.url && image.width > 0 && image.height > 0 ? { ...image, alt } : fallbackImage,
    };
  } catch (error) {
    console.warn('Using social preview defaults:', error instanceof Error ? error.message : 'CMS request failed');
    return fallback;
  }
});
