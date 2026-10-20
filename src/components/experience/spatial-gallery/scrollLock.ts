// Nested gallery/detail locks share one document position and restore only on final exit.
const locks = new Map<symbol, HTMLElement | undefined>();
let restore: (() => void) | undefined;

export function lockPageScroll(scrollable?: HTMLElement) {
  const token = Symbol();
  locks.set(token, scrollable);
  if (!restore) {
    const root = document.documentElement;
    const body = document.body;
    const x = window.scrollX, y = window.scrollY;
    const rootOverflow = root.style.overflow, bodyOverflow = body.style.overflow;
    const overscroll = root.style.overscrollBehavior;
    root.style.overflow = body.style.overflow = 'hidden';
    root.style.overscrollBehavior = 'none';
    const prevent = (event: Event) => {
      const allowed = Array.from(locks.values()).at(-1);
      if (allowed && event.target instanceof Node && allowed.contains(event.target)) return;
      if (event.cancelable) event.preventDefault();
    };
    const preventKey = (event: KeyboardEvent) => {
      if (['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', ' '].includes(event.key)) prevent(event);
    };
    const keepPosition = () => {
      if (window.scrollX !== x || window.scrollY !== y) window.scrollTo({ left: x, top: y, behavior: 'instant' });
    };
    document.addEventListener('touchmove', prevent, { passive: false, capture: true });
    document.addEventListener('wheel', prevent, { passive: false, capture: true });
    document.addEventListener('keydown', preventKey, { capture: true });
    window.addEventListener('scroll', keepPosition);
    restore = () => {
      document.removeEventListener('touchmove', prevent, { capture: true });
      document.removeEventListener('wheel', prevent, { capture: true });
      document.removeEventListener('keydown', preventKey, { capture: true });
      window.removeEventListener('scroll', keepPosition);
      root.style.overflow = rootOverflow;
      body.style.overflow = bodyOverflow;
      root.style.overscrollBehavior = overscroll;
    };
  }
  return () => {
    locks.delete(token);
    if (!locks.size) { restore?.(); restore = undefined; }
  };
}
