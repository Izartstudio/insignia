const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const path = require('node:path');

const source = ts.transpileModule(fs.readFileSync(path.join(__dirname, '../src/components/experience/spatial-gallery/scrollSnap.ts'), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS },
}).outputText;

function setup() {
  let now = 0;
  let completion;
  let cancellations = 0;
  const listeners = new Map();
  const timers = [];
  const destinations = [];
  const window = {
    scrollY: 100, innerHeight: 800,
    addEventListener: (name, handler) => listeners.set(name, handler),
    removeEventListener: name => listeners.delete(name),
  };
  const exports = {};
  const requireMock = name => name.includes('ScrollTrigger')
    ? { ScrollTrigger: { update() {} } }
    : { animatePageScroll: (top, options) => {
      destinations.push(top);
      completion = () => { window.scrollY = top; options.onComplete(); };
      return () => { cancellations++; };
    } };
  new Function('require', 'exports', 'window', 'performance', 'Element', 'setTimeout', 'clearTimeout', source)(
    requireMock, exports, window, { now: () => now }, class {},
    callback => { timers.push(callback); return callback; },
    callback => { const i = timers.indexOf(callback); if (i >= 0) timers.splice(i, 1); },
  );
  const cleanup = exports.installGalleryScrollSnap({ inert: false, clientHeight: 800, classList: { contains: () => false } },
    { scrollTrigger: { start: 100, end: 1100 } }, [0, .25, .5, .75, 1]);
  return {
    exports, destinations, listeners, cleanup,
    get cancellations() { return cancellations; },
    wheel(delta, elapsed = 16) {
      now += elapsed;
      listeners.get('wheel')({ deltaY: delta, deltaX: 0, deltaMode: 0, preventDefault() {}, stopPropagation() {} });
    },
    complete() { completion(); while (timers.length) timers.shift()(); },
  };
}

test('continuous wheel ticks advance again without pointer movement or an idle gap', () => {
  const h = setup();
  h.wheel(40);
  for (let i = 0; i < 50; i++) h.wheel(40);
  assert.deepEqual(h.destinations, [350]);
  h.complete();
  for (let i = 0; i < 14; i++) h.wheel(40);
  assert.deepEqual(h.destinations, [350, 600]);
  h.cleanup();
});

test('one accelerating flick and its decaying momentum never skip a state', () => {
  const h = setup();
  for (const delta of [1, 3, 8, 20, 50, 100, 80, 50, 25, 10, 4, 2, 1]) h.wheel(delta);
  h.complete();
  for (let i = 0; i < 100; i++) h.wheel(.5);
  assert.deepEqual(h.destinations, [350]);
  h.cleanup();
});

test('a new impulse over a momentum tail advances without waiting for silence', () => {
  const h = setup();
  h.wheel(80);
  for (let i = 0; i < 50; i++) h.wheel(80 * Math.exp(-i / 8));
  h.complete();
  h.wheel(6);
  assert.deepEqual(h.destinations, [350, 600]);
  h.cleanup();
});

test('one distinct gesture during a transition is preserved, with no event queue buildup', () => {
  const h = setup();
  h.wheel(30);
  h.wheel(30, 200);
  for (let i = 0; i < 20; i++) h.wheel(30);
  assert.deepEqual(h.destinations, [350]);
  h.complete();
  assert.deepEqual(h.destinations, [350, 600]);
  h.cleanup();
});

test('an interrupted transition recovers on the next input', () => {
  const h = setup();
  h.wheel(30);
  h.wheel(30, 1500);
  assert.equal(h.cancellations, 1);
  assert.deepEqual(h.destinations, [350, 350]);
  h.cleanup();
});

test('reverse scrolling targets the previous state and cleanup removes all handlers', () => {
  const h = setup();
  h.wheel(30); h.complete();
  h.wheel(-30, 200);
  assert.deepEqual(h.destinations, [350, 100]);
  h.cleanup();
  assert.equal(h.listeners.size, 0);
});


test('small continuous wheel ticks also re-arm after landing', () => {
  const h = setup();
  h.wheel(1);
  for (let i = 0; i < 50; i++) h.wheel(1);
  h.complete();
  for (let i = 0; i < 14; i++) h.wheel(1);
  assert.deepEqual(h.destinations, [350, 600]);
  h.cleanup();
});
