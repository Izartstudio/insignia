"use client";

import { Component, useCallback, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { preload } from 'react-dom';
import { Canvas } from '@react-three/fiber';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { extendedGalleryMotionProfile, galleryConfig, type GalleryMotionProfile, type GalleryState } from '@/content/spatial-gallery';
import type { SpatialGalleryContent } from '@/sanity/galleryContent';
import { ScrollIndicator } from '../ScrollIndicator';
import { CanvasRuntime } from "@/components/three/CanvasRuntime";
import SpatialGalleryScene from './SpatialGalleryScene';
import type { GalleryMotion } from './GalleryEnvironment';
import { GalleryPhotoDialog, type GallerySelection } from './GalleryPhotoDialog';
import './spatial-gallery.css';
import { lockPageScroll } from './scrollLock';

// Share the landing tolerance between the instruction and pointer interaction.
function getExplorableState(travel: number, count: number) {
  const state = Math.round(travel);
  return state >= 0 && state < count && Math.abs(travel - state) <= .03 ? state : -1;
}

class GalleryBoundary extends Component<{ children: ReactNode; onFailure: () => void }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch() { this.props.onFailure(); }
  render() { return this.state.failed ? null : this.props.children; }
}
function AccessibleGallery({ visible, onSelect, states }: { visible: boolean; onSelect: (selection: GallerySelection) => void; states: GalleryState[] }) {
  return <div className={visible ? 'spatial-static' : 'sr-only'}>
    {states.map(state => <article key={state.id}>
      <h2>{state.heading}</h2>{state.subtitle && <p>{state.subtitle}</p>}
      <div>{state.photos.map((photo, index) => <button type="button" key={index} onClick={() => onSelect({ worldId: state.id, photoIndex: index })} aria-label={`View details: ${photo.alt}`}><img src={photo.src} alt={photo.alt} width="240" height="275" loading="lazy" /></button>)}</div>
    </article>)}
  </div>;
}

