"use client";

import dynamic from "next/dynamic";
import { Component, useRef, type CSSProperties, type ReactNode } from "react";
import { HeroBackground } from "./HeroBackground";
import { ScrollIndicator } from "./ScrollIndicator";
import { FullscreenHeading, type FullscreenHeadingHandle } from "./FullscreenHeading";
import { InsigniaIntroduction } from "./InsigniaIntroduction";
import { SpatialGallery } from "./spatial-gallery/SpatialGallery";
import { PastEditions } from "./PastEditions";
import { SiteFooter } from "./SiteFooter";
import { sceneConfig } from "@/config/scene";

const ExperienceCanvas = dynamic(() => import("./ExperienceCanvas"), {
  ssr: false,
  loading: () => <div className="status" role="status">Preparing scene…</div>,
});

class SceneErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() {
    if (this.state.failed) return (
      <div className="status" role="alert">
        Unable to load the 3D experience.
        <button onClick={() => window.location.reload()}>Try again</button>
      </div>
    );
    return this.props.children;
  }
}

export function InsigniaExperience() {
  const heroRef = useRef<HTMLElement>(null);
  const scrollIndicatorRef = useRef<HTMLDivElement>(null);
  const fullscreenHeadingRef = useRef<FullscreenHeadingHandle>(null);
  const trackStyle = {
    "--hero-track-length": 1 + sceneConfig.hero.scroll.distanceInViewports,
  } as CSSProperties;

  return (
    <main aria-label="INSIGNIA camcorder experience">
      <div className="hero-track" style={trackStyle}>
        <section ref={heroRef} className="experience">
          <HeroBackground />
          <div className="canvas-shell" role="img" aria-label="An open-LCD camcorder rotates from a three-quarter view to a rear view as you scroll">
            <SceneErrorBoundary><ExperienceCanvas heroRef={heroRef} scrollIndicatorRef={scrollIndicatorRef} fullscreenHeadingRef={fullscreenHeadingRef} /></SceneErrorBoundary>
          </div>
          <ScrollIndicator ref={scrollIndicatorRef} />
          <FullscreenHeading ref={fullscreenHeadingRef} />
        </section>
      </div>
      <InsigniaIntroduction />
      <SpatialGallery />
      <PastEditions />
      <SiteFooter />
    </main>
  );
}
