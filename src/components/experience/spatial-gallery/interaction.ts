import type { GalleryState } from '@/content/spatial-gallery';

export function canPanGallery(state: Pick<GalleryState, 'photos'>, enabled = true) {
  return enabled && new Set(state.photos.map(photo => photo.src)).size >= 6;
}

export function resetStaticGalleryPan(state: GalleryState, pan: { x: number; y: number }, enabled = true) {
  if (!canPanGallery(state, enabled)) { pan.x = 0; pan.y = 0; }
}
