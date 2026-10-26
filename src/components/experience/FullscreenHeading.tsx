"use client";

import gsap from "gsap";
import { forwardRef, useImperativeHandle, useLayoutEffect, useRef } from "react";
import { sceneConfig } from "@/config/scene";

export type FullscreenHeadingHandle = {
  reveal: () => void;
  hide: () => void;
};

export const FullscreenHeading = forwardRef<FullscreenHeadingHandle>(function FullscreenHeading(_, forwardedRef) {
  const root = useRef<HTMLDivElement>(null);
  const tween = useRef<gsap.core.Tween | null>(null);
  const visible = useRef(false);

  const animate = (show: boolean) => {
    const element = root.current;
    if (!element || visible.current === show) return;
    visible.current = show;
    tween.current?.kill();
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    tween.current = gsap.to(element, {
      autoAlpha: show ? 1 : 0,
      y: show || reducedMotion ? 0 : sceneConfig.heading.offsetY,
      duration: reducedMotion ? 0 : show ? sceneConfig.heading.revealDuration : sceneConfig.heading.hideDuration,
      ease: show ? sceneConfig.heading.revealEase : sceneConfig.heading.hideEase,
      overwrite: true,
    });
  };

  useImperativeHandle(forwardedRef, () => ({
    reveal: () => animate(true),
    hide: () => animate(false),
  }));

  useLayoutEffect(() => {
    const element = root.current;
    if (!element) return;
    gsap.set(element, { autoAlpha: 0, y: sceneConfig.heading.offsetY });
    return () => {
      tween.current?.kill();
    };
  }, []);

  useLayoutEffect(() => {
    const element = root.current;
    const heading = element?.querySelector("h1");
    if (!element || !heading) return;
    let disposed = false;
    const fit = () => {
      if (disposed || heading.clientWidth === 0) return;
      // Start with the responsive CSS size; only shrink when it exceeds 3 lines.
      heading.style.removeProperty("font-size");
      const base = parseFloat(getComputedStyle(heading).fontSize);
      const fits = () => heading.scrollHeight <= parseFloat(getComputedStyle(heading).lineHeight) * 3 + 1;
      if (fits()) return;
      let low = 1, high = base;
      for (let i = 0; i < 18; i++) {
        const size = (low + high) / 2;
        heading.style.fontSize = `${size}px`;
        if (fits()) low = size; else high = size;
      }
      heading.style.fontSize = `${Math.floor(low * 10) / 10}px`;
    };
    const observer = new ResizeObserver(fit);
    observer.observe(element);
    void document.fonts.ready.then(fit);
    fit();
    return () => { disposed = true; observer.disconnect(); };
  }, []);

  return (
    <div ref={root} className="fullscreen-heading">
      <h1>
        <span>The Conversations That</span>
        <span>Define Market Shifts.</span>
      </h1>
    </div>
  );
});
