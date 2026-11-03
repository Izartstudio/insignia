import assert from 'node:assert/strict';
const origin = new URL(process.argv[2] || 'http://localhost:3000').origin;
const canonicalOrigin = process.env.NEXT_PUBLIC_SITE_URL || 'https://insignia.lumikai.com';
const failures = [];
async function check(name, fn) {
  try { await fn(); console.log(`PASS ${name}`); }
  catch (error) { failures.push(name); console.error(`FAIL ${name}: ${error.message}`); }
}
await check('home page SEO and server-rendered content', async () => {
  const response = await fetch(origin);
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /<html[^>]*lang="en"/);
  assert.match(html, /<title>Insignia/);
  const canonical = html.match(/<link[^>]*rel="canonical"[^>]*href="([^"]+)"/);
  assert.ok(canonical, 'Missing canonical tag');
  assert.equal(new URL(canonical[1]).href, `${new URL(canonicalOrigin).origin}/`);
  assert.match(html, /name="description"/);
  assert.match(html, /application\/ld\+json/);
  assert.match(html, /Who has been at Insignia/);
  assert.ok(html.includes(process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || 'G-FBKLWYJ4WZ'));
  assert.equal(response.headers.get('x-content-type-options'), 'nosniff');
});
await check('robots and sitemap', async () => {
  const robots = await fetch(`${origin}/robots.txt`);
  assert.equal(robots.status, 200);
  const text = await robots.text();
  assert.match(text, /Disallow: \/studio/);
  assert.match(text, /Sitemap: https:\/\//);
  const sitemap = await fetch(`${origin}/sitemap.xml`);
  assert.equal(sitemap.status, 200);
  const xml = await sitemap.text();
  assert.ok(xml.includes(`<loc>${new URL(canonicalOrigin).origin}/</loc>`));
  assert.doesNotMatch(xml, /<loc>[^<]*(?:studio|\/dev\/)/);
});
await check('social sharing image', async () => {
  const image = await fetch(`${origin}/opengraph-image`);
  assert.equal(image.status, 200);
  assert.match(image.headers.get('content-type') || '', /image\/png/);
  const bytes = Buffer.from(await image.arrayBuffer());
  assert.equal(bytes.readUInt32BE(16), 1200);
  assert.equal(bytes.readUInt32BE(20), 630);
});
await check('development preview is not a production page', async () => {
  const response = await fetch(`${origin}/dev/leaders`);
  assert.equal(response.status, 404);
  assert.match(response.headers.get('x-robots-tag') || '', /noindex/);
});
await check('Studio remains on its independent Sanity host', async () => {
  const response = await fetch(`${origin}/studio`, { redirect: 'manual' });
  assert.equal(response.status, 302);
  assert.equal(response.headers.get('location'), 'https://insigniacms.sanity.studio/');
});
await check('unknown URLs return real 404s', async () => {
  assert.equal((await fetch(`${origin}/missing-production-check-page`)).status, 404);
});
await check('model and movie range delivery', async () => {
  for (const file of ['/models/camcorder-realism-v2.glb', '/videos/insignia-film.mp4']) {
    const response = await fetch(`${origin}${file}`, { headers: { Range: 'bytes=0-31' } });
    // Pages documents full 200 responses to Range requests; both forms are valid here.
    assert.ok([200, 206].includes(response.status), `Media unavailable: ${file}`);
    if (response.status === 206) assert.match(response.headers.get('content-range') || '', /^bytes 0-31\//);
    const bytes = Buffer.from(await response.arrayBuffer());
    if (response.status === 206) assert.equal(bytes.length, 32);
    else assert.ok(bytes.length > 32);
    if (file.endsWith('.glb')) assert.equal(bytes.toString('ascii', 0, 4), 'glTF');
    else assert.equal(bytes.toString('ascii', 4, 8), 'ftyp');
  }
});
if (failures.length) process.exitCode = 1;
