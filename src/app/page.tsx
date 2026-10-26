import { InsigniaExperience } from "@/components/experience/InsigniaExperience";
import { getSpatialGalleryContent } from '@/sanity/galleryContent';
import { getPastEditionsContent } from '@/sanity/pastEditionsContent';

export default async function Home() {
  const [galleryContent, pastEditionsContent] = await Promise.all([
    getSpatialGalleryContent(),
    getPastEditionsContent(),
  ]);
  return <>
    {[...new Set(galleryContent.desktop[0].photos.map(photo => photo.src))].map(src => <link key={`desktop-${src}`} rel="preload" as="image" href={src} media="(min-width: 1025px)" fetchPriority="high" />)}
    {[...new Set(galleryContent.mobile[0].photos.map(photo => photo.src))].map(src => <link key={`mobile-${src}`} rel="preload" as="image" href={src} media="(max-width: 1024px)" fetchPriority="high" />)}
    <InsigniaExperience galleryContent={galleryContent} pastEditionsContent={pastEditionsContent} />
  </>;
}
