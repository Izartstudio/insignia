import { writeFile, stat, readdir, rm } from 'node:fs/promises';
import path from 'node:path';

// Next exports notFound() HTML for this development route; remove it so Pages returns HTTP 404.
await rm('out/dev', { recursive: true, force: true });
// Keep authoring on the existing independently hosted Sanity Studio.
for (const file of ['out/studio', 'out/studio.html', 'out/studio.txt']) await rm(file, { recursive: true, force: true });
await writeFile('out/_redirects', '/studio https://insigniacms.sanity.studio/ 302\n/studio/* https://insigniacms.sanity.studio/:splat 302\n');
// Next headers() is not applied to static exports; Pages reads this file instead.
let headers = `/*
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  X-Frame-Options: SAMEORIGIN
/opengraph-image
  Content-Type: image/png
/_next/static/*
  Cache-Control: public, max-age=31536000, immutable
/models/*
  Cache-Control: public, max-age=86400, stale-while-revalidate=604800
/videos/*
  Cache-Control: public, max-age=86400, stale-while-revalidate=604800
/assets/*
  Cache-Control: public, max-age=86400, stale-while-revalidate=604800
/cms/*
  Cache-Control: public, max-age=31536000, immutable
/fonts/*
  Cache-Control: public, max-age=31536000, immutable
/studio
  X-Robots-Tag: noindex, nofollow
/studio/*
  X-Robots-Tag: noindex, nofollow
/dev/*
  X-Robots-Tag: noindex, nofollow
`;
const preview = process.env.SITE_INDEXABLE === 'false' || (process.env.CF_PAGES === '1' && process.env.CF_PAGES_BRANCH !== (process.env.PRODUCTION_BRANCH || 'main'));
if (preview) headers = headers.replace('/*\n', '/*\n  X-Robots-Tag: noindex, nofollow\n');
await writeFile('out/_headers', headers);
// Pages cannot serve a file over 25 MiB. Fail the build before deployment.
async function check(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) await check(file);
    else if ((await stat(file)).size > 25 * 1024 * 1024) throw new Error(`Cloudflare Pages file exceeds 25 MiB: ${file}`);
  }
}
await check('out');
console.log('Cloudflare Pages export prepared; asset size limits passed.');
