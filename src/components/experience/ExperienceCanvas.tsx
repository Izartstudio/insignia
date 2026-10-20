"use client";
import { Suspense, useRef, type RefObject } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { sceneConfig } from "@/config/scene";
import { CamcorderModel } from "@/components/three/CamcorderModel";
import { useLCDVideo } from "@/lib/three/useLCDVideo";
import { CanvasRuntime } from "@/components/three/CanvasRuntime";
import { SceneLighting } from "@/components/three/SceneLighting";
import type { FullscreenHeadingHandle } from "./FullscreenHeading";
function SceneReady({ onReady }: { onReady: () => void }) {
  const reported = useRef(false);
  useFrame(() => { if (!reported.current) { reported.current = true; onReady(); } });
  return null;
}

export default function ExperienceCanvas({ heroRef, scrollIndicatorRef, fullscreenHeadingRef, onReady }: { onReady: () => void; heroRef: RefObject<HTMLElement | null>; scrollIndicatorRef: RefObject<HTMLDivElement | null>; fullscreenHeadingRef: RefObject<FullscreenHeadingHandle | null> }) {
  const video = useLCDVideo(heroRef);
  return (
    <>
      <Canvas
        frameloop="demand"
        dpr={sceneConfig.dpr}
        camera={{ fov: sceneConfig.camera.fov }}
        gl={{ antialias: true, alpha: true }}
        fallback={
          <div className="status" role="alert">
            This experience requires WebGL. Please try a compatible browser.
          </div>
        }
      >
        <CanvasRuntime />
        <SceneLighting />
        <Suspense fallback={null}>
          <CamcorderModel heroRef={heroRef} scrollIndicatorRef={scrollIndicatorRef} fullscreenHeadingRef={fullscreenHeadingRef} video={video.resource} hasFrame={video.hasFrame} />
          <SceneReady onReady={onReady} />
        </Suspense>
      </Canvas>
      <div className="film-controls">
        {(video.status === "blocked" || video.status === "error") && (
          <button type="button" onClick={video.resume}>
            {video.status === "error" ? "Retry film" : "Play film"}
          </button>
        )}
        <button className="film-volume" type="button" onClick={video.toggleSound} disabled={!video.resource} aria-label={video.muted ? "Enable film sound" : "Mute film sound"} title={video.muted ? "Enable sound" : "Mute sound"}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M11 5 6 9H3v6h3l5 4V5Z" />
            {video.muted ? <path d="m16 9 6 6m0-6-6 6" /> : <><path d="M15 8a6 6 0 0 1 0 8" /><path d="M18 5a10 10 0 0 1 0 14" /></>}
          </svg>
        </button>
      </div>
    </>
  );
}
