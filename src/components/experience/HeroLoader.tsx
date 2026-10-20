"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { LumikaiLogo } from "@/components/layout/LumikaiLogo";

export function HeroLoader({ ready }: { ready: boolean }) {
  const [finished, setFinished] = useState(false);
  const [removed, setRemoved] = useState(false);
  const readyRef = useRef(ready);
  const played = useRef(false);
  useEffect(() => {
    readyRef.current = ready;
    if (ready && played.current && window.matchMedia("(prefers-reduced-motion: reduce)").matches) setFinished(true);
  }, [ready]);
  const onCycle = useCallback(() => {
    played.current = true;
    if (readyRef.current) setFinished(true);
  }, []);
  useEffect(() => {
    if (!finished) return;
    const timer = window.setTimeout(() => setRemoved(true), 600);
    return () => window.clearTimeout(timer);
  }, [finished]);
  if (removed) return null;
  return <div className={`hero-loader${finished ? " is-finished" : ""}`} role="status" aria-label="Preparing the experience">
    <div className="hero-loader-content">
      <LumikaiLogo dotsOnly onCycle={onCycle} alt="" />
      <p>INSIDE INDIA’S<br />INTERACTIVE FUTURE</p>
    </div>
  </div>;
}
