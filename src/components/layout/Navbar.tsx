"use client";
import Link from "next/link";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import gsap from "gsap";
import { navigation, navMotion as motion } from "@/config/navigation";
import { NavLabel } from "./NavLabel";
import { MenuIcon } from "./MenuIcon";
import { LumikaiLogo } from "./LumikaiLogo";

function MenuText({ text }: { text: string }) {
  return <span className="menu-text" aria-hidden="true">{[...text].map((letter, index) => <span key={index} className="menu-char" style={{ transitionDelay: `${index * motion.hoverStagger}s` }}>{letter}<span className="menu-char-copy">{letter}</span></span>)}</span>;
}

export function Navbar() {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLElement>(null);
  const logo = useRef<HTMLAnchorElement>(null);
  const layer = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const backdrop = useRef<HTMLDivElement>(null);
  const timeline = useRef<gsap.core.Timeline | null>(null);
  const openRef = useRef(open);
  const releaseLock = useRef<(() => void) | null>(null);

  useLayoutEffect(() => {
    const context = gsap.context(() => {
      const links = panel.current!.querySelectorAll(".menu-link-row");
      const mark = panel.current!.querySelector(".menu-logo");
      const footer = panel.current!.querySelector(".menu-footer");
      gsap.set(panel.current, { xPercent: 100 });
      gsap.set(backdrop.current, { opacity: 0 });
      gsap.set(mark, { opacity: 0, xPercent: 100 });
      gsap.set(links, { opacity: 0, xPercent: 50 });
      gsap.set(footer, { opacity: 0 });
      timeline.current = gsap.timeline({ paused: true,
        onReverseComplete: () => { gsap.set([panel.current, backdrop.current], { visibility: "hidden" }); releaseLock.current?.(); releaseLock.current = null; },
      }).to(backdrop.current, { opacity: 1, duration: motion.backdrop, ease: "power2.out" }, 0)
        .to(panel.current, { xPercent: 0, duration: motion.panel, ease: "expo.out" }, 0)
        .to(mark, { opacity: 1, xPercent: 0, duration: motion.logo, ease: "power3.out" }, motion.logoStart)
        .to(links, { opacity: 1, xPercent: 0, duration: motion.links, stagger: motion.stagger, ease: "power3.out" }, motion.linksStart)
        .to(footer, { opacity: 1, duration: motion.footer, ease: "power3.out" }, motion.footerStart);
    }, root);
    return () => { timeline.current = null; context.revert(); };
  }, []);

  useEffect(() => {
    openRef.current = open;
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => {
      if (open) gsap.set([panel.current, backdrop.current], { visibility: "visible" });
      if (media.matches) timeline.current?.progress(open ? 1 : 0).pause();
      else if (open) timeline.current?.timeScale(1).play();
      else timeline.current?.timeScale(motion.closeSpeed).reverse();
      if (!open && (media.matches || timeline.current?.progress() === 0)) { gsap.set([panel.current, backdrop.current], { visibility: "hidden" }); releaseLock.current?.(); releaseLock.current = null; }
    };
    update();
    media.addEventListener("change", update);
    if (!open) return () => media.removeEventListener("change", update);
    if (!releaseLock.current) {
      const previousOverflow = document.body.style.overflow;
      const main = document.querySelector("main");
      const previousInert = main?.inert;
      document.body.style.overflow = "hidden";
      if (main) main.inert = true;
      releaseLock.current = () => {
        document.body.style.overflow = previousOverflow;
        if (main) main.inert = previousInert ?? false;
      };
    }
    panel.current?.querySelector<HTMLAnchorElement>("a")?.focus({ preventScroll: true });
    const keyboard = (event: KeyboardEvent) => {
      if (event.key === "Escape") { event.preventDefault(); setOpen(false); }
      if (event.key !== "Tab") return;
      const items = Array.from(layer.current!.querySelectorAll<HTMLElement>("a[href], button"));
      const first = items[0], last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener("keydown", keyboard);
    return () => { media.removeEventListener("change", update); document.removeEventListener("keydown", keyboard); button.current?.focus({ preventScroll: true }); };
  }, [open]);

  useEffect(() => () => { releaseLock.current?.(); releaseLock.current = null; }, []);

  useEffect(() => {
    let previous = window.scrollY;
    let hidden = false;
    let tween: gsap.core.Tween | undefined;
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const scroll = () => {
      const current = window.scrollY, delta = current - previous;
      if (Math.abs(delta) < motion.scrollTolerance) return;
      const next = !openRef.current && delta > 0 && current > motion.scrollThreshold;
      if (next !== hidden) {
        hidden = next;
        tween?.kill();
        tween = gsap.to(logo.current, { yPercent: hidden ? -200 : 0, duration: media.matches ? 0 : motion.logoScroll, ease: "power3.out", overwrite: true });
      }
      previous = current;
    };
    window.addEventListener("scroll", scroll, { passive: true });
    return () => { window.removeEventListener("scroll", scroll); tween?.kill(); };
  }, []);

  return <header ref={root} className="site-header">
    <nav aria-label="Main navigation" className="site-navigation">
      <a ref={logo} href={navigation.home} className="site-logo" aria-label="Lumikai home" inert={open}><LumikaiLogo alt="Lumikai" /></a>
      <div className="desktop-navigation" inert={open}>{navigation.primary.map((item, index) => item.href === "/" ? <Link key={item.label} href="/" className="nav-cell" aria-label={item.label} aria-current="page"><NavLabel index={index} /></Link> : <a key={item.label} href={item.href} className="nav-cell" aria-label={item.label}><NavLabel index={index} /></a>)}</div>
      <div ref={layer} className="menu-layer" role={open ? "dialog" : undefined} aria-modal={open || undefined} aria-label={open ? "Site navigation" : undefined}>
        <div ref={backdrop} className="menu-backdrop" onClick={() => setOpen(false)} aria-hidden="true" />
        <div ref={panel} className="menu-panel" id="site-menu" inert={!open}>
          <a href={navigation.home} className="menu-logo" onClick={() => setOpen(false)}><LumikaiLogo alt="Lumikai home" /></a>
          <div className="menu-links">{[...navigation.primary, ...navigation.secondary].map(item => <div className="menu-link-row" key={item.label}>{item.href === "/" ? <Link href="/" onClick={() => setOpen(false)} aria-current="page" aria-label={item.label}><MenuText text={item.label} /></Link> : <a href={item.href} onClick={() => setOpen(false)} aria-label={item.label}><MenuText text={item.label} /></a>}</div>)}</div>
          <div className="menu-footer"><a href={navigation.pitch} onClick={() => setOpen(false)}>Pitch To Us <span aria-hidden="true">+</span></a></div>
        </div>
        <button ref={button} type="button" className="menu-button" aria-label={open ? "Close menu" : "Open menu"} aria-expanded={open} aria-controls="site-menu" onClick={() => setOpen(value => !value)}><MenuIcon open={open} /></button>
      </div>
    </nav>
  </header>;
}
