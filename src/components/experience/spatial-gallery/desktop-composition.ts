import { galleryConfig, type GalleryPhoto } from '@/content/spatial-gallery';
import galleryDesign from '@/content/gallery-design.json';

export function hasDesktopComposition(id: string, count: number) {
  const slots = galleryDesign[id as keyof typeof galleryDesign];
  return !!slots && count <= slots.length;
}

/** Contain the complete 1440 × 900 design, including every source photograph. */
export function mapDesktopReferencePhoto(id: string, photo: GalleryPhoto, _index: number, count: number, width: number, height: number, imageAspect: number) {
  if (!hasDesktopComposition(id, count)) return null;
  // Sanity stores the actual reference rectangle, so placements in the editor
  // and the fallback use the same source instead of a second hardcoded layout.
  const [x, y, w, h] = photo.layout;
  const fit = Math.min(width / 1440, height / 900);
  const units = 2 * galleryConfig.distance * Math.tan(galleryConfig.fov * Math.PI / 360) / height;
  const photoWidth = Math.min(w, h * imageAspect);
  const photoHeight = photoWidth / imageAspect;
  return {
    position: [(x + w / 2 - 720) * fit * units, (450 - y - h / 2) * fit * units, 0] as [number, number, number],
    scale: [photoWidth * fit * units, photoHeight * fit * units, 1] as [number, number, number],
    repeat: [1, 1] as const,
  };
}
