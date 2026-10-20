"use client";

import { useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { editionCells, pastEditions } from "@/content/past-editions";
import { EditionMarqueeItem } from "./EditionMarqueeItem";

export function PastEditions() {
  const stageRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLSpanElement>(null);
  const scrollTriggerRef = useRef<ScrollTrigger | null>(null);

  const navigationRef = useRef<gsap.core.Tween | null>(null);
  const targetYearRef = useRef<number | null>(null);

  const cancelNavigation = () => {
    navigationRef.current?.kill();
    navigationRef.current = null;
    targetYearRef.current = null;
  };

  const navigate = (direction: -1 | 1) => {
    const viewport = viewportRef.current;
    const track = trackRef.current;
    if (!viewport || !track) return;
    const years = Array.from(track.querySelectorAll<HTMLElement>('.past-editions-year'));
    if (!years.length) return;
    const distance = Math.max(0, track.scrollWidth - viewport.clientWidth);
    // Relative positions preserve the left gutter at every responsive size.
    const firstLeft = years[0].getBoundingClientRect().left;
    const stops = years.map(year => Math.min(distance, year.getBoundingClientRect().left - firstLeft));
    // The final edition is wider than the viewport; its remaining photos need one more stop.
    if (distance - stops[stops.length - 1] > 2) stops.push(distance);
    const trigger = scrollTriggerRef.current;
    const offset = trigger ? trigger.progress * distance : viewport.scrollLeft;
    let current = 0;
    stops.forEach((stop, index) => { if (offset >= stop - 2) current = index; });
    const next = Math.max(0, Math.min(stops.length - 1, (targetYearRef.current ?? current) + direction));
    cancelNavigation();
    if (!trigger || distance === 0) {
      viewport.scrollTo({ left: stops[next], behavior: 'auto' });
      return;
    }
    targetYearRef.current = next;
    const position = { y: trigger.scroll() };
    navigationRef.current = gsap.to(position, {
      y: trigger.start + (stops[next] / distance) * (trigger.end - trigger.start),
      duration: .65,
      ease: 'power2.inOut',
      onUpdate: () => { trigger.scroll(position.y); ScrollTrigger.update(); },
      onComplete: () => { navigationRef.current = null; targetYearRef.current = null; },
    });
  };

  useLayoutEffect(() => {
    // Manual scrolling takes over immediately; repeated arrow clicks advance from the pending year.
    window.addEventListener('wheel', cancelNavigation, { passive: true });
    const onTouch = (event: TouchEvent) => {
      if (!(event.target instanceof Element) || !event.target.closest('.past-editions-arrow')) cancelNavigation();
    };
    window.addEventListener('touchstart', onTouch, { passive: true });
    window.addEventListener('resize', cancelNavigation);
    const onKey = (event: KeyboardEvent) => {
      if (['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', ' '].includes(event.key)) cancelNavigation();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      cancelNavigation();
      window.removeEventListener('wheel', cancelNavigation);
      window.removeEventListener('touchstart', onTouch);
      window.removeEventListener('resize', cancelNavigation);
      window.removeEventListener('keydown', onKey);
    };
  }, []);

  useLayoutEffect(() => {
    const stage = stageRef.current;
    const viewport = viewportRef.current;
    const track = trackRef.current;
    const progress = progressRef.current;
    if (!stage || !viewport || !track || !progress) return;
    gsap.registerPlugin(ScrollTrigger);
    const media = gsap.matchMedia();
    const distance = () => Math.max(0, track.scrollWidth - viewport.clientWidth);
    const createTimeline = (trigger: HTMLElement) => {
      const timeline = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: {
          // Measure upstream pins first, regardless of asynchronous mount order.
          refreshPriority: 10,
          trigger,
          start: "top top",
          end: () => `+=${Math.max(1, distance())}`,
          pin: true,
          pinType: window.innerWidth < 768 ? 'fixed' : undefined,
          pinSpacing: true,
          scrub: true,
          anticipatePin: 1,
          invalidateOnRefresh: true,
        },
      });
      scrollTriggerRef.current = timeline.scrollTrigger ?? null;
      timeline.fromTo(track, { x: 0 }, { x: () => -distance(), duration: 1 }, 0)
        .fromTo(progress, { scaleX: 0 }, { scaleX: 1, duration: 1 }, 0);
      return () => { scrollTriggerRef.current = null; };
    };
    media.add("(min-width: 768px) and (prefers-reduced-motion: no-preference)", () => createTimeline(stage));
    media.add("(max-width: 767px) and (prefers-reduced-motion: no-preference)", () => createTimeline(stage.parentElement ?? stage));
    // Measure only on layout changes, never on animation frames.
    let frame = 0;
    let previousWidth = -1;
    const observer = new ResizeObserver(() => {
      const width = distance();
      if (width === previousWidth) return;
      previousWidth = width;
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => ScrollTrigger.refresh(true));
    });
    observer.observe(viewport);
    observer.observe(track);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
      media.revert();
    };
  }, []);

  return (
    <section id="past-editions" className="past-editions" aria-labelledby="past-editions-title">
      <header className="past-editions-heading">
        <p>PAST EDITIONS</p>
        <h2 id="past-editions-title">Every edition explores a defining<br className="past-editions-desktop-break" /> question for the Indian industry.</h2>
      </header>
      <div ref={stageRef} className="past-editions-stage">
        <div className="past-editions-divider" aria-hidden="true"><span ref={progressRef} /></div>
        <div className="past-editions-gallery">
        <div id="past-editions-photos" ref={viewportRef} className="past-editions-viewport" tabIndex={0} role="region" aria-label="Past editions gallery">
          <div ref={trackRef} className="past-editions-track">
            {pastEditions.map(edition => (
              <div className="past-editions-year" key={edition.year} role="group" aria-label={`${edition.year}: ${edition.title}`}>
                {editionCells(edition).map((item, index) => item
                  ? <EditionMarqueeItem key={item.id} item={item} />
                  : <div key={`space-${index}`} aria-hidden="true" />)}
              </div>
            ))}
          </div>
        </div>
        <button type="button" className="past-editions-arrow is-previous" aria-label="Previous edition year" aria-controls="past-editions-photos" onClick={() => navigate(-1)}>
          <img src="/assets/insignia/edition-arrow.svg" alt="" width="12" height="20" draggable={false} />
        </button>
        <button type="button" className="past-editions-arrow is-next" aria-label="Next edition year" aria-controls="past-editions-photos" onClick={() => navigate(1)}>
          <img src="/assets/insignia/edition-arrow.svg" alt="" width="12" height="20" draggable={false} />
        </button>
        </div>
      </div>
    </section>
  );
}
