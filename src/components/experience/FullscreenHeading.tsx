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

  return (
    <div ref={root} className="fullscreen-heading">
      <h1>
        <span>The Conversations That</span>
        <span>Define Market Shifts.</span>
      </h1>
    </div>
  );
});