export function SpatialGallery({ content, motionProfile = extendedGalleryMotionProfile }: { content: SpatialGalleryContent; motionProfile?: GalleryMotionProfile }) {
  const [mobileControls, setMobileControls] = useState(false);
  const states = mobileControls ? content.mobile : content.desktop;
  const copy = mobileControls ? content.mobileCopy : content.desktopCopy;
  const [mobileState, setMobileState] = useState(0);
  const [mobileEntered, setMobileEntered] = useState(false);
  const [mobileClosing, setMobileClosing] = useState(false);
  const closingRef = useRef(false);
  const closeTimer = useRef<number | null>(null);
  const revealTimer = useRef<number | null>(null);
  const unlockExperience = useRef<(() => void) | null>(null);
  const cancelInteraction = useRef<(() => void) | null>(null);
  const navigateMobile = useRef<((index: number) => void) | null>(null);
  const resetMobile = useRef<(() => void) | null>(null);
  const exitMobile = useRef<((afterClose?: () => void) => void) | null>(null);
  const closeMobile = useCallback((afterClose?: () => void) => {
    if (closingRef.current) return;
    closingRef.current = true;
    setMobileClosing(true);
    closeTimer.current = window.setTimeout(() => {
      const track = sectionRef.current?.parentElement;
      const entryTop = track ? window.scrollY + track.getBoundingClientRect().top : window.scrollY;
      unlockExperience.current?.();
      unlockExperience.current = null;
      window.scrollTo({ top: entryTop, behavior: 'instant' });
      setMobileEntered(false);
      revealTimer.current = window.setTimeout(() => {
        document.body.classList.remove('gallery-mobile-locked');
        setMobileClosing(false);
        closingRef.current = false;
        afterClose?.();
      }, 40);
    }, 320);
  }, []);
  exitMobile.current = closeMobile;
  const enterMobile = useCallback(() => {
    if (closingRef.current) return;
    const track = sectionRef.current?.parentElement;
    if (track) track.style.height = `${track.getBoundingClientRect().height}px`;
    unlockExperience.current?.();
    unlockExperience.current = lockPageScroll();
    resetMobile.current?.();
    setMobileClosing(false);
    setMobileEntered(true);
    document.body.classList.add('gallery-mobile-locked');
  }, []);
  useLayoutEffect(() => () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    if (revealTimer.current) clearTimeout(revealTimer.current);
    unlockExperience.current?.();
    document.body.classList.remove('gallery-mobile-locked');
  }, []);
  useLayoutEffect(() => {
    const query = window.matchMedia('(max-width: 1024px)');
    const update = () => setMobileControls(query.matches);
    update();
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);
  const sectionRef = useRef<HTMLElement>(null);
  useLayoutEffect(() => {
    if (!mobileEntered) sectionRef.current?.parentElement?.style.removeProperty('height');
  }, [mobileEntered]);
  useLayoutEffect(() => {
    if (mobileControls) return;
    unlockExperience.current?.();
    unlockExperience.current = null;
    document.body.classList.remove('gallery-mobile-locked');
    setMobileEntered(false);
  }, [mobileControls]);
  const motion = useRef<GalleryMotion>({ travel: 0, panX: 0, panY: 0, active: false, invalidate: () => {} });
  const panOffsets = useRef(states.map(() => ({ x: 0, y: 0 })));
  useLayoutEffect(() => { panOffsets.current = states.map(() => ({ x: 0, y: 0 })); }, [states]);
  const [selection, setSelection] = useState<GallerySelection | null>(null);
  useLayoutEffect(() => { setSelection(null); }, [mobileControls]);
  const startClosingPhoto = useCallback(() => { motion.current.paused = true; }, []);
  const closePhoto = useCallback(() => { setSelection(null); }, []);
  useLayoutEffect(() => {
    if (selection) cancelInteraction.current?.();
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
    if (!animated || mobileControls) return;
    // Warm later categories alongside the eagerly initialized WebGL canvas.
    states.forEach((state, index) => state.photos.forEach(photo => {
      preload(photo.src, { as: 'image', fetchPriority: index === 0 ? 'auto' : 'low' });
    }));
  }, [animated, states, mobileControls]);


  useLayoutEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const requested = new URLSearchParams(window.location.search).get('galleryPreview');
    const index = process.env.NODE_ENV === 'development' ? states.findIndex(s => s.id === requested) : -1;
    setPreview(index >= 0 ? index : null);
    const update = () => setEnhanced(index >= 0 || !query.matches);
    update();
    setReady(true);
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, [states]);

  useLayoutEffect(() => {
    const section = sectionRef.current;
    if (!animated || !section) return;
    gsap.registerPlugin(ScrollTrigger);
    const unlockMobile = () => document.body.classList.remove('gallery-mobile-locked');
    let mobileTween: gsap.core.Tween | null = null;
    let momentumFrame = 0;
    const stopMomentum = () => { cancelAnimationFrame(momentumFrame); momentumFrame = 0; };
    const hints = Array.from(section.querySelectorAll<HTMLElement>('.spatial-explore'));
    let lastExplorableState: number | undefined;
    const syncPan = () => {

      const explorableState = getExplorableState(motion.current.travel, states.length);
      if (explorableState !== lastExplorableState) {
        hints.forEach((hint, index) => { hint.dataset.visible = String(index === explorableState); });
        section.classList.toggle('is-explorable', explorableState >= 0);
        if (explorableState < 0) stopMomentum();
        lastExplorableState = explorableState;
      }
      const travel = motion.current.travel;
      const from = Math.min(Math.floor(travel), states.length - 1);
      const to = Math.min(from + 1, states.length - 1);
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
      states.forEach((state, index) => {
        const start = motionProfile.stops[index];
        const exit = motionProfile.exits[index];
        timeline.addLabel(state.id, start).addLabel(`${state.id}Exit`, exit);
        if (index === states.length - 1) return;
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
      timeline.to({}, { duration: 1 - motionProfile.stops[states.length - 1] }, motionProfile.stops[states.length - 1]);
      if (mobileControls) {
        const initial = preview ?? 0;
        let currentMobileState = initial;
        timeline.seek(motionProfile.stops[initial], false);
        setMobileState(initial);
        resetMobile.current = () => {
          mobileTween?.kill();
          timeline.seek(motionProfile.stops[0], true);
          gsap.set(overlays, { autoAlpha: 0, y: 0 });
          gsap.set(overlays[0], { autoAlpha: 1 });
          currentMobileState = 0;
          setMobileState(0);
          motion.current.travel = 0;
          syncPan();
        };
        navigateMobile.current = index => {
          if (motion.current.paused || closingRef.current) return;
          stopMomentum();
          release();
          if (index >= states.length) {
            exitMobile.current?.(() => section.parentElement?.nextElementSibling?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
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
    let drag: { id: number; x: number; y: number; state: number; captured: boolean; touch: boolean; time: number; vx: number; vy: number } | null = null;
    const canInteract = () => {
      if (motion.current.paused || closingRef.current) return false;
      if (mobileControls) return section.classList.contains('is-mobile-entered');
      const rect = section.getBoundingClientRect();
      return Math.abs(rect.top) <= 2 && rect.bottom >= window.innerHeight - 2;
    };
    const down = (event: PointerEvent) => {
      if (!canInteract()) return;
      if (!event.isPrimary) { cancelGesture(); return; }
      stopMomentum();
      if (event.button !== 0 || !(event.target instanceof Element) ||
        (mobileControls && !section.classList.contains('is-mobile-entered')) ||
        (mobileControls ? event.target.closest('.spatial-mobile-controls, .spatial-mobile-close, .spatial-mobile-entry') : !event.target.closest('.spatial-canvas'))) return;
      const state = getExplorableState(motion.current.travel, states.length);
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
      if (!canInteract()) { cancelGesture(); section.classList.remove('is-photo-hover'); return; }
      if (!drag && event.pointerType === 'mouse') {
        const photo = motion.current.pickPhoto?.(event.clientX, event.clientY);
        section.classList.toggle('is-photo-hover', !!photo);
      }
      if (!drag || event.pointerId !== drag.id) return;
      if (getExplorableState(motion.current.travel, states.length) !== drag.state) { release(); return; }
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
      const dragUnits = units * (mobileControls ? .30 : 1);
      panOffsets.current[drag.state].x -= dx * dragUnits;
      panOffsets.current[drag.state].y += dy * dragUnits;
      const now = performance.now();
      const elapsed = Math.max(1, now - drag.time) / 1000;
      const blend = 1 - Math.exp(-25 * elapsed);
      const maxVelocity = mobileControls ? 18 : 8;
      drag.vx += (Math.max(-maxVelocity, Math.min(maxVelocity, -dx * dragUnits / elapsed)) - drag.vx) * blend;
      drag.vy += (Math.max(-maxVelocity, Math.min(maxVelocity, dy * dragUnits / elapsed)) - drag.vy) * blend;
      drag.time = now;
      drag.x=event.clientX; drag.y=event.clientY;
      syncPan();
    };
    const finish = (event: PointerEvent) => {
      if (!canInteract()) { cancelGesture(); return; }
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
        if (!canInteract()) return;
        if (getExplorableState(motion.current.travel, states.length) !== ended.state) return;
        const delta = Math.min((now - previous) / 1000, .05);
        previous = now;
        const friction = mobileControls ? 9 : 10;
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
    cancelInteraction.current = () => { cancelGesture(); mobileTween?.pause(); };
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
      unlockMobile();
      navigateMobile.current = null;
      cancelInteraction.current = null;
      resetMobile.current = null;
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
  }, [animated, preview, motionProfile, mobileControls, states]);

  return <div className={`spatial-gallery-track ${mobileClosing ? 'is-mobile-closing' : ''} ${failed || (ready && !enhanced) ? "is-fallback" : ""} ${preview !== null ? "is-preview" : ""}`} style={{ "--gallery-track-height": `${(motionProfile.scrollViewports + 1) * 100}svh` } as CSSProperties}><section id="spatial-gallery" ref={sectionRef} inert={selection !== null} data-gallery-preview={preview !== null ? states[preview].id : undefined} data-gallery-mode={failed ? "failed" : enhanced ? "webgl" : "reduced-or-pending"} className={`spatial-gallery ${animated ? 'is-spatial' : ''} ${mobileEntered ? 'is-mobile-entered' : ''} ${mobileClosing ? 'is-mobile-closing' : ''} ${selection ? 'has-photo-dialog' : ''}`} aria-label={copy.dialogTitle}>
    <AccessibleGallery visible={!animated} onSelect={setSelection} states={states} />
    {animated && <>
      <div className="spatial-canvas" data-lenis-prevent-touch aria-hidden="true">
        <GalleryBoundary onFailure={onFailure}>
          {ready && (!mobileControls || mobileEntered) && <Canvas key={mobileControls ? 'mobile' : 'desktop'} frameloop="demand" dpr={[1, 1.5]} camera={{ position: [0, 0, galleryConfig.distance], fov: galleryConfig.fov, near: .05, far: 100 }} gl={{ alpha: true, antialias: true }} fallback={<span>WebGL is unavailable.</span>}>
            <CanvasRuntime />
            <SpatialGalleryScene motion={motion} onFailure={onFailure} states={states} mobileControls={mobileControls} />
          </Canvas>}
        </GalleryBoundary>
      </div>
      {mobileControls && <nav className="spatial-mobile-controls" aria-label="Gallery categories" data-lenis-prevent>
        <div className="spatial-mobile-states">
          {states.map((state, index) => <button key={state.id} type="button"
            className={index === mobileState ? 'is-active' : ''}
            aria-label={`Show ${state.label}`} aria-pressed={index === mobileState}
            onClick={() => navigateMobile.current?.(index)}><span>{state.label}</span></button>)}
        </div>
        <div className="spatial-mobile-navigation">
          {mobileState > 0 && <button type="button" className="spatial-mobile-previous"
            aria-label={`Previous category: ${states[mobileState - 1].label}`}
            onClick={() => navigateMobile.current?.(mobileState - 1)}>
            <span aria-hidden="true">PREV</span>
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 5 7 7-7 7" /></svg>
          </button>}
          <button type="button" className="spatial-mobile-next"
            aria-label={mobileState === states.length - 1 ? 'Continue to next section' : `Next category: ${states[mobileState + 1].label}`}
            onClick={() => navigateMobile.current?.(mobileState + 1)}>
            <span aria-hidden="true">{mobileState === states.length - 1 ? 'EXIT' : copy.nextLabel}</span>
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 5 7 7-7 7" /></svg>
          </button>
        </div>
      </nav>}
      {mobileControls && <button type="button" className="spatial-mobile-close" aria-label="Exit gallery experience" onClick={() => closeMobile()}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 5 19 19M19 5 5 19" /></svg></button>}
      <div className="spatial-scroll-zone" aria-hidden="true">
        <span className="spatial-touch-explore">{copy.touchExplorePrompt}</span>
      </div>
      <div className="spatial-overlays" aria-hidden="true">
        <div className="spatial-glass" />
        {states.map((state, index) => <div className="spatial-state" key={state.id}>
          <div className={`spatial-heading ${index === 0 ? 'is-first' : ''}`}>
            <span className="spatial-eyebrow">{state.category}</span>
            <h2>{state.heading}</h2>{state.subtitle && <p>{state.subtitle}</p>}
        <div className="spatial-explore" data-visible="false"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor"><path d="M12 2v20M2 12h20M9 5l3-3 3 3M9 19l3 3 3-3M5 9l-3 3 3 3M19 9l3 3-3 3" /></svg>{copy.explorePrompt}</div>
          </div>
        </div>)}
        <div className="spatial-progress">{states.map(state => <div className="spatial-progress-item" key={state.id}><span>{state.label}</span><i /></div>)}</div>
        <ScrollIndicator />
      </div>
    </>}
    {mobileControls && <div className="spatial-mobile-entry">
      <h2>{copy.entryTitle}</h2>
      <div className="spatial-mobile-preview-wrap">
        <div className="spatial-mobile-preview" aria-hidden="true">
          {states[0]?.photos.slice(0, 5).map((photo, index) => <img key={`${photo.src}-${index}`} className={`spatial-mobile-preview-photo photo-${index}`} src={photo.src} alt="" loading="eager" />)}
        </div>
        <button className="spatial-mobile-enter" type="button" onClick={enterMobile}>{copy.enterLabel}<span aria-hidden="true">＋</span></button>
      </div>
      <p>{copy.entryNote}</p>
    </div>}
  </section>{selection && <GalleryPhotoDialog selection={selection} onClose={closePhoto} onCloseStart={startClosingPhoto} states={states} copy={copy} />}</div>;
}
