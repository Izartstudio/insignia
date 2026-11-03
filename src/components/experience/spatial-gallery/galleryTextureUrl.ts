import type { GalleryPhoto } from '@/content/spatial-gallery';

/** Preloads and TextureLoader must request exactly the same asset to share the cache. */
export function galleryTextureUrl(photo: GalleryPhoto, mobile: boolean, origin: string): URL {
  const url = new URL(photo.textureSrc || photo.src, origin);
  if (url.hostname === 'cdn.sanity.io') {
    url.searchParams.set('w', mobile ? '512' : '768');
    url.searchParams.set('h', mobile ? '512' : '768');
    url.searchParams.set('fit', 'max');
    url.searchParams.set('auto', 'format');
  }
  return url;
}
