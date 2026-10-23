import { galleryConfig, type GalleryState } from '@/content/spatial-gallery';

export function canPanGallery(state: Pick<GalleryState, 'photos'>) {
  return new Set(state.photos.map(photo => photo.src)).size > 6;
}

export function constrainGalleryPan(state: GalleryState, pan: { x: number; y: number }, width: number, height: number) {
  const visibleHeight = 2 * galleryConfig.distance * Math.tan(galleryConfig.fov * Math.PI / 360);
  const maxY = canPanGallery(state) ? visibleHeight * .2 : 0;
  const maxX = canPanGallery(state) ? visibleHeight * width / Math.max(1, height) * .25 : 0;
  pan.x = Math.max(-maxX, Math.min(maxX, pan.x));
  pan.y = Math.max(-maxY, Math.min(maxY, pan.y));
}
