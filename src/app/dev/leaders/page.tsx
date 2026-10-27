import { notFound } from 'next/navigation';
import { SpatialGallery } from '@/components/experience/spatial-gallery/SpatialGallery';
import { getSpatialGalleryContent } from '@/sanity/galleryContent';
export const metadata = { robots: { index: false, follow: false }, alternates: { canonical: null } };

export default async function LeadersPreview() {
  if (process.env.NODE_ENV !== 'development') notFound();
  return <SpatialGallery content={await getSpatialGalleryContent()} />;
}
