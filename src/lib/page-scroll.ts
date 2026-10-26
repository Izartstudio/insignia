import gsap from 'gsap';

export type PageScrollOptions = { duration: number; onComplete: () => void };
type AnimatedScroller = (top: number, options: PageScrollOptions) => () => void;
let animateScroll: AnimatedScroller | null = null;

export function setAnimatedPageScroller(scroller: AnimatedScroller | null) {
  animateScroll = scroller;
}

/** Let the document's scroller own a whole transition, rather than resetting it per frame. */
export function animatePageScroll(top: number, options: PageScrollOptions) {
  if (animateScroll) return animateScroll(top, options);
  const position = { top: window.scrollY };
  const tween = gsap.to(position, {
    top, duration: options.duration, ease: 'power2.inOut',
    onUpdate: () => window.scrollTo({ top: position.top, behavior: 'instant' }),
    onComplete: options.onComplete,
  });
  return () => { tween.kill(); };
}
