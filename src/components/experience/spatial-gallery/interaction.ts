import type { GalleryState } from '@/content/spatial-gallery';

// All categories are static on desktop, tablet and phone layouts.
export function canPanGallery(_state: Pick<GalleryState, 'photos'>, _enabled = true) {
  return false;
}

export function resetStaticGalleryPan(state: GalleryState, pan: { x: number; y: number }, enabled = true) {
  if (!canPanGallery(state, enabled)) { pan.x = 0; pan.y = 0; }
}
