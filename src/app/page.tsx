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
    {[...new Set(galleryContent.desktop[0].photos.map(photo => photo.src))].map(src => <link key={`desktop-${src}`} rel="preload" as="image" href={src} media="(min-width: 1025px)" fetchPriority="high" />)}
    {[...new Set(galleryContent.mobile[0].photos.map(photo => photo.src))].map(src => <link key={`mobile-${src}`} rel="preload" as="image" href={src} media="(max-width: 1024px)" fetchPriority="high" />)}
    <InsigniaExperience galleryContent={galleryContent} pastEditionsContent={pastEditionsContent} />
  </>;
}
