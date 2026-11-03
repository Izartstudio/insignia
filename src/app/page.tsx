import { InsigniaExperience } from "@/components/experience/InsigniaExperience";
import { getSpatialGalleryContent } from '@/sanity/galleryContent';
import { getPastEditionsContent } from '@/sanity/pastEditionsContent';
import { siteDescription, siteTitle, siteUrl } from '@/config/site';

export default async function Home() {
  const [galleryContent, pastEditionsContent] = await Promise.all([
    getSpatialGalleryContent(),
    getPastEditionsContent(),
  ]);
  return <>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
      '@context': 'https://schema.org',
      '@graph': [
        { '@type': 'Organization', '@id': `${siteUrl}/#organizer`, name: 'Lumikai', url: 'https://www.lumikai.com/' },
        { '@type': 'WebSite', '@id': `${siteUrl}/#website`, url: `${siteUrl}/`, name: 'Insignia by Lumikai', publisher: { '@id': `${siteUrl}/#organizer` } },
        { '@type': 'WebPage', '@id': `${siteUrl}/#webpage`, url: `${siteUrl}/`, name: siteTitle, description: siteDescription, isPartOf: { '@id': `${siteUrl}/#website` }, about: ['Interactive media', 'Gaming', 'Digital entertainment'] },
      ],
    }).replace(/</g, '\\u003c') }} />
    <InsigniaExperience galleryContent={galleryContent} pastEditionsContent={pastEditionsContent} />
  </>;
}
