import type gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { animatePageScroll } from '@/lib/page-scroll';

/** Detect renewed input even when a trackpad's momentum never leaves an idle gap. */
export function createWheelIntent() {
  let lastAt = -Infinity;
  let lastDelta = 0;
  let peak = 0;
  let acceptedAt = -Infinity;
  let decayed = false;
  return (delta: number, now: number) => {
    const magnitude = Math.abs(delta);
    const previous = Math.abs(lastDelta);
    const idle = now - lastAt >= 140;
    const reversed = Math.sign(delta) !== Math.sign(lastDelta);
    const renewed = decayed && now - acceptedAt >= 120 && magnitude >= 1 && magnitude - previous >= .5 && magnitude >= previous * 1.5;
    // A held mouse wheel can produce equally sized ticks indefinitely. It must
    // re-arm after a transition without requiring a pause or pointer movement.
    const sustained = now - acceptedAt >= 1000 && magnitude >= Math.max(1, peak * .7) && magnitude >= previous * .9;
    const intent = idle || reversed || renewed || sustained;
    lastAt = now;
    lastDelta = delta;
    peak = idle || reversed ? magnitude : Math.max(peak, magnitude);
    if (intent) {
      acceptedAt = now;
      decayed = false;
      peak = magnitude;
    } else if (magnitude <= peak * .6) {
      decayed = true;
    }
    return intent;
  };
}

