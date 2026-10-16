import { originalGalleryMotionProfile } from '@/content/spatial-gallery';
import { SpatialGallery } from './SpatialGallery';

/** The original 4.5-viewport journey. Swap this into InsigniaExperience to restore it. */
export function SpatialGalleryOriginal() {
  return <SpatialGallery motionProfile={originalGalleryMotionProfile} />;
}
