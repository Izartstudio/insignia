"use client";

import { useEffect } from "react";
import Lenis from "lenis";
import { setAnimatedPageScroller } from "@/lib/page-scroll";
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
      setAnimatedPageScroller((top, { duration, onComplete }) => {
        lenis.scrollTo(top, {
          duration,
          easing: t => t * t * (3 - 2 * t),
          force: true,
          lock: true,
          onComplete,
        });
        return () => lenis.scrollTo(lenis.actualScroll, { immediate: true, force: true });
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
        setAnimatedPageScroller(null);
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
