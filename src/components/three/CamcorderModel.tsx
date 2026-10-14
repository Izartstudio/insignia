import { useLayoutEffect, useMemo, useRef, type RefObject } from "react";
import { useGLTF } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import { PerspectiveCamera, type Group } from "three";
import { sceneConfig } from "@/config/scene";
import { measureModel } from "@/lib/three/modelUtils";
import { createCamcorderTimeline } from "@/lib/animations/camcorderTimeline";
import { LCDVideoSurface, type LCDSurfaceHandle } from "./LCDVideoSurface";
import type { LCDVideoResource } from "@/lib/three/useLCDVideo";
import { CameraRig } from "./CameraRig";
import type { FullscreenHeadingHandle } from "@/components/experience/FullscreenHeading";

export function CamcorderModel({ heroRef, scrollIndicatorRef, fullscreenHeadingRef, video, hasFrame }: { heroRef: RefObject<HTMLElement | null>; scrollIndicatorRef: RefObject<HTMLDivElement | null>; fullscreenHeadingRef: RefObject<FullscreenHeadingHandle | null>; video: LCDVideoResource | null; hasFrame: boolean }) {
  const { scene } = useGLTF(sceneConfig.modelUrl);
  const model = useMemo(() => scene.clone(true), [scene]);
  const bounds = useMemo(() => measureModel(model), [model]);
  const animationGroup = useRef<Group>(null);
  const lcdSurface = useRef<LCDSurfaceHandle>(null);
  const invalidate = useThree((state) => state.invalidate);
  const camera = useThree((state) => state.camera);
  const size = useThree((state) => state.size);
  const radius = sceneConfig.model.normalizedRadius;

  useLayoutEffect(() => {
    const section = heroRef.current;
    const group = animationGroup.current;
    const screen = lcdSurface.current;
    if (!section || !group || !screen || !(camera instanceof PerspectiveCamera)) return;
    return createCamcorderTimeline({
      section,
      modelGroup: group,
      screen,
      camera,
      viewport: { width: size.width, height: size.height },
      radius,
      halfHeight: bounds.halfHeight * radius / bounds.radius,
      indicator: scrollIndicatorRef.current,
      heading: fullscreenHeadingRef.current,
      invalidate,
    });
  }, [heroRef, scrollIndicatorRef, fullscreenHeadingRef, video, camera, size.width, size.height, radius, bounds.halfHeight, bounds.radius, invalidate]);

  return (
    <>
      <CameraRig radius={radius} halfHeight={bounds.halfHeight * radius / bounds.radius} />
      <group ref={animationGroup} rotation={[0, sceneConfig.hero.rotation.initialY, 0]}>
        <group rotation={sceneConfig.model.orientation} scale={radius / bounds.radius}>
          <group position={bounds.offset}>
            <primitive object={model} dispose={null} />
            {video && <LCDVideoSurface ref={lcdSurface} resource={video} hasFrame={hasFrame} />}
          </group>
        </group>
      </group>
    </>
  );
}

useGLTF.preload(sceneConfig.modelUrl);
