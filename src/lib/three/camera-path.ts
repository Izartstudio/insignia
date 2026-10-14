import {
  MathUtils,
  Matrix4,
  PerspectiveCamera,
  Quaternion,
  Vector3,
  type Object3D,
} from "three";
import { sceneConfig } from "@/config/scene";
import { lcdConfig } from "./lcd-config";

export type CameraPose = {
  position: Vector3;
  quaternion: Quaternion;
  target: Vector3;
};

export type LCDWorldFrame = {
  center: Vector3;
  normal: Vector3;
  width: number;
  height: number;
};

const worldUp = new Vector3(...sceneConfig.camera.up);
const localNormal = new Vector3(0, 0, 1);
const localCenter = new Vector3(0, 0, lcdConfig.normalOffset);
const lookMatrix = new Matrix4();

export function getLCDWorldFrame(screen: Object3D): LCDWorldFrame {
  screen.updateWorldMatrix(true, false);
  const quaternion = screen.getWorldQuaternion(new Quaternion());
  const scale = screen.getWorldScale(new Vector3());
  return {
    center: screen.localToWorld(localCenter.clone()),
    normal: localNormal.clone().applyQuaternion(quaternion).normalize(),
    width: lcdConfig.width * Math.abs(scale.x),
    height: lcdConfig.height * Math.abs(scale.y),
  };
}

export function getStartCameraPose(
  camera: PerspectiveCamera,
  viewportWidth: number,
  viewportHeight: number,
  radius: number,
  halfHeight: number,
): CameraPose {
  const config = sceneConfig.camera;
  const aspect = viewportWidth / Math.max(viewportHeight, 1);
  const halfVertical = MathUtils.degToRad(config.fov / 2);
  const halfHorizontal = Math.atan(Math.tan(halfVertical) * aspect);
  const distance = Math.max(
    radius * config.distanceInRadii,
    radius * config.framingPadding / Math.sin(halfHorizontal),
    (halfHeight + Math.abs(config.target[1])) * config.framingPadding / Math.tan(halfVertical) + radius,
  );
  const target = new Vector3(...config.target);
  const position = new Vector3(...config.viewDirection)
    .normalize()
    .multiplyScalar(distance)
    .add(target);
  lookMatrix.lookAt(position, target, worldUp);
  return { position, quaternion: new Quaternion().setFromRotationMatrix(lookMatrix), target };
}

export function getEndCameraPose(
  camera: PerspectiveCamera,
  frame: LCDWorldFrame,
  viewportWidth: number,
  viewportHeight: number,
): CameraPose & { distance: number } {
  const aspect = viewportWidth / Math.max(viewportHeight, 1);
  const halfVertical = MathUtils.degToRad(camera.fov / 2);
  const halfHorizontal = Math.atan(Math.tan(halfVertical) * aspect);
  const verticalDistance = frame.height / 2 / Math.tan(halfVertical);
  const horizontalDistance = frame.width / 2 / Math.tan(halfHorizontal);
  const distance = Math.min(verticalDistance, horizontalDistance) / sceneConfig.camera.fullscreenCoverage;
  const position = frame.center.clone().addScaledVector(frame.normal, distance);
  lookMatrix.lookAt(position, frame.center, worldUp);
  return {
    position,
    quaternion: new Quaternion().setFromRotationMatrix(lookMatrix),
    target: frame.center.clone(),
    distance,
  };
}

export function smoothProgress(value: number) {
  return value * value * (3 - 2 * value);
}
