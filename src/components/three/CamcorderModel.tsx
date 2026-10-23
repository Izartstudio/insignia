import { useLayoutEffect, useMemo, useRef, type RefObject } from "react";
import { useGLTF } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import { Mesh, MeshStandardMaterial, PerspectiveCamera, type Group } from "three";
import { toCreasedNormals } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { sceneConfig } from "@/config/scene";
import { measureModel } from "@/lib/three/modelUtils";
import { createCamcorderTimeline } from "@/lib/animations/camcorderTimeline";
import { LCDVideoSurface, type LCDSurfaceHandle } from "./LCDVideoSurface";
import type { LCDVideoResource } from "@/lib/three/useLCDVideo";
import { CameraRig } from "./CameraRig";
import type { FullscreenHeadingHandle } from "@/components/experience/FullscreenHeading";

export function CamcorderModel({ heroRef, fullscreenHeadingRef, video, hasFrame }: { heroRef: RefObject<HTMLElement | null>; fullscreenHeadingRef: RefObject<FullscreenHeadingHandle | null>; video: LCDVideoResource | null; hasFrame: boolean }) {
  const { scene } = useGLTF(sceneConfig.modelUrl);
  const gl = useThree((state) => state.gl);
  const model = useMemo(() => {
    const clone = scene.clone(true);
    clone.traverse((object) => {
      if (!(object instanceof Mesh)) return;
      // Smooth curved surfaces while retaining sharp casing and bezel edges.
      // Work at a larger scale so the utility's vertex tolerance does not
      // merge the small model's nearby bezel and body details.
      const geometry = object.geometry.clone().scale(100, 100, 100);
      object.geometry = toCreasedNormals(geometry, Math.PI / 3);
      if (object.geometry !== geometry) geometry.dispose();
      object.geometry.scale(0.01, 0.01, 0.01);
      const refine = (source: MeshStandardMaterial) => {
        const material = source.clone();
        if (material instanceof MeshStandardMaterial) {
          material.roughness = Math.max(material.roughness, 0.42);
          material.normalScale?.setScalar(0.08);
          if (material.map) {
            material.map.anisotropy = Math.min(8, gl.capabilities.getMaxAnisotropy());
            material.map.needsUpdate = true;
          }
        }
        return material;
      };
      object.material = Array.isArray(object.material) ? object.material.map(refine) : refine(object.material);
    });
    return clone;
  }, [scene, gl]);
  useLayoutEffect(() => () => {
    model.traverse((object) => {
      if (!(object instanceof Mesh)) return;
      object.geometry.dispose();
      (Array.isArray(object.material) ? object.material : [object.material]).forEach(material => material.dispose());
    });
  }, [model]);
  const bounds = useMemo(() => measureModel(model), [model]);
  const animationGroup = useRef<Group>(null);
  const lcdSurface = useRef<LCDSurfaceHandle>(null);
  const invalidate = useThree((state) => state.invalidate);
  const camera = useThree((state) => state.camera);
  const size = useThree((state) => state.size);
  const radius = sceneConfig.model.normalizedRadius;
  // Keep timeline ownership stable across toolbar/orientation resize events.
  const viewport = useRef({ width: size.width, height: size.height });
  const timeline = useRef<ReturnType<typeof createCamcorderTimeline> | null>(null);
  useLayoutEffect(() => {
    viewport.current.width = size.width;
    viewport.current.height = size.height;
    timeline.current?.resize();
  }, [size.width, size.height]);

  useLayoutEffect(() => {
    const section = heroRef.current;
    const group = animationGroup.current;
    const screen = lcdSurface.current;
    if (!section || !group || !screen || !(camera instanceof PerspectiveCamera)) return;
    const controller = createCamcorderTimeline({
      section,
      modelGroup: group,
      screen,
      camera,
      viewport: viewport.current,
      radius,
      halfHeight: bounds.halfHeight * radius / bounds.radius,
      heading: fullscreenHeadingRef.current,
      invalidate,
    });
    timeline.current = controller;
    return () => {
      timeline.current = null;
      controller();
    };
  }, [heroRef, fullscreenHeadingRef, video, camera, radius, bounds.halfHeight, bounds.radius, invalidate]);

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
