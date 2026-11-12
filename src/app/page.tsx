import { InsigniaExperience } from "@/components/experience/InsigniaExperience";
import { getSpatialGalleryContent } from '@/sanity/galleryContent';
import { getPastEditionsContent } from '@/sanity/pastEditionsContent';
import { siteTitle, siteUrl } from '@/config/site';

import { getSocialPreview } from '@/sanity/socialPreview';

export default async function Home() {
  const [galleryContent, pastEditionsContent, { description }] = await Promise.all([
    getSpatialGalleryContent(),
    getPastEditionsContent(),
    getSocialPreview(),
  ]);
  return <>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
      '@context': 'https://schema.org',
      '@graph': [
        { '@type': 'Organization', '@id': `${siteUrl}/#organizer`, name: 'Lumikai', url: 'https://www.lumikai.com/' },
        { '@type': 'WebSite', '@id': `${siteUrl}/#website`, url: `${siteUrl}/`, name: 'Insignia by Lumikai', publisher: { '@id': `${siteUrl}/#organizer` } },
        { '@type': 'WebPage', '@id': `${siteUrl}/#webpage`, url: `${siteUrl}/`, name: siteTitle, description, isPartOf: { '@id': `${siteUrl}/#website` }, about: ['Interactive media', 'Gaming', 'Digital entertainment'] },
      ],
    }).replace(/</g, '\\u003c') }} />
    <InsigniaExperience galleryContent={galleryContent} pastEditionsContent={pastEditionsContent} />
  </>;
}
