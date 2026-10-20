import { galleryStates, originalGalleryMotionProfile } from '@/content/spatial-gallery';
import { fallbackGalleryCopy } from '@/sanity/galleryContent';
import { SpatialGallery } from './SpatialGallery';

/** The original 4.5-viewport journey. Swap this into InsigniaExperience to restore it. */
export function SpatialGalleryOriginal() {
  return <SpatialGallery content={{ desktop: galleryStates, mobile: galleryStates, desktopCopy: fallbackGalleryCopy, mobileCopy: fallbackGalleryCopy }} motionProfile={originalGalleryMotionProfile} />;
}
