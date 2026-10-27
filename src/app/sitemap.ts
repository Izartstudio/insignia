import type { MetadataRoute } from 'next';
import { indexableDeployment, siteUrl } from '@/config/site';

export default function sitemap(): MetadataRoute.Sitemap {
  return indexableDeployment ? [{ url: `${siteUrl}/`, changeFrequency: 'monthly', priority: 1 }] : [];
}
