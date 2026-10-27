"use client";

import dynamic from "next/dynamic";
import { Component, useRef, useState, useCallback, type CSSProperties, type ReactNode } from "react";
import { HeroLoader } from "./HeroLoader";
import { HeroBackground } from "./HeroBackground";
import { ScrollIndicator } from "./ScrollIndicator";
import { FullscreenHeading, type FullscreenHeadingHandle } from "./FullscreenHeading";
import { InsigniaIntroduction } from "./InsigniaIntroduction";
import { SpatialGallery } from "./spatial-gallery/SpatialGallery";
import { PastEditions } from "./PastEditions";
import { SiteFooter } from "./SiteFooter";
import { sceneConfig } from "@/config/scene";
import type { SpatialGalleryContent } from '@/sanity/galleryContent';
import type { PastEditionsContent } from '@/content/past-editions';

const ExperienceCanvas = dynamic(() => import("./ExperienceCanvas"), {
  ssr: false,
  loading: () => null,
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

export function InsigniaExperience({ galleryContent, pastEditionsContent }: { galleryContent: SpatialGalleryContent; pastEditionsContent: PastEditionsContent }) {
  const [ready, setReady] = useState(false);
  const onReady = useCallback(() => setReady(true), []);
  const heroRef = useRef<HTMLElement>(null);
  const fullscreenHeadingRef = useRef<FullscreenHeadingHandle>(null);
  const trackStyle = {
    "--hero-track-length": 1 + sceneConfig.hero.scroll.distanceInViewports,
  } as CSSProperties;

  return (
    <main aria-label="Insignia by Lumikai — Interactive Media and Gaming Summit">
      <div className="hero-track" style={trackStyle}>
        <section id="insignia-hero" ref={heroRef} className="experience">
          <HeroBackground />
          <div className="canvas-shell" role="img" aria-label="An open-LCD camcorder rotates from a three-quarter view to a rear view as you scroll">
            <SceneErrorBoundary><ExperienceCanvas onReady={onReady} heroRef={heroRef} fullscreenHeadingRef={fullscreenHeadingRef} /><HeroLoader ready={ready} /></SceneErrorBoundary>
          </div>
          <FullscreenHeading ref={fullscreenHeadingRef} />
          {ready && <ScrollIndicator />}
        </section>
      </div>
      <InsigniaIntroduction />
      <SpatialGallery content={galleryContent} />
      <PastEditions content={pastEditionsContent} />
      <SiteFooter />
    </main>
  );
}
