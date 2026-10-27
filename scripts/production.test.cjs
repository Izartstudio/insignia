const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

function load(relative, globals = {}, imports = {}) {
  const code = ts.transpileModule(fs.readFileSync(path.join(__dirname, '..', relative), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  const exports = {};
  new Function('exports', 'require', ...Object.keys(globals), code)(exports, name => {
    if (!(name in imports)) throw new Error(`Unexpected import ${name}`);
    return imports[name];
  }, ...Object.values(globals));
  return exports;
}

test('canonical URL and discovery routes follow the configured custom domain', () => {
  const config = load('src/config/site.ts', { process: { env: { NEXT_PUBLIC_SITE_URL: 'https://summit.example.com/', VERCEL_ENV: 'production' } } });
  assert.equal(config.siteUrl, 'https://summit.example.com');
  const sitemap = load('src/app/sitemap.ts', {}, { '@/config/site': config }).default();
  const robots = load('src/app/robots.ts', {}, { '@/config/site': config }).default();
  assert.deepEqual(sitemap.map(page => page.url), ['https://summit.example.com/']);
  assert.equal(robots.sitemap, 'https://summit.example.com/sitemap.xml');
  assert.ok(robots.rules.disallow.includes('/studio'));
});

test('preview deployments are not indexed and contain no sitemap entries', () => {
  const config = load('src/config/site.ts', { process: { env: { VERCEL_ENV: 'preview' } } });
  assert.equal(config.indexableDeployment, false);
  assert.equal(load('src/app/robots.ts', {}, { '@/config/site': config }).default().rules.disallow, '/');
  assert.deepEqual(load('src/app/sitemap.ts', {}, { '@/config/site': config }).default(), []);
});

test('credentials and unsafe URL schemes cannot become public canonical URLs', () => {
  for (const url of ['javascript:alert(1)', 'https://user:password@example.com/']) {
    assert.throws(() => load('src/config/site.ts', { process: { env: { NEXT_PUBLIC_SITE_URL: url } } }));
  }
});

test('analytics is inert without configuration and routes events to the configured property', () => {
  const calls = [];
  const window = { gtag: (...args) => calls.push(args) };
  const api = load('src/lib/analytics.ts', { window });
  api.trackEvent('section_view', { section_id: 'about-insignia' });
  assert.equal(calls.length, 0);
  window.insigniaAnalyticsId = 'G-FBKLWYJ4WZ';
  api.trackEvent('section_view', { section_id: 'about-insignia' });
  assert.deepEqual(calls[0], ['event', 'section_view', { section_id: 'about-insignia', send_to: 'G-FBKLWYJ4WZ' }]);
});

test('patched typeid UUID dependency preserves the Sanity CLI ID round trip', async () => {
  const { typeid, fromString, toUUID } = await import('typeid-js');
  const id = typeid('attendee');
  assert.equal(toUUID(fromString(id.toString())), id.toUUID());
});
