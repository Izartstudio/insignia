import type { Texture, TextureLoader } from 'three';

const placeholder = '/assets/insignia/people/attendee-placeholder.png';

/** Recover a transient CDN/decoder failure before falling back to a local portrait. */
export async function loadGalleryTexture(loader: Pick<TextureLoader, 'loadAsync'>, url: URL, active: () => boolean): Promise<Texture | null> {
  for (let attempt = 0; attempt < 2; attempt++) {
    if (!active()) return null;
    const candidate = new URL(url);
    if (attempt && candidate.hostname === 'cdn.sanity.io') {
      // Keep the same bounded dimensions, with a universally supported decoder.
      candidate.searchParams.delete('auto');
      candidate.searchParams.set('fm', 'jpg');
    }
    try {
      return await loader.loadAsync(candidate.href);
    } catch {
      if (!active()) return null;
      if (!attempt) await new Promise(resolve => setTimeout(resolve, 250));
    }
  }
  if (!active()) return null;
  console.warn(`Gallery portrait unavailable after retry; using placeholder: ${url.href}`);
  return loader.loadAsync(placeholder);
}
