import { createHash } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const downloads = new Map<string, Promise<string>>();

/** Publish immutable CMS images alongside the static site, avoiding cross-origin WebGL requests. */
async function snapshotImage(source: string): Promise<string> {
  const url = new URL(source);
  if (url.protocol !== 'https:' || url.hostname !== 'cdn.sanity.io' || !url.pathname.startsWith('/images/')) {
    throw new Error('Static CMS images must use the Sanity image CDN.');
  }
  url.searchParams.set('w', '1600');
  url.searchParams.set('h', '1600');
  url.searchParams.set('fit', 'max');
  url.searchParams.set('fm', 'webp');
  url.searchParams.delete('auto');
  const key = url.href;
  const existing = downloads.get(key);
  if (existing) return existing;
  const pending = (async () => {
    const response = await fetch(key, { signal: AbortSignal.timeout(20000) });
    if (!response.ok || !response.headers.get('content-type')?.startsWith('image/')) {
      throw new Error(`CMS image snapshot failed (${response.status}).`);
    }
    const bytes = Buffer.from(await response.arrayBuffer());
    if (!bytes.length || bytes.length > 25 * 1024 * 1024) throw new Error('Invalid CMS image size.');
    const name = `${createHash('sha256').update(bytes).digest('hex').slice(0, 24)}.webp`;
    const directory = path.join(process.cwd(), 'public', 'cms');
    await mkdir(directory, { recursive: true });
    await writeFile(path.join(directory, name), bytes);
    return `/cms/${name}`;
  })();
  downloads.set(key, pending);
  return pending;
}

export async function snapshotStaticImages<T>(content: T): Promise<T> {
  if (process.env.CLOUDFLARE_PAGES !== '1') return content;
  async function visit(value: unknown): Promise<unknown> {
    if (Array.isArray(value)) return Promise.all(value.map(visit));
    if (value && typeof value === 'object') {
      return Object.fromEntries(await Promise.all(Object.entries(value).map(async ([key, item]) => [
        key, key === 'src' && typeof item === 'string' && item.startsWith('https://') ? await snapshotImage(item) : await visit(item),
      ])));
    }
    return value;
  }
  return await visit(content) as T;
}
