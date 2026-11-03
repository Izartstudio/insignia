import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';

const read = file => readFile(path.join('out', file), 'utf8');
const origin = new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://insignia.lumikai.com').origin;
const html = await read('index.html');
assert.match(html, /<html[^>]*lang="en"/);
assert.match(html, /<title>Insignia/);
assert.match(html, /name="description"/);
const canonical = html.match(/<link[^>]*rel="canonical"[^>]*href="([^"]+)"/);
assert.ok(canonical, 'Missing canonical');
assert.equal(new URL(canonical[1]).href, `${origin}/`);
assert.match(html, /application\/ld\+json/);
assert.match(html, /Who has been at Insignia/);
assert.doesNotMatch(html, /lumikai\.webflow\.io/);
const structured = [...html.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/gs)];
assert.ok(structured.length);
structured.forEach(match => JSON.parse(match[1]));
const sitemap = await read('sitemap.xml');
assert.ok(sitemap.includes(`<loc>${origin}/</loc>`));
assert.doesNotMatch(sitemap, /<loc>[^<]*(?:studio|\/dev\/)/);
assert.match(await read('robots.txt'), /Disallow: \/studio/);
assert.match(await read('_headers'), /X-Content-Type-Options: nosniff/);
assert.match(await read('_headers'), /max-age=31536000, immutable/);
await stat('out/404.html');
assert.match(await read('_redirects'), /\/studio https:\/\/insigniacms\.sanity\.studio\/ 302/);
for (const file of ['out/dev/leaders.html', 'out/studio.html']) {
  await assert.rejects(stat(file), { code: 'ENOENT' });
}
const image = await readFile('out/opengraph-image');
assert.equal(image.readUInt32BE(16), 1200);
assert.equal(image.readUInt32BE(20), 630);
// Catch missing exported JS/CSS/fonts/images referenced by HTML before uploading.
const refs = new Set([...html.matchAll(/(?:src|href)="(\/[^"?#]*)/g)].map(match => match[1]));
for (const ref of refs) {
  if (ref === '/' || ref === '/studio') continue;
  const file = path.join('out', decodeURIComponent(ref));
  try { await stat(file); }
  catch { throw new Error(`Missing exported asset: ${ref}`); }
}
for (const file of ['models/camcorder-realism-v2.glb', 'videos/insignia-film.mp4', 'videos/insignia-poster.jpg']) await stat(path.join('out', file));
console.log(`PASS export SEO, structured data, production links, sharing image, headers, 404 and ${refs.size} asset references`);