/** One state per intent; keep at most one renewed gesture during a transition. */
export function installGalleryScrollSnap(section: HTMLElement, timeline: gsap.core.Timeline | null, stops: readonly number[], mobileStep?: (direction: number) => void) {
  let cancelTransition: (() => void) | null = null;
  let nextInputAt = 0;
  let acceptWheel = createWheelIntent();
  let queued: { direction: number } | null = null;
  let queueTimer: ReturnType<typeof setTimeout> | undefined;
  let transitionDeadline = 0;
  let animating = false;
  let targetIndex: number | null = null;
  const trigger = timeline?.scrollTrigger;
  let previousScrollY = window.scrollY;
  const inGallery = () => mobileStep
    ? section.classList.contains('is-mobile-entered')
    : !!trigger && window.scrollY >= trigger.start - 2 && window.scrollY <= trigger.end + 2;
  const blocked = () => section.inert || section.classList.contains('has-photo-dialog') || section.classList.contains('is-mobile-closing');
  const animateTo = (top: number) => {
    animating = true;
    transitionDeadline = performance.now() + 1200;
    cancelTransition = animatePageScroll(Math.max(0, top), {
      duration: .85,
      onComplete: () => {
        previousScrollY = window.scrollY;
        ScrollTrigger.update();
        animating = false;
        cancelTransition = null;
        nextInputAt = performance.now() + 140;
        const pending = queued;
        queued = null;
        if (pending) {
          // Run after the scroller finishes its own completion/reset work.
          queueTimer = setTimeout(() => {
            if (!blocked() && inGallery()) step(pending.direction);
          }, 0);
        }
      },
    });
  };
  const step = (direction: number) => {
    if (mobileStep) { mobileStep(direction); return; }
    if (!trigger || animating) return;
    const progress = (window.scrollY - trigger.start) / (trigger.end - trigger.start);
    const current = targetIndex ?? stops.reduce((nearest, stop, index) => Math.abs(stop - progress) < Math.abs(stops[nearest] - progress) ? index : nearest, 0);
    const next = current + direction;
    const top = next < 0 ? trigger.start - section.clientHeight
      : next >= stops.length ? trigger.end + section.clientHeight
      : trigger.start + stops[next] * (trigger.end - trigger.start);
    targetIndex = next >= 0 && next < stops.length ? next : null;
    animateTo(top);
  };
  const wheel = (event: WheelEvent) => {
    if (event.ctrlKey || Math.abs(event.deltaY) <= Math.abs(event.deltaX) || !event.deltaY || blocked()) return;
    const direction = Math.sign(event.deltaY);
    const pixels = event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? window.innerHeight : 1);
    const entering = !mobileStep && trigger && ((window.scrollY < trigger.start && window.scrollY + pixels >= trigger.start) || (window.scrollY > trigger.end && window.scrollY + pixels <= trigger.end));
    if (!inGallery() && !entering && !animating) {
      targetIndex = null;
      acceptWheel = createWheelIntent();
      queued = null;
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    const now = performance.now();
    const newGesture = acceptWheel(pixels, now);
    // Recover if a menu/dialog or another document animation interrupted Lenis
    // before its completion callback. Never leave the gallery permanently locked.
    if (animating && now >= transitionDeadline) {
      cancelTransition?.();
      cancelTransition = null;
      animating = false;
      targetIndex = null;
      queued = null;
    }
    if (animating) {
      if (newGesture) queued = { direction };
      return;
    }
    if (!newGesture) return;
    if (entering && trigger) {
      targetIndex = direction > 0 ? 0 : stops.length - 1;
      animateTo(direction > 0 ? trigger.start : trigger.start + stops[stops.length - 1] * (trigger.end - trigger.start));
      return;
    }
    step(direction);
  };
  const keydown = (event: KeyboardEvent) => {
    if (blocked() || !inGallery() || event.altKey || event.ctrlKey || event.metaKey) return;
    if (event.target instanceof Element && event.target.closest('input, textarea, select, button, a, [contenteditable="true"], [role="dialog"]')) return;
    const direction = ['ArrowDown', 'PageDown', ' '].includes(event.key) ? (event.shiftKey ? -1 : 1)
      : ['ArrowUp', 'PageUp'].includes(event.key) ? -1 : 0;
    if (!direction) return;
    event.preventDefault();
    event.stopPropagation();
    if (!animating && performance.now() >= nextInputAt && !event.repeat) {
      nextInputAt = performance.now() + 180;
      step(direction);
    }
  };
  // Smooth page scrolling can cross the boundary after the last wheel event.
  // Catch that crossing so entry always settles on the first/last state.
  const scroll = () => {
    const previous = previousScrollY;
    previousScrollY = window.scrollY;
    if (!trigger || mobileStep || animating || blocked()) return;
    const fromAbove = previous < trigger.start && window.scrollY >= trigger.start;
    const fromBelow = previous > trigger.end && window.scrollY <= trigger.end;
    if (fromAbove || fromBelow) {
      targetIndex = fromAbove ? 0 : stops.length - 1;
      animateTo(trigger.start + stops[targetIndex] * (trigger.end - trigger.start));
    } else if (!inGallery()) {
      targetIndex = null;
    }
  };
  window.addEventListener('scroll', scroll, { passive: true });
  let touchStart: { x: number; y: number } | null = null;
  const touchstart = (event: TouchEvent) => {
    if (mobileStep || blocked() || !inGallery() || animating || event.touches.length !== 1) {
      touchStart = null;
      return;
    }
    touchStart = { x: event.touches[0].clientX, y: event.touches[0].clientY };
  };
  const touchmove = (event: TouchEvent) => {
    if (!mobileStep && !blocked() && (touchStart || animating) && event.touches.length === 1) {
      event.preventDefault();
    }
  };
  const touchend = (event: TouchEvent) => {
    const start = touchStart;
    touchStart = null;
    if (!start || blocked() || animating || !event.changedTouches.length) return;
    const dx = start.x - event.changedTouches[0].clientX;
    const dy = start.y - event.changedTouches[0].clientY;
    if (Math.abs(dy) >= 30 && Math.abs(dy) > Math.abs(dx)) step(Math.sign(dy));
  };
  const touchcancel = () => { touchStart = null; };
  window.addEventListener('touchstart', touchstart, { passive: true, capture: true });
  window.addEventListener('touchmove', touchmove, { passive: false, capture: true });
  window.addEventListener('touchend', touchend, { capture: true });
  window.addEventListener('touchcancel', touchcancel, { capture: true });
  window.addEventListener('wheel', wheel, { passive: false, capture: true });
  window.addEventListener('keydown', keydown, { capture: true });
  return () => {
    animating = false;
    queued = null;
    clearTimeout(queueTimer);
    cancelTransition?.();
    window.removeEventListener('scroll', scroll);
    window.removeEventListener('touchstart', touchstart, { capture: true });
    window.removeEventListener('touchmove', touchmove, { capture: true });
    window.removeEventListener('touchend', touchend, { capture: true });
    window.removeEventListener('touchcancel', touchcancel, { capture: true });
    window.removeEventListener('wheel', wheel, { capture: true });
    window.removeEventListener('keydown', keydown, { capture: true });
  };
}
