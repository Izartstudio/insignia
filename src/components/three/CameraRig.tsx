import { useLayoutEffect, useRef } from "react";
import { useThree } from "@react-three/fiber";
import { PerspectiveCamera } from "three";
import { sceneConfig } from "@/config/scene";
import { getStartCameraPose } from "@/lib/three/camera-path";
export function CameraRig({ radius, halfHeight }: { radius: number; halfHeight: number }) {
  const initialized = useRef(false);
  const camera = useThree((state) => state.camera);
  const size = useThree((state) => state.size);
  const invalidate = useThree((state) => state.invalidate);
  useLayoutEffect(() => {
    if (!(camera instanceof PerspectiveCamera)) return;
    const config = sceneConfig.camera;
    camera.fov = config.fov;
    camera.aspect = size.width / Math.max(size.height, 1);
    camera.near = radius * config.nearRadiusRatio;
    camera.far = radius * (config.distanceInRadii + config.farRadiusPadding);
    camera.up.fromArray(config.up);
    const pose = getStartCameraPose(camera, size.width, size.height, radius, halfHeight);
    camera.far = Math.max(camera.far, pose.position.distanceTo(pose.target) + radius * config.farRadiusPadding);
    if (!initialized.current) {
      camera.position.copy(pose.position);
      camera.quaternion.copy(pose.quaternion);
      initialized.current = true;
    }
    camera.updateProjectionMatrix();
    invalidate();
  }, [camera, size.width, size.height, radius, halfHeight, invalidate]);
  return null;
}
