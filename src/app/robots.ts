import type { MetadataRoute } from 'next';
import { indexableDeployment, siteUrl } from '@/config/site';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: indexableDeployment
      ? { userAgent: '*', allow: '/', disallow: ['/studio', '/dev/'] }
      : { userAgent: '*', disallow: '/' },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
