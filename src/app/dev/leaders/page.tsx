import { notFound } from 'next/navigation';
import { SpatialGallery } from '@/components/experience/spatial-gallery/SpatialGallery';

export default function LeadersPreview() {
  if (process.env.NODE_ENV !== 'development') notFound();
  return <SpatialGallery />;
}
