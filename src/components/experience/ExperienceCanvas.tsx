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

export default function ExperienceCanvas({ heroRef, fullscreenHeadingRef, onReady }: { onReady: () => void; heroRef: RefObject<HTMLElement | null>; fullscreenHeadingRef: RefObject<FullscreenHeadingHandle | null> }) {
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
          <CamcorderModel heroRef={heroRef} fullscreenHeadingRef={fullscreenHeadingRef} video={video.resource} hasFrame={video.hasFrame} />
          <SceneReady onReady={onReady} />
        </Suspense>
      </Canvas>
      <div className="film-controls">
        {(video.status === "blocked" || video.status === "error") && (
          <button type="button" onClick={video.resume}>
            {video.status === "error" ? "Retry film" : "Play film"}
          </button>
        )}
      </div>
    </>
  );
}
