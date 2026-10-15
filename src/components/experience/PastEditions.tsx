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

  useLayoutEffect(() => {
    const stage = stageRef.current;
    const viewport = viewportRef.current;
    const track = trackRef.current;
    const progress = progressRef.current;
    if (!stage || !viewport || !track || !progress) return;
    gsap.registerPlugin(ScrollTrigger);
    const media = gsap.matchMedia();
    const distance = () => Math.max(0, track.scrollWidth - viewport.clientWidth);
    media.add("(prefers-reduced-motion: no-preference)", () => {
      const timeline = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: {
          // Measure upstream pins first, regardless of asynchronous mount order.
          refreshPriority: 10,
          trigger: stage,
          start: "top top",
          end: () => `+=${Math.max(1, distance())}`,
          pin: true,
          scrub: true,
          anticipatePin: 1,
          invalidateOnRefresh: true,
        },
      });
      timeline.fromTo(track, { x: 0 }, { x: () => -distance(), duration: 1 }, 0)
        .fromTo(progress, { scaleX: 0 }, { scaleX: 1, duration: 1 }, 0);
    });
    // Measure only on layout changes, never on animation frames.
    let frame = 0;
    let previousWidth = -1;
    const observer = new ResizeObserver(() => {
      const width = distance();
      if (width === previousWidth) return;
      previousWidth = width;
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => ScrollTrigger.refresh());
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
        <h2 id="past-editions-title">Every Edition Explores A Defining<br className="past-editions-desktop-break" /> Question For The Indian Industry</h2>
      </header>
      <div ref={stageRef} className="past-editions-stage">
        <div className="past-editions-divider" aria-hidden="true"><span ref={progressRef} /></div>
        <div ref={viewportRef} className="past-editions-viewport" tabIndex={0} role="region" aria-label="Past editions gallery">
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
      </div>
    </section>
  );
}
