import { galleryConfig, mobilePlacements, type GalleryPhoto } from '@/content/spatial-gallery';

/** Map the reference rectangle at its own depth, preserving the source aspect ratio. */
export function mapPhoto(photo: GalleryPhoto, index: number, width: number, height: number, imageAspect: number) {
  const mobile = width / height < .85;
  const [x, y, w, h] = mobile ? (photo.mobileLayout ?? mobilePlacements[index % mobilePlacements.length]) : photo.layout;
  const distance = galleryConfig.distance - photo.depthOffset;
  const visibleHeight = 2 * distance * Math.tan(galleryConfig.fov * Math.PI / 360);
  const visibleWidth = visibleHeight * width / height;
  const planeWidth = w / 1440 * visibleWidth;
  // A portrait viewport needs larger photos; use width, never anisotropic stretching.
  const planeHeight = photo.referenceCrop && !mobile ? h / 900 * visibleHeight : planeWidth / imageAspect;
  const planeAspect = planeWidth / planeHeight;
  const repeatX = Math.min(1, planeAspect / imageAspect);
  const repeatY = Math.min(1, imageAspect / planeAspect);
  return {
    repeat: [repeatX, repeatY] as const,
    position: [(x + w / 2) / 1440 * visibleWidth - visibleWidth / 2,
      (.5 - y / 900) * visibleHeight - planeHeight / 2, photo.depthOffset] as [number, number, number],
    scale: [planeWidth, planeHeight, 1] as [number, number, number],
  };
}
