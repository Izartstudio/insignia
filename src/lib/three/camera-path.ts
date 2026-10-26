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
  framing: "cover" | "camcorder" = "cover",
): CameraPose & { distance: number } {
  const aspect = viewportWidth / Math.max(viewportHeight, 1);
  const halfVertical = MathUtils.degToRad(camera.fov / 2);
  const halfHorizontal = Math.atan(Math.tan(halfVertical) * aspect);
  const verticalDistance = frame.height / 2 / Math.tan(halfVertical);
  const horizontalDistance = frame.width / 2 / Math.tan(halfHorizontal);
  // Touch layouts retain the LCD bezel and surrounding camcorder at the endpoint.
  // Gradually add bezel margin on narrow phones without switching to a body-wide shot.
  const touchWidthCoverage = .78 + .10 * MathUtils.clamp((viewportWidth - 320) / 110, 0, 1);
  const touchHeightCoverage = viewportHeight < 500 ? .42 : .5;
  const distance = framing === "camcorder"
    ? Math.max(verticalDistance / touchHeightCoverage, horizontalDistance / touchWidthCoverage)
    : Math.max(
      Math.min(frame.height, frame.width / lcdConfig.videoAspect) / 2 / Math.tan(halfVertical),
      Math.min(frame.width, frame.height * lcdConfig.videoAspect) / 2 / Math.tan(halfHorizontal),
    ) / .995;
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

/** Keep the complete letterboxed video inside the frustum during the approach too. */
export function getVideoFitDistance(camera: PerspectiveCamera, screen: Object3D, target: Vector3, viewportWidth: number, viewportHeight: number) {
  screen.updateWorldMatrix(true, false);
  const width = Math.min(lcdConfig.width, lcdConfig.height * lcdConfig.videoAspect);
  const height = width / lcdConfig.videoAspect;
  const inverse = camera.quaternion.clone().invert();
  const tanY = Math.tan(MathUtils.degToRad(camera.fov / 2));
  const tanX = tanY * viewportWidth / Math.max(1, viewportHeight);
  let distance = 0;
  const point = new Vector3();
  for (const x of [-width / 2, width / 2]) for (const y of [-height / 2, height / 2]) {
    point.set(x, y, lcdConfig.normalOffset);
    screen.localToWorld(point).sub(target).applyQuaternion(inverse);
    distance = Math.max(distance, point.z + Math.abs(point.x) / (tanX * .995), point.z + Math.abs(point.y) / (tanY * .995));
  }
  return distance;
}
