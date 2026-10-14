"use client";

import { useEffect } from "react";
import Lenis from "lenis";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

/** One document scroller, driven by the same ticker as the pinned animations. */
export function SmoothScrolling() {
  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const media = gsap.matchMedia();

    media.add("(prefers-reduced-motion: no-preference)", () => {
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
        if (document.body.style.overflow === "hidden") lenis.stop();
        else lenis.start();
      };
      const lockObserver = new MutationObserver(syncLock);
      lockObserver.observe(document.body, { attributes: true, attributeFilter: ["style"] });
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
