"use client";

import { useEffect } from "react";
import Lenis from "lenis";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

/** One document scroller, driven by the same ticker as the pinned animations. */
export function SmoothScrolling() {
  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    // Browser toolbar expansion is not a layout/orientation change. Re-pinning
    // on those height-only mobile resize events causes visible scroll jumps.
    ScrollTrigger.config({ ignoreMobileResize: true });
    const media = gsap.matchMedia();

    // Keep touch scrolling and inertia owned by the mobile browser. ScrollTrigger
    // listens to native scroll directly; Lenis is only needed on desktop.
    media.add("(min-width: 1025px) and (prefers-reduced-motion: no-preference)", () => {
      const lenis = new Lenis({
        autoRaf: false,
        lerp: 0.1,
        smoothWheel: true,
        syncTouch: false,
        anchors: true,
        prevent: (node) => node.classList.contains("menu-panel"),
      });
      const updateScroll = () => ScrollTrigger.update();
      // Wall-clock time keeps Lenis independent of GSAP's global lag settings.
      const tick = () => lenis.raf(performance.now());
      const resize = () => lenis.resize();

      // Respect the navbar's existing body scroll lock, including its exit animation.
      const syncLock = () => {
        if (document.body.style.overflow === "hidden" || document.body.classList.contains("gallery-mobile-locked")) lenis.stop();
        else lenis.start();
      };
      const lockObserver = new MutationObserver(syncLock);
      lockObserver.observe(document.body, { attributes: true, attributeFilter: ["style", "class"] });
      syncLock();
      lenis.on("scroll", updateScroll);
      gsap.ticker.add(tick);
      ScrollTrigger.addEventListener("refresh", resize);

      return () => {
        lockObserver.disconnect();
        ScrollTrigger.removeEventListener("refresh", resize);
        gsap.ticker.remove(tick);
        lenis.off("scroll", updateScroll);
        lenis.destroy();
      };
    });

    return () => media.revert();
  }, []);

  return null;
}
