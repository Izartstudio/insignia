"use client";

import { Component, useCallback, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { preload } from 'react-dom';
import { Canvas } from '@react-three/fiber';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { extendedGalleryMotionProfile, galleryConfig, galleryStates, type GalleryMotionProfile } from '@/content/spatial-gallery';
import { ScrollIndicator } from '../ScrollIndicator';
import { CanvasRuntime } from "@/components/three/CanvasRuntime";
import SpatialGalleryScene from './SpatialGalleryScene';
import type { GalleryMotion } from './GalleryEnvironment';
import { GalleryPhotoDialog, type GallerySelection } from './GalleryPhotoDialog';
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
function AccessibleGallery({ visible, onSelect }: { visible: boolean; onSelect: (selection: GallerySelection) => void }) {
  return <div className={visible ? 'spatial-static' : 'sr-only'}>
    {galleryStates.map(state => <article key={state.id}>
      <h2>{state.heading}</h2>{state.subtitle && <p>{state.subtitle}</p>}
      <div>{state.photos.map((photo, index) => <button type="button" key={index} onClick={() => onSelect({ worldId: state.id, photoIndex: index })} aria-label={`View details: ${photo.alt}`}><img src={photo.src} alt={photo.alt} width="240" height="275" loading="lazy" /></button>)}</div>
    </article>)}
  </div>;
}

export function SpatialGallery({ motionProfile = extendedGalleryMotionProfile }: { motionProfile?: GalleryMotionProfile }) {
  const [mobileControls, setMobileControls] = useState(false);
  const [mobileState, setMobileState] = useState(0);
  const navigateMobile = useRef<((index: number) => void) | null>(null);
  useLayoutEffect(() => {
    const query = window.matchMedia('(max-width: 767px)');
    const update = () => setMobileControls(query.matches);
    update();
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);
  const sectionRef = useRef<HTMLElement>(null);
  const motion = useRef<GalleryMotion>({ travel: 0, panX: 0, panY: 0, active: false, invalidate: () => {} });
  const panOffsets = useRef(galleryStates.map(() => ({ x: 0, y: 0 })));
  const [selection, setSelection] = useState<GallerySelection | null>(null);
  const [photoClosing, setPhotoClosing] = useState(false);
  const startClosingPhoto = useCallback(() => setPhotoClosing(true), []);
  const closePhoto = useCallback(() => { setSelection(null); setPhotoClosing(false); }, []);
  useLayoutEffect(() => {
    motion.current.paused = selection !== null;
    motion.current.invalidate();
    return () => { motion.current.paused = false; };
  }, [selection]);
  const [preview, setPreview] = useState<number | null>(null);
  const [enhanced, setEnhanced] = useState(false);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const onFailure = useCallback(() => { console.error("Spatial gallery entered WebGL/asset fallback"); setFailed(true); }, []);
  const animated = enhanced && !failed;

  useLayoutEffect(() => {
    if (!animated) return;
    // Warm later categories alongside the eagerly initialized WebGL canvas.
    galleryStates.forEach((state, index) => state.photos.forEach(photo => {
      preload(photo.src, { as: 'image', fetchPriority: index === 0 ? 'auto' : 'low' });
    }));
  }, [animated]);


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
    let mobileExited = false;
    let entryTrigger: ScrollTrigger | undefined;
    const unlockMobile = () => document.body.classList.remove('gallery-mobile-locked');
    const lockMobile = () => {
      if (mobileExited || !mobileControls) return;
      window.scrollTo({ top: window.scrollY + section.getBoundingClientRect().top, behavior: 'instant' });
      document.body.classList.add('gallery-mobile-locked');
    };
    let mobileTween: gsap.core.Tween | null = null;
    let momentumFrame = 0;
    const stopMomentum = () => { cancelAnimationFrame(momentumFrame); momentumFrame = 0; };
    const hints = Array.from(section.querySelectorAll<HTMLElement>('.spatial-explore'));
    let lastExplorableState: number | undefined;
    const syncPan = () => {
      const explorableState = getExplorableState(motion.current.travel);
      if (explorableState !== lastExplorableState) {
        hints.forEach((hint, index) => { hint.dataset.visible = String(index === explorableState); });
        section.classList.toggle('is-explorable', explorableState >= 0);
        if (explorableState < 0) stopMomentum();
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
      if (preview !== null && !mobileControls) { syncPan(); return; }
      const timeline = gsap.timeline({
        paused: mobileControls,
        scrollTrigger: mobileControls ? undefined : {
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
          .to(overlays[index], { autoAlpha: 0, y: -6, duration: duration * .55, ease: 'power1.inOut' }, exit)
          .fromTo(overlays[index + 1], { autoAlpha: 0, y: 6 }, { autoAlpha: 1, y: 0, duration: duration * .55, ease: 'power1.inOut', immediateRender: false }, end - duration * .55)
          .to(labels[index], { autoAlpha: 0, duration: duration * .35 }, exit)
          .to(labels[index + 1], { autoAlpha: 1, duration: duration * .35 }, end - duration * .35)
          .to(marks[index], { opacity: .2, duration: duration * .5 }, exit)
          .to(marks[index + 1], { opacity: 1, duration: duration * .5 }, exit + duration * .5);
      });
      timeline.to({}, { duration: 1 - motionProfile.stops[galleryStates.length - 1] }, motionProfile.stops[galleryStates.length - 1]);
      if (mobileControls) {
        const initial = preview ?? 0;
        let currentMobileState = initial;
        timeline.seek(motionProfile.stops[initial], false);
        setMobileState(initial);
        navigateMobile.current = index => {
          stopMomentum();
          release();
          if (index >= galleryStates.length) {
            mobileExited = true;
            unlockMobile();
            section.parentElement?.nextElementSibling?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            return;
          }
          const target = Math.max(0, index);
          mobileTween?.kill();
          const isDirectJump = Math.abs(target - currentMobileState) > 1;
          currentMobileState = target;
          setMobileState(target);
          if (isDirectJump) {
            timeline.seek(motionProfile.stops[target], true);
            gsap.set(overlays, { autoAlpha: 0, y: 0 });
            gsap.set(overlays[target], { autoAlpha: 1 });
            gsap.set(labels, { autoAlpha: 0 });
            gsap.set(labels[target], { autoAlpha: 1 });
            gsap.set(marks, { opacity: .2 });
            gsap.set(marks[target], { opacity: 1 });
            motion.current.travel = target;
            syncPan();
            return;
          }
          mobileTween = timeline.tweenTo(motionProfile.stops[target], {
            duration: Math.min(1.6, Math.max(.8, Math.abs(target - motion.current.travel) * .85)),
            ease: 'power1.inOut',
            onUpdate: syncPan,
          });
        };
      }

    }, section);
    syncPan();
    const observer = new IntersectionObserver(([entry]) => {
      motion.current.active = entry.isIntersecting;
      if (entry.isIntersecting) motion.current.invalidate();
    });
    observer.observe(section);
    if (mobileControls && preview === null) {
      entryTrigger = ScrollTrigger.create({
        trigger: section, start: 'top 25%', end: 'bottom top',
        onEnter: lockMobile, onEnterBack: lockMobile,
        onLeave: () => { mobileExited = false; },
      });
    }
    let drag: { id: number; x: number; y: number; state: number; captured: boolean; touch: boolean; time: number; vx: number; vy: number } | null = null;
    const down = (event: PointerEvent) => {
      if (!event.isPrimary) { cancelGesture(); return; }
      stopMomentum();
      if (event.button !== 0 || !(event.target instanceof Element) ||
        (mobileControls ? event.target.closest('.spatial-mobile-controls') : !event.target.closest('.spatial-canvas'))) return;
      const state = getExplorableState(motion.current.travel);
      if (state < 0) return;
      stopMomentum();
      section.classList.add('is-pressed');
      drag = { time: performance.now(), vx: 0, vy: 0, id: event.pointerId, x: event.clientX, y: event.clientY, state, captured: false, touch: event.pointerType === 'touch' };
      if (mobileControls) section.setPointerCapture(event.pointerId);
    };
    const release = () => {
      const id = drag?.id;
      drag = null;
      motion.current.dragging = false;
      section.classList.remove('is-dragging', 'is-pressed');
      if (id !== undefined && section.hasPointerCapture(id)) section.releasePointerCapture(id);
    };
    const move = (event: PointerEvent) => {
      if (!drag && event.pointerType === 'mouse') {
        const photo = motion.current.pickPhoto?.(event.clientX, event.clientY);
        section.classList.toggle('is-photo-hover', !!photo);
      }
      if (!drag || event.pointerId !== drag.id) return;
      if (getExplorableState(motion.current.travel) !== drag.state) { release(); return; }
      const dx = event.clientX-drag.x, dy = event.clientY-drag.y;
      if (!drag.captured) {
        if (!mobileControls && Math.hypot(dx,dy) < galleryConfig.drag.intentPixels) return;
        drag.captured = true;
        motion.current.dragging = true;
        if (!section.hasPointerCapture(event.pointerId)) section.setPointerCapture(event.pointerId);
        section.classList.add('is-dragging');
      }
      if (event.cancelable) event.preventDefault();
      const units = (mobileControls ? 8.5 : 1) * 2*galleryConfig.distance*Math.tan(galleryConfig.fov*Math.PI/360)/section.clientHeight;
      panOffsets.current[drag.state].x -= dx*units;
      panOffsets.current[drag.state].y += dy*units;
      const now = performance.now();
      const elapsed = Math.max(1, now - drag.time) / 1000;
      const blend = 1 - Math.exp(-25 * elapsed);
      const maxVelocity = mobileControls ? 28 : 8;
      drag.vx += (Math.max(-maxVelocity, Math.min(maxVelocity, -dx * units / elapsed)) - drag.vx) * blend;
      drag.vy += (Math.max(-maxVelocity, Math.min(maxVelocity, dy * units / elapsed)) - drag.vy) * blend;
      drag.time = now;
      drag.x=event.clientX; drag.y=event.clientY;
      syncPan();
    };
    const finish = (event: PointerEvent) => {
      if (event.pointerId !== drag?.id) return;
      const ended = drag;
      release();
      if (ended && !ended.captured && Math.hypot(event.clientX - ended.x, event.clientY - ended.y) < galleryConfig.drag.intentPixels) {
        const selected = motion.current.pickPhoto?.(event.clientX, event.clientY);
        if (selected) { stopMomentum(); setSelection(selected); }
        return;
      }
      if (!ended?.touch || !ended.captured || performance.now() - ended.time > 100) return;
      let previous = performance.now();
      const tick = (now: number) => {
        if (getExplorableState(motion.current.travel) !== ended.state) return;
        const delta = Math.min((now - previous) / 1000, .05);
        previous = now;
        const friction = mobileControls ? 6 : 10;
        const decay = Math.exp(-friction * delta);
        // Integrate exponential decay exactly for consistent travel at 30/60/120 Hz.
        panOffsets.current[ended.state].x += ended.vx * (1 - decay) / friction;
        panOffsets.current[ended.state].y += ended.vy * (1 - decay) / friction;
        ended.vx *= decay; ended.vy *= decay;
        syncPan();
        if (Math.hypot(ended.vx, ended.vy) > .01) momentumFrame = requestAnimationFrame(tick);
      };
      momentumFrame = requestAnimationFrame(tick);
    };
    const cancelGesture = () => { release(); stopMomentum(); };
    const cancelPointer = (event: PointerEvent) => {
      if (event.pointerId === drag?.id) cancelGesture();
    };
    const visibilityChange = () => { if (document.hidden) cancelGesture(); };
    window.addEventListener('blur', cancelGesture);
    let viewportWidth = window.innerWidth;
    const resizeGesture = () => {
      if (!mobileControls || window.innerWidth !== viewportWidth) cancelGesture();
      viewportWidth = window.innerWidth;
    };
    window.addEventListener('resize', resizeGesture);
    document.addEventListener('visibilitychange', visibilityChange);
    const leave = () => { section.classList.remove('is-photo-hover'); if (!drag?.captured) release(); };
    section.addEventListener('pointerdown', down);
    section.addEventListener('pointerup', finish);
    section.addEventListener('pointercancel', cancelPointer);
    section.addEventListener('lostpointercapture', cancelPointer);
    section.addEventListener('pointermove', move);
    section.addEventListener('pointerleave', leave);
    const refresh = requestAnimationFrame(() => ScrollTrigger.refresh(true));
    return () => {
      entryTrigger?.kill();
      unlockMobile();
      navigateMobile.current = null;
      mobileTween?.kill();
      cancelAnimationFrame(refresh);
      stopMomentum();
      observer.disconnect();
      window.removeEventListener('blur', cancelGesture);
      window.removeEventListener('resize', resizeGesture);
      document.removeEventListener('visibilitychange', visibilityChange);
      release();
      section.removeEventListener('pointerdown', down);
      section.removeEventListener('pointerup', finish);
      section.removeEventListener('pointercancel', cancelPointer);
      section.removeEventListener('lostpointercapture', cancelPointer);
      section.removeEventListener('pointermove', move);
      section.removeEventListener('pointerleave', leave);
      context.revert();
      section.classList.remove('is-explorable');
      hints.forEach(hint => { hint.dataset.visible = 'false'; });
      motion.current.active = false;
    };
  }, [animated, preview, motionProfile, mobileControls]);

  return <div className={`spatial-gallery-track ${failed || (ready && !enhanced) ? "is-fallback" : ""} ${preview !== null ? "is-preview" : ""}`} style={{ "--gallery-track-height": `${(motionProfile.scrollViewports + 1) * 100}svh` } as CSSProperties}><section id="spatial-gallery" ref={sectionRef} data-gallery-preview={preview !== null ? galleryStates[preview].id : undefined} data-gallery-mode={failed ? "failed" : enhanced ? "webgl" : "reduced-or-pending"} className={`spatial-gallery ${animated ? 'is-spatial' : ''} ${selection && !photoClosing ? 'has-photo-dialog' : ''}`} aria-label="Who's Been At Insignia">
    <AccessibleGallery visible={!animated} onSelect={setSelection} />
    {animated && <>
      <div className="spatial-canvas" data-lenis-prevent-touch aria-hidden="true">
        <GalleryBoundary onFailure={onFailure}>
          {<Canvas frameloop="demand" dpr={[1, 1.5]} camera={{ position: [0, 0, galleryConfig.distance], fov: galleryConfig.fov, near: .05, far: 100 }} gl={{ alpha: true, antialias: true }} fallback={<span>WebGL is unavailable.</span>}>
            <CanvasRuntime />
            <SpatialGalleryScene motion={motion} onFailure={onFailure} />
          </Canvas>}
        </GalleryBoundary>
      </div>
      {mobileControls && <nav className="spatial-mobile-controls" aria-label="Gallery categories" data-lenis-prevent>
        <div className="spatial-mobile-states">
          {galleryStates.map((state, index) => <button key={state.id} type="button"
            className={index === mobileState ? 'is-active' : ''}
            aria-label={`Show ${state.label}`} aria-pressed={index === mobileState}
            onClick={() => navigateMobile.current?.(index)}><span>{state.label}</span></button>)}
        </div>
        <button type="button" className="spatial-mobile-next"
          aria-label={mobileState === galleryStates.length - 1 ? 'Continue to next section' : `Next category: ${galleryStates[mobileState + 1].label}`}
          onClick={() => navigateMobile.current?.(mobileState + 1)}>
          <span aria-hidden="true">NEXT</span>
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 5 7 7-7 7" /></svg>
        </button>
      </nav>}
      <div className="spatial-scroll-zone" aria-hidden="true">
        <span className="spatial-touch-explore">Swipe here to scroll</span>
      </div>
      <div className="spatial-overlays" aria-hidden="true">
        <div className="spatial-glass" />
        {galleryStates.map((state, index) => <div className="spatial-state" key={state.id}>
          <div className={`spatial-heading ${index === 0 ? 'is-first' : ''}`}>
            <span className="spatial-eyebrow">{state.category}</span>
            <h2>{state.heading}</h2>{state.subtitle && <p>{state.subtitle}</p>}
        <div className="spatial-explore" data-visible="false"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor"><path d="M12 2v20M2 12h20M9 5l3-3 3 3M9 19l3 3 3-3M5 9l-3 3 3 3M19 9l3 3-3 3" /></svg>Move to explore the canvas.</div>
          </div>
        </div>)}
        <div className="spatial-progress">{galleryStates.map(state => <div className="spatial-progress-item" key={state.id}><span>{state.label}</span><i /></div>)}</div>
        <ScrollIndicator />
      </div>
    </>}
  </section>{selection && <GalleryPhotoDialog selection={selection} onClose={closePhoto} onCloseStart={startClosingPhoto} />}</div>;
}
