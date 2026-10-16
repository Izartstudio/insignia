"use client";

import { Component, useCallback, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { Canvas } from '@react-three/fiber';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { extendedGalleryMotionProfile, galleryConfig, galleryStates, type GalleryMotionProfile } from '@/content/spatial-gallery';
import { ScrollIndicator } from '../ScrollIndicator';
import { CanvasRuntime } from "@/components/three/CanvasRuntime";
import SpatialGalleryScene from './SpatialGalleryScene';
import type { GalleryMotion } from './GalleryEnvironment';
import './spatial-gallery.css';

// Share the landing tolerance between the instruction and pointer interaction.
function getExplorableState(travel: number) {
  const state = Math.round(travel);
  return state >= 0 && state < galleryStates.length && Math.abs(travel - state) <= .03 ? state : -1;
}

class GalleryBoundary extends Component<{ children: ReactNode; onFailure: () => void }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch() { this.props.onFailure(); }
  render() { return this.state.failed ? null : this.props.children; }
}
function AccessibleGallery({ visible }: { visible: boolean }) {
  return <div className={visible ? 'spatial-static' : 'sr-only'}>
    {galleryStates.map(state => <article key={state.id}>
      <h2>{state.heading}</h2>{state.subtitle && <p>{state.subtitle}</p>}
      <div>{state.photos.map((photo, index) => <img key={index} src={photo.src} alt={photo.alt} width="240" height="275" loading="lazy" />)}</div>
    </article>)}
  </div>;
}

