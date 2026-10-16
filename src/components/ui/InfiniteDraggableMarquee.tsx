"use client";

import { useEffect, useLayoutEffect, useRef, useState, type PointerEvent, type ReactNode } from "react";

type InfiniteDraggableMarqueeProps = {
  items: readonly ReactNode[];
  direction?: "left" | "right";
  speed?: number;
  gap?: number;
  draggable?: boolean;
  pauseOnHover?: boolean;
  className?: string;
  ariaLabel?: string;
};

const wrapOffset = (value: number, width: number) => {
  if (width <= 0) return 0;
  return ((value % width) + width) % width - width;
};

export function InfiniteDraggableMarquee({
  items,
  direction = "left",
  speed = 35,
  gap = 20,
  draggable = true,
  pauseOnHover = false,
  className = "",
  ariaLabel,
}: InfiniteDraggableMarqueeProps) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const sequenceRef = useRef<HTMLDivElement>(null);
  const offset = useRef(0);
  const sequenceWidth = useRef(0);
  const active = useRef(false);
  const hovered = useRef(false);
  const reducedMotion = useRef(false);
  const drag = useRef({ pointerId: -1, startX: 0, startY: 0, lastX: 0, lastTime: 0, intent: "pending" as "pending" | "horizontal" | "vertical", velocity: 0 });
  const [copies, setCopies] = useState(3);
  const [dragging, setDragging] = useState(false);

  useLayoutEffect(() => {
    const viewport = viewportRef.current;
    const sequence = sequenceRef.current;
    if (!viewport || !sequence || items.length === 0) return;
    const measure = () => {
      const previousWidth = sequenceWidth.current;
      const nextWidth = sequence.getBoundingClientRect().width;
      if (nextWidth <= 0) return;
      const phase = previousWidth > 0 ? offset.current / previousWidth : direction === "right" ? -1 : 0;
      sequenceWidth.current = nextWidth;
      offset.current = wrapOffset(phase * nextWidth, nextWidth);
      setCopies(Math.max(3, Math.ceil(viewport.clientWidth / nextWidth) + 2));
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(viewport);
    observer.observe(sequence);
    return () => observer.disconnect();
  }, [direction, items.length]);

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    const observer = new IntersectionObserver(([entry]) => { active.current = entry.isIntersecting; }, { rootMargin: "120px 0px" });
    observer.observe(viewport);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => { reducedMotion.current = query.matches; };
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    let frame = 0;
    let previous = performance.now();
    const render = (time: number) => {
      const delta = Math.min((time - previous) / 1000, 0.05);
      previous = time;
      const state = drag.current;
      const canMove = active.current && !document.hidden && !reducedMotion.current && state.intent !== "horizontal" && !(pauseOnHover && hovered.current);
      if (canMove && sequenceWidth.current > 0) {
        const automatic = direction === "right" ? speed : -speed;
        offset.current += (automatic + state.velocity) * delta;
        state.velocity *= Math.pow(0.035, delta);
        if (Math.abs(state.velocity) < 1) state.velocity = 0;
        offset.current = wrapOffset(offset.current, sequenceWidth.current);
      }
      if (trackRef.current && active.current && !document.hidden) trackRef.current.style.transform = `translate3d(${offset.current}px,0,0)`;
      frame = requestAnimationFrame(render);
    };
    frame = requestAnimationFrame(render);
    return () => cancelAnimationFrame(frame);
  }, [direction, pauseOnHover, speed]);

  const resetPointer = (event: PointerEvent<HTMLDivElement>) => {
    if (drag.current.pointerId !== event.pointerId) return;
    if (viewportRef.current?.hasPointerCapture(event.pointerId)) viewportRef.current.releasePointerCapture(event.pointerId);
    drag.current.pointerId = -1;
    drag.current.intent = "pending";
    setDragging(false);
  };

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (!draggable || event.button !== 0) return;
    drag.current = { pointerId: event.pointerId, startX: event.clientX, startY: event.clientY, lastX: event.clientX, lastTime: performance.now(), intent: "pending", velocity: 0 };
  };

  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const state = drag.current;
    if (state.pointerId !== event.pointerId || state.intent === "vertical") return;
    const totalX = event.clientX - state.startX;
    const totalY = event.clientY - state.startY;
    if (state.intent === "pending") {
      if (Math.max(Math.abs(totalX), Math.abs(totalY)) < 7) return;
      if (Math.abs(totalY) > Math.abs(totalX)) { state.intent = "vertical"; return; }
      state.intent = "horizontal";
      viewportRef.current?.setPointerCapture(event.pointerId);
      setDragging(true);
    }
    event.preventDefault();
    const now = performance.now();
    const deltaX = event.clientX - state.lastX;
    const deltaTime = Math.max(now - state.lastTime, 1);
    offset.current = wrapOffset(offset.current + deltaX, sequenceWidth.current);
    state.velocity = deltaX / deltaTime * 1000 * 0.7;
    state.lastX = event.clientX;
    state.lastTime = now;
  };

  return (
    <div
      ref={viewportRef}
      className={`infinite-marquee ${dragging ? "is-dragging" : ""} ${className}`.trim()}
      aria-label={ariaLabel}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={resetPointer}
      onPointerCancel={resetPointer}
      onLostPointerCapture={resetPointer}
      onPointerEnter={() => { hovered.current = true; }}
      onPointerLeave={() => { hovered.current = false; }}
    >
      <div ref={trackRef} className="infinite-marquee-track">
        {Array.from({ length: copies }, (_, copyIndex) => (
          <div
            ref={copyIndex === 0 ? sequenceRef : undefined}
            className="infinite-marquee-sequence"
            style={{ "--marquee-gap": `${gap}px` } as React.CSSProperties}
            aria-hidden={copyIndex > 0 || undefined}
            key={copyIndex}
          >
            {items.map((item, itemIndex) => <div className="infinite-marquee-item" key={itemIndex}>{item}</div>)}
          </div>
        ))}
      </div>
    </div>
  );
}
