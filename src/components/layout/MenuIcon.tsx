"use client";
import { useEffect, useRef } from "react";
import gsap from "gsap";
import type { AnimationItem } from "lottie-web";
import { navMotion } from "@/config/navigation";

export function MenuIcon({ open }: { open: boolean }) {
  const container = useRef<HTMLSpanElement>(null);
  const original = useRef<SVGSVGElement>(null);
  const player = useRef<AnimationItem | null>(null);
  const tween = useRef<gsap.core.Tween | null>(null);
  const intent = useRef(open);
  const animate = useRef<() => void>(() => {});
  useEffect(() => {
    let disposed = false;
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    animate.current = () => {
      const animation = player.current;
      if (!animation) return;
      tween.current?.kill();
      const frame = { value: animation.currentFrame };
      tween.current = gsap.to(frame, {
        value: intent.current ? Math.round(animation.totalFrames / 2) : 0,
        duration: media.matches ? 0 : navMotion.total / (intent.current ? 1 : navMotion.closeSpeed),
        ease: "power3.inOut",
        onUpdate: () => {
          animation.goToAndStop(Math.round(frame.value), true);
          if (container.current) container.current.style.opacity = frame.value > 0 ? "1" : "0";
          if (original.current) original.current.style.opacity = frame.value > 0 ? "0" : "1";
        },
      });
    };
    import("lottie-web/build/player/lottie_svg").then(({ default: lottie }) => {
      if (disposed || !container.current) return;
      const animation = lottie.loadAnimation({ container: container.current, renderer: "svg", autoplay: false, loop: false, path: "/assets/insignia/menu-motion.json" });
      player.current = animation;
      animation.addEventListener("DOMLoaded", () => { if (!disposed) animate.current(); });
    }).catch(() => { /* The supplied static icon remains visible if the player fails. */ });
    media.addEventListener("change", animate.current);
    const onChange = animate.current;
    return () => { disposed = true; media.removeEventListener("change", onChange); tween.current?.kill(); player.current?.destroy(); player.current = null; };
  }, []);
  useEffect(() => { intent.current = open; animate.current(); }, [open]);
  return <span className="menu-icon" aria-hidden="true"><svg ref={original} width="16" height="12" viewBox="1359 24 16 12"><path d="M1359 36V34.8615H1375V36H1359ZM1359 30.5693V29.4307H1375V30.5693H1359ZM1359 25.1385V24H1375V25.1385H1359Z" fill="#1A1A1A" /></svg><span ref={container} className="menu-icon-player" /></span>;
}
