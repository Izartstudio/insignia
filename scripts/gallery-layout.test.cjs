const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const sharp = require('sharp');
const design = require('../src/content/gallery-design.json');
function load(file, imports) {
  const code = ts.transpileModule(fs.readFileSync(path.join(__dirname, '..', file), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
  const exports = {};
  new Function('require', 'exports', code)(name => {
    if (!(name in imports)) throw new Error(`Unexpected import ${name}`);
    return imports[name];
  }, exports);
  return exports;
}
const content = load('src/content/spatial-gallery.ts', { './gallery-design.json': { default: design } });
const imports = { '@/content/spatial-gallery': content, '@/content/gallery-design.json': { default: design } };
const { mapDesktopReferencePhoto } = load('src/components/experience/spatial-gallery/desktop-composition.ts', imports);
const { mapPhoto, fitPhotoLayouts } = load('src/components/experience/spatial-gallery/layout.ts', imports);
const units = height => 2 * content.galleryConfig.distance * Math.tan(content.galleryConfig.fov * Math.PI / 360) / height;
const dimensions = Promise.all(content.galleryStates.map(async state => ({ ...state, photos: await Promise.all(state.photos.map(async photo => {
  const metadata = await sharp(path.join(__dirname, '../public', photo.src)).metadata();
  return { ...photo, aspect: metadata.width / metadata.height };
})) })));

test('all 29 supplied photos exist, including the seventh leader', async () => {
  const states = await dimensions;
  assert.deepEqual(states.map(s => s.photos.length), [7, 7, 8, 7]);
  assert.equal(new Set(states.flatMap(s => s.photos.map(p => p.src))).size, 29);
  assert.equal(states[0].photos[6].name, '');
});

test('desktop photo centres match every supplied 1440 × 900 design rectangle', async () => {
  for (const state of await dimensions) for (const [index, photo] of state.photos.entries()) {
    const layout = mapDesktopReferencePhoto(state.id, photo, index, state.photos.length, 1440, 900, photo.aspect);
    const [x, y, w, h] = design[state.id][index].rect;
    assert.ok(Math.abs(layout.position[0] / units(900) + 720 - (x + w / 2)) < .001);
    assert.ok(Math.abs(450 - layout.position[1] / units(900) - (y + h / 2)) < .001);
    assert.ok(layout.scale[0] / units(900) <= w + .001);
    assert.ok(layout.scale[1] / units(900) <= h + .001);
    assert.deepEqual(layout.repeat, [1, 1], 'Full supplied image must remain visible');
    assert.ok(Math.abs(layout.scale[0] / layout.scale[1] - photo.aspect) < .0001);
  }
});

test('all photos remain inside phone, tablet, laptop and ultrawide viewports without overlap', async () => {
  const viewports = [[320,568],[360,640],[375,667],[390,844],[430,932],[600,800],[768,1024],[820,1180],[1024,768],[812,375],[1025,600],[1280,720],[1366,500],[1440,900],[1920,1080],[2560,1440],[3440,1440]];
  for (const [width, height] of viewports) for (const state of await dimensions) {
    const mobile = width <= 1024;
    const layouts = state.photos.map((photo, index) => mobile
      ? mapPhoto(photo, index, height * Math.min(width / height, 1.6), height, photo.aspect, true)
      : mapDesktopReferencePhoto(state.id, photo, index, state.photos.length, width, height, photo.aspect));
    if (mobile) {
      fitPhotoLayouts(layouts, width, height);
      layouts.forEach(layout => { layout.scale[0] *= .75; layout.scale[1] *= .75; });
    }
    const boxes = layouts.map(layout => ({
      left: width / 2 + (layout.position[0] - layout.scale[0] / 2) / units(height),
      right: width / 2 + (layout.position[0] + layout.scale[0] / 2) / units(height),
      top: height / 2 - (layout.position[1] + layout.scale[1] / 2) / units(height),
      bottom: height / 2 - (layout.position[1] - layout.scale[1] / 2) / units(height),
    }));
    for (const box of boxes) {
      const margin = mobile ? 0 : 12; // Include the full desktop pointer parallax range.
      assert.ok(box.left >= margin && box.right <= width - margin && box.top >= 0 && box.bottom <= height, `${state.id} clipped at ${width}x${height}: ${JSON.stringify(box)}`);
    }
    for (let i = 0; i < boxes.length; i++) for (let j = i + 1; j < boxes.length; j++) {
      const a = boxes[i], b = boxes[j];
      assert.ok(a.right <= b.left || b.right <= a.left || a.bottom <= b.top || b.bottom <= a.top, `${state.id} photos overlap at ${width}x${height}`);
    }
  }
});
