import assert from 'node:assert/strict';
const origin = new URL(process.argv[2] || 'http://localhost:3000').origin;
const canonicalOrigin = process.env.NEXT_PUBLIC_SITE_URL || 'https://insignia-lumikai.vercel.app';
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
  assert.match(html, /G-FBKLWYJ4WZ/);
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
if (failures.length) process.exitCode = 1;