export function SpatialGallery({ motionProfile = extendedGalleryMotionProfile }: { motionProfile?: GalleryMotionProfile }) {
  const sectionRef = useRef<HTMLElement>(null);
  const motion = useRef<GalleryMotion>({ travel: 0, panX: 0, panY: 0, active: false, invalidate: () => {} });
  const panOffsets = useRef(galleryStates.map(() => ({ x: 0, y: 0 })));
  const exploreButton = useRef<HTMLButtonElement>(null);
  const touchExploring = useRef(false);
  const [preview, setPreview] = useState<number | null>(null);
  const [enhanced, setEnhanced] = useState(false);
  const [canvasReady, setCanvasReady] = useState(false);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const onFailure = useCallback(() => { console.error("Spatial gallery entered WebGL/asset fallback"); setFailed(true); }, []);
  const animated = enhanced && !failed;

  useLayoutEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setCanvasReady(true); observer.disconnect(); }
    }, { rootMargin: '100% 0px' });
    observer.observe(section);
    return () => observer.disconnect();
  }, []);

  useLayoutEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const requested = new URLSearchParams(window.location.search).get('galleryPreview');
    const index = process.env.NODE_ENV === 'development' ? galleryStates.findIndex(s => s.id === requested) : -1;
    setPreview(index >= 0 ? index : null);
    const update = () => setEnhanced(index >= 0 || !query.matches);
    update();
    setReady(true);
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);

  useLayoutEffect(() => {
    const section = sectionRef.current;
    if (!animated || !section) return;
    gsap.registerPlugin(ScrollTrigger);
    let momentumFrame = 0;
    const stopMomentum = () => { cancelAnimationFrame(momentumFrame); momentumFrame = 0; };
    const hints = Array.from(section.querySelectorAll<HTMLElement>('.spatial-explore'));
    const toggleExplore = () => {
      touchExploring.current = !touchExploring.current;
      section.classList.toggle('is-touch-exploring', touchExploring.current);
      exploreButton.current?.setAttribute('aria-pressed', String(touchExploring.current));
      if (exploreButton.current) exploreButton.current.textContent = touchExploring.current ? 'Done exploring — scroll to continue' : 'Move To Explore The Canvas';
    };
    const stopExplore = () => { if (touchExploring.current) toggleExplore(); };
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') stopExplore(); };
    exploreButton.current?.addEventListener('click', toggleExplore);
    section.addEventListener('keydown', onKey);
    let lastExplorableState: number | undefined;
    const syncPan = () => {
      const explorableState = getExplorableState(motion.current.travel);
      if (explorableState !== lastExplorableState) {
        hints.forEach((hint, index) => { hint.hidden = index !== explorableState; });
        if (exploreButton.current) exploreButton.current.hidden = explorableState < 0;
        if (explorableState < 0) { stopExplore(); stopMomentum(); }
        lastExplorableState = explorableState;
      }
      const travel = motion.current.travel;
      const from = Math.min(Math.floor(travel), galleryStates.length - 1);
      const to = Math.min(from + 1, galleryStates.length - 1);
      for (const axis of ['x', 'y'] as const) {
        const value = panOffsets.current[from][axis] + (panOffsets.current[to][axis] - panOffsets.current[from][axis]) * (travel - from);
        if (axis === 'x') motion.current.panX = value; else motion.current.panY = value;
      }
      motion.current.invalidate();
    };
    const context = gsap.context(() => {
      const overlays = gsap.utils.toArray<HTMLElement>('.spatial-state', section);
      const marks = gsap.utils.toArray<HTMLElement>('.spatial-progress-item', section);
      const labels = gsap.utils.toArray<HTMLElement>('.spatial-progress-item span', section);
      gsap.set(labels, { autoAlpha: 0 });
      gsap.set(labels[preview ?? 0], { autoAlpha: 1 });
      gsap.set(overlays, { autoAlpha: 0 });
      gsap.set(overlays[preview ?? 0], { autoAlpha: 1 });
      gsap.set(marks, { opacity: .2 });
      gsap.set(marks[preview ?? 0], { opacity: 1 });
      motion.current.travel = preview ?? 0;
      if (preview !== null) { syncPan(); return; }
      const timeline = gsap.timeline({
        scrollTrigger: {
          // Measure upstream pins first, regardless of asynchronous mount order.
          refreshPriority: 20,
          trigger: section, start: 'top top', end: () => `+=${section.clientHeight * motionProfile.scrollViewports}`,
          pin: true, pinSpacing: false, scrub: motionProfile.scrub, anticipatePin: 1, invalidateOnRefresh: true,
        },
        onUpdate: syncPan,
      });
      galleryStates.forEach((state, index) => {
        const start = motionProfile.stops[index];
        const exit = motionProfile.exits[index];
        timeline.addLabel(state.id, start).addLabel(`${state.id}Exit`, exit);
        if (index === galleryStates.length - 1) return;
        const end = motionProfile.stops[index + 1];
        const duration = end - exit;
        timeline.to(motion.current, { travel: index + 1, duration, ease: motionProfile.travelEase }, exit)
          .to(overlays[index], { autoAlpha: 0, y: -12, duration: duration * .35, ease: 'none' }, exit)
          .fromTo(overlays[index + 1], { autoAlpha: 0, y: 12 }, { autoAlpha: 1, y: 0, duration: duration * .35, ease: 'none', immediateRender: false }, end - duration * .35)
          .to(labels[index], { autoAlpha: 0, duration: duration * .35 }, exit)
          .to(labels[index + 1], { autoAlpha: 1, duration: duration * .35 }, end - duration * .35)
          .to(marks[index], { opacity: .2, duration: duration * .5 }, exit)
          .to(marks[index + 1], { opacity: 1, duration: duration * .5 }, exit + duration * .5);
      });
      timeline.to({}, { duration: 1 - motionProfile.stops[galleryStates.length - 1] }, motionProfile.stops[galleryStates.length - 1]);
    }, section);
    syncPan();
    const observer = new IntersectionObserver(([entry]) => {
      motion.current.active = entry.isIntersecting;
      if (entry.isIntersecting) motion.current.invalidate();
    });
    observer.observe(section);
    let drag: { id: number; x: number; y: number; state: number; captured: boolean; touch: boolean; time: number; vx: number; vy: number } | null = null;
    const down = (event: PointerEvent) => {
      if (!event.isPrimary || event.button !== 0 || (event.target as HTMLElement).closest('button,a,input')) return;
      const state = getExplorableState(motion.current.travel);
      if (state < 0) return;
      stopMomentum();
      drag = { time: performance.now(), vx: 0, vy: 0, id: event.pointerId, x: event.clientX, y: event.clientY, state, captured: false, touch: event.pointerType === 'touch' };
    };
    const release = () => {
      const id = drag?.id;
      drag = null;
      section.classList.remove('is-dragging');
      if (id !== undefined && section.hasPointerCapture(id)) section.releasePointerCapture(id);
    };
    const move = (event: PointerEvent) => {
      if (!drag || event.pointerId !== drag.id) return;
      if (getExplorableState(motion.current.travel) !== drag.state) { release(); return; }
      const dx = event.clientX-drag.x, dy = event.clientY-drag.y;
      if (!drag.captured) {
        if (Math.hypot(dx,dy) < galleryConfig.drag.intentPixels) return;
        // Outside explicit Explore mode, horizontal and diagonal intent owns the
        // canvas while a predominantly vertical swipe remains native scrolling.
        if (drag.touch && !touchExploring.current && Math.abs(dy) > Math.abs(dx)) {
          release();
          return;
        }
        drag.captured = true;
        section.setPointerCapture(event.pointerId);
        section.classList.add('is-dragging');
      }
      const units = 2*galleryConfig.distance*Math.tan(galleryConfig.fov*Math.PI/360)/section.clientHeight;
      panOffsets.current[drag.state].x -= dx*units;
      panOffsets.current[drag.state].y += dy*units;
      const now = performance.now();
      const elapsed = Math.max(8, now - drag.time) / 1000;
      drag.vx = Math.max(-8, Math.min(8, -dx * units / elapsed));
      drag.vy = Math.max(-8, Math.min(8, dy * units / elapsed));
      drag.time = now;
      drag.x=event.clientX; drag.y=event.clientY;
      syncPan();
    };
    const finish = () => {
      const ended = drag;
      release();
      if (!ended?.touch || !ended.captured || performance.now() - ended.time > 100) return;
      let previous = performance.now();
      const tick = (now: number) => {
        if (!touchExploring.current || getExplorableState(motion.current.travel) !== ended.state) return;
        const delta = Math.min((now - previous) / 1000, .05);
        previous = now;
        const decay = Math.exp(-10 * delta);
        ended.vx *= decay; ended.vy *= decay;
        panOffsets.current[ended.state].x += ended.vx * delta;
        panOffsets.current[ended.state].y += ended.vy * delta;
        syncPan();
        if (Math.hypot(ended.vx, ended.vy) > .01) momentumFrame = requestAnimationFrame(tick);
      };
      momentumFrame = requestAnimationFrame(tick);
    };
    const leave = () => { if (!drag?.captured) release(); };
    section.addEventListener('pointerdown', down);
    section.addEventListener('pointerup', finish);
    section.addEventListener('pointercancel', release);
    section.addEventListener('lostpointercapture', release);
    section.addEventListener('pointermove', move);
    section.addEventListener('pointerleave', leave);
    const refresh = requestAnimationFrame(() => ScrollTrigger.refresh(true));
    return () => {
      cancelAnimationFrame(refresh);
      stopMomentum();
      observer.disconnect();
      stopExplore();
      exploreButton.current?.removeEventListener('click', toggleExplore);
      section.removeEventListener('keydown', onKey);
      release();
      section.removeEventListener('pointerdown', down);
      section.removeEventListener('pointerup', finish);
      section.removeEventListener('pointercancel', release);
      section.removeEventListener('lostpointercapture', release);
      section.removeEventListener('pointermove', move);
      section.removeEventListener('pointerleave', leave);
      context.revert();
      hints.forEach(hint => { hint.hidden = true; });
      motion.current.active = false;
    };
  }, [animated, preview, motionProfile]);

  return <div className={`spatial-gallery-track ${failed || (ready && !enhanced) ? "is-fallback" : ""} ${preview !== null ? "is-preview" : ""}`} style={{ "--gallery-track-height": `${(motionProfile.scrollViewports + 1) * 100}svh` } as CSSProperties}><section id="spatial-gallery" ref={sectionRef} data-gallery-preview={preview !== null ? galleryStates[preview].id : undefined} data-gallery-mode={failed ? "failed" : enhanced ? "webgl" : "reduced-or-pending"} className={`spatial-gallery ${animated ? 'is-spatial' : ''}`} aria-label="Who's Been At Insignia">
    <AccessibleGallery visible={!animated} />
    {animated && <>
      <div className="spatial-canvas" aria-hidden="true">
        <GalleryBoundary onFailure={onFailure}>
          {canvasReady && <Canvas frameloop="demand" dpr={[1, 1.5]} camera={{ position: [0, 0, galleryConfig.distance], fov: galleryConfig.fov, near: .05, far: 100 }} gl={{ alpha: true, antialias: true }} fallback={<span>WebGL is unavailable.</span>}>
            <CanvasRuntime />
            <SpatialGalleryScene motion={motion} onFailure={onFailure} />
          </Canvas>}
        </GalleryBoundary>
      </div>
      <button ref={exploreButton} type="button" className="spatial-touch-explore" aria-pressed="false" hidden>Move To Explore The Canvas</button>
      <div className="spatial-overlays" aria-hidden="true">
        {galleryStates.map((state, index) => <div className="spatial-state" key={state.id}>
          <div className={`spatial-heading ${index === 0 ? 'is-first' : ''}`}>
            <h2>{state.heading}</h2>{state.subtitle && <p>{state.subtitle}</p>}
        <div className="spatial-explore" hidden><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor"><path d="M12 2v20M2 12h20M9 5l3-3 3 3M9 19l3 3 3-3M5 9l-3 3 3 3M19 9l3 3-3 3" /></svg>Move to explore the canvas.</div>
          </div>
        </div>)}
        <div className="spatial-progress">{galleryStates.map(state => <div className="spatial-progress-item" key={state.id}><span>{state.label}</span><i /></div>)}</div>
        <ScrollIndicator />
      </div>
    </>}
  </section></div>;
}
