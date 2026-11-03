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

test('patched minimatch remains compatible with the Sanity CLI plugin matcher', () => {
  const { createRequire } = require('node:module');
  const cliRequire = createRequire(require.resolve('@oclif/core'));
  const { minimatch, Minimatch } = cliRequire('minimatch');
  const dependencies = ['@sanity/plugin-a', '@sanity/plugin-b', 'sanity', 'other-tool'];
  assert.deepEqual(dependencies.filter(name => minimatch(name, '@sanity/*')), ['@sanity/plugin-a', '@sanity/plugin-b']);
  assert.equal(minimatch('sanity', 'san*'), true);
  assert.equal(minimatch('other-tool', 'san*'), false);
  assert.equal(new Minimatch('src/**/gallery*.ts', { optimizationLevel: 2 }).match('src/components/gallery.ts'), true);
});


test('Cloudflare previews and explicitly disabled indexing stay out of search', () => {
  for (const env of [
    { CF_PAGES: '1', CF_PAGES_BRANCH: 'feature/test' },
    { SITE_INDEXABLE: 'false' },
  ]) {
    const config = load('src/config/site.ts', { process: { env } });
    assert.equal(config.indexableDeployment, false);
  }
  const production = load('src/config/site.ts', { process: { env: { CF_PAGES: '1', CF_PAGES_BRANCH: 'main' } } });
  assert.equal(production.indexableDeployment, true);
  assert.equal(production.siteUrl, 'https://insignia.lumikai.com');
});

test('corporate navigation uses the live domain and verified people route', () => {
  const { navigation } = load('src/config/navigation.ts');
  assert.equal(navigation.home, 'https://www.lumikai.com');
  assert.equal(navigation.primary.find(link => link.label === 'Team').href, 'https://www.lumikai.com/people');
  for (const link of [...navigation.primary, ...navigation.secondary]) {
    assert.ok(link.href === '/' || new URL(link.href).origin === navigation.home);
  }
});

test('static CMS images become bounded same-origin assets and duplicate downloads are shared', async () => {
  let requests = 0;
  const writes = [];
  const requestedSizes = [];
  const { snapshotStaticImages } = load('src/sanity/staticAssets.ts', {
    process: { env: { CLOUDFLARE_PAGES: '1' }, cwd: () => '/tmp/insignia-test' },
    Buffer,
    AbortSignal,
    fetch: async url => {
      requests++;
      const parsed = new URL(url);
      assert.equal(parsed.hostname, 'cdn.sanity.io');
      requestedSizes.push(parsed.searchParams.get('w'));
      assert.ok(['512', '768', '1600'].includes(parsed.searchParams.get('w')));
      assert.equal(parsed.searchParams.get('fm'), 'webp');
      return { ok: true, headers: new Headers({ 'content-type': 'image/webp' }), arrayBuffer: async () => Buffer.from('image') };
    },
  }, {
    'node:crypto': require('node:crypto'),
    'node:fs/promises': { mkdir: async () => {}, writeFile: async (...args) => writes.push(args) },
    'node:path': { default: path },
  });
  const src = 'https://cdn.sanity.io/images/project/production/image.webp';
  const result = await snapshotStaticImages({ desktop: [{ src }], mobile: [{ src }], local: { src: '/assets/portrait.webp' } });
  assert.equal(requests, 1);
  assert.equal(writes.length, 1);
  assert.match(result.desktop[0].src, /^\/cms\/[a-f0-9]{24}\.webp$/);
  assert.equal(result.desktop[0].src, result.mobile[0].src);
  assert.equal(result.local.src, '/assets/portrait.webp');
  const photo = { src, layout: [0, 0, 1, 1] };
  const gallery = await snapshotStaticImages({ desktop: [photo], mobile: [photo] });
  assert.ok(gallery.desktop[0].textureSrc.startsWith('/cms/'));
  assert.ok(gallery.mobile[0].textureSrc.startsWith('/cms/'));
  assert.deepEqual(requestedSizes.sort(), ['1600', '512', '768']);
  assert.equal(requests, 3, 'Detail images should be shared while textures use device-specific bounds');
  await assert.rejects(snapshotStaticImages({ src: 'https://untrusted.example/image.webp' }), /Sanity image CDN/);
});


test('gallery preloads and texture requests share the same bounded URL', () => {
  const { galleryTextureUrl } = load('src/components/experience/spatial-gallery/galleryTextureUrl.ts');
  const origin = 'https://insignia.lumikai.com';
  assert.equal(galleryTextureUrl({ src: '/cms/detail.webp', textureSrc: '/cms/mobile.webp' }, true, origin).href, `${origin}/cms/mobile.webp`);
  const remote = { src: 'https://cdn.sanity.io/images/project/production/portrait.webp' };
  assert.equal(galleryTextureUrl(remote, true, origin).searchParams.get('w'), '512');
  assert.equal(galleryTextureUrl(remote, false, origin).searchParams.get('w'), '768');
});

function galleryReader(env, fetch) {
  const galleryStates = ['leaders', 'founders', 'experts', 'investors'].map(id => ({ id, photos: [{ src: '/fallback.webp', name: 'Fallback attendee' }] }));
  return load('src/sanity/galleryContent.ts', {
    process: { env },
    console: { info() {}, warn() {} },
  }, {
    './staticAssets': { snapshotStaticImages: async content => content },
    'next-sanity': { defineQuery: query => query, createClient: options => {
      if (env.CLOUDFLARE_PAGES === '1') assert.equal(options.useCdn, false);
      return { fetch };
    } },
    '@/content/spatial-gallery': { galleryStates, automaticGalleryPlacement: () => [0, 0, 1, 1] },
  }).getSpatialGalleryContent;
}

test('Cloudflare builds reject missing Sanity configuration, failed requests and missing published records', async () => {
  await assert.rejects(galleryReader({ CLOUDFLARE_PAGES: '1' })(), /requires NEXT_PUBLIC_SANITY_PROJECT_ID/);
  const env = { CLOUDFLARE_PAGES: '1', NEXT_PUBLIC_SANITY_PROJECT_ID: 'project' };
  await assert.rejects(galleryReader(env, async () => { throw new Error('CMS unavailable'); })(), /Cloudflare gallery build failed.*CMS unavailable/);
  await assert.rejects(galleryReader(env, async () => [])(), /Missing published Sanity document/);
});

test('Cloudflare gallery builds use fresh published names with their own images', async () => {
  const documents = ['spatialGalleryDesktop', 'spatialGalleryMobile'].map(_id => ({
    _id, _rev: 'published-revision',
    ...Object.fromEntries(['leaders', 'founders', 'experts', 'investors'].map(id => [id, {
      photos: [{ name: `${id} published name`, src: `https://cdn.sanity.io/images/project/production/${id}.webp` }],
    }])),
  }));
  const get = galleryReader({ CLOUDFLARE_PAGES: '1', NEXT_PUBLIC_SANITY_PROJECT_ID: 'project' }, async (query, params) => {
    assert.ok(params._build, 'Restored build caches must not reuse an old CMS query response');
    return documents;
  });
  const result = await get();
  for (const layout of ['desktop', 'mobile']) for (const group of result[layout]) {
    assert.equal(group.photos[0].name, `${group.id} published name`);
    assert.equal(group.photos[0].src, `https://cdn.sanity.io/images/project/production/${group.id}.webp`);
  }
});
