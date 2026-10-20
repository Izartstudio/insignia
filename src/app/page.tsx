import { InsigniaExperience } from "@/components/experience/InsigniaExperience";
import { getSpatialGalleryContent } from '@/sanity/galleryContent';

export default async function Home() {
  const galleryContent = await getSpatialGalleryContent();
  return <>
    {galleryContent.desktop[0].photos.map(photo => <link key={`desktop-${photo.src}`} rel="preload" as="image" href={photo.src} media="(min-width: 1025px)" fetchPriority="high" />)}
    {galleryContent.mobile[0].photos.map(photo => <link key={`mobile-${photo.src}`} rel="preload" as="image" href={photo.src} media="(max-width: 1024px)" fetchPriority="high" />)}
    <InsigniaExperience galleryContent={galleryContent} />
  </>;
}
