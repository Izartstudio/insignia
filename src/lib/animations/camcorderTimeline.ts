import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  ArrowHelper,
  BufferGeometry,
  Group,
  Line,
  LineBasicMaterial,
  Mesh,
  MeshBasicMaterial,
  PerspectiveCamera,
  SphereGeometry,
  Vector3,
  type Object3D,
} from "three";
import { sceneConfig } from "@/config/scene";
import {
  getEndCameraPose,
  getLCDWorldFrame,
  getStartCameraPose,
  smoothProgress,
  type CameraPose,
} from "@/lib/three/camera-path";
import type { LCDSurfaceHandle } from "@/components/three/LCDVideoSurface";
import type { FullscreenHeadingHandle } from "@/components/experience/FullscreenHeading";

type TimelineOptions = {
  section: HTMLElement;
  modelGroup: Group;
  screen: LCDSurfaceHandle;
  camera: PerspectiveCamera;
  viewport: { width: number; height: number };
  radius: number;
  halfHeight: number;
  indicator: HTMLElement | null;
  heading: FullscreenHeadingHandle | null;
  invalidate: () => void;
};

type DebugPath = { group: Group; update: (start: CameraPose, approach: Vector3, end: CameraPose, normal: Vector3) => void; dispose: () => void };

function createDebugPath(scene: Object3D): DebugPath | null {
  if (process.env.NODE_ENV !== "development" || !sceneConfig.camera.debug.enabled) return null;
  const group = new Group();
  const geometry = new BufferGeometry();
  const material = new LineBasicMaterial({ color: sceneConfig.camera.debug.pathColor, depthTest: false });
  const path = new Line(geometry, material);
  const markerGeometry = new SphereGeometry(0.012, 10, 10);
  const markerMaterial = new MeshBasicMaterial({ color: sceneConfig.camera.debug.targetColor, depthTest: false });
  const target = new Mesh(markerGeometry, markerMaterial);
  const normal = new ArrowHelper(new Vector3(0, 0, 1), new Vector3(), 0.2, sceneConfig.camera.debug.endColor);
  group.add(path, target, normal);
  scene.add(group);
  return {
    group,
    update(start, approach, end, surfaceNormal) {
      geometry.setFromPoints([start.position, approach, end.position]);
      target.position.copy(end.target);
      normal.position.copy(end.target);
      normal.setDirection(surfaceNormal);
    },
    dispose() {
      scene.remove(group);
      geometry.dispose();
      material.dispose();
      markerGeometry.dispose();
      markerMaterial.dispose();
    },
  };
}

export function createCamcorderTimeline(options: TimelineOptions) {
  gsap.registerPlugin(ScrollTrigger);
  const { section, modelGroup, screen, camera, viewport, radius, halfHeight, indicator, heading, invalidate } = options;
  const { rotation, scroll, timeline: timing } = sceneConfig.hero;
  const media = gsap.matchMedia();
  const cameraScene = camera.parent;
  const debug = cameraScene ? createDebugPath(cameraScene) : null;
  const zoom = { value: 0 };
  const approach = new Vector3();
  const focus = new Vector3();
  let startPose = getStartCameraPose(camera, viewport.width, viewport.height, radius, halfHeight);
  let endPose = startPose;
  let endDistance = 0;
  let refreshFrame = 0;
  let headingVisible = false;

  const calculateTargets = () => {
    startPose = getStartCameraPose(camera, viewport.width, viewport.height, radius, halfHeight);
    const previousY = modelGroup.rotation.y;
    modelGroup.rotation.y = rotation.finalY;
    modelGroup.updateWorldMatrix(true, true);
    const frame = getLCDWorldFrame(screen.root);
    const calculatedEnd = getEndCameraPose(camera, frame, viewport.width, viewport.height);
    endPose = calculatedEnd;
    endDistance = calculatedEnd.distance;
    approach.copy(frame.center).addScaledVector(frame.normal, endDistance * sceneConfig.camera.approachDistanceScale);
    modelGroup.rotation.y = previousY;
    modelGroup.updateWorldMatrix(true, true);
    debug?.update(startPose, approach, endPose, frame.normal);
  };

  const renderCamera = () => {
    const progress = smoothProgress(Math.min(zoom.value / timing.fullscreenThreshold, 1));
    // A single direct approach avoids the high waypoint and late correction.
    camera.position.lerpVectors(startPose.position, endPose.position, progress);
    // Center the LCD early, then keep looking at its center throughout the
    // approach. Interpolating endpoint rotations lets it drift toward the bottom.
    const focusProgress = smoothProgress(Math.min(zoom.value / 0.25, 1));
    focus.lerpVectors(startPose.target, endPose.target, focusProgress);
    camera.lookAt(focus);
    camera.fov = sceneConfig.camera.fov;
    camera.near = radius * sceneConfig.camera.nearRadiusRatio;
    camera.far = radius * (sceneConfig.camera.distanceInRadii + sceneConfig.camera.farRadiusPadding);
    camera.updateProjectionMatrix();
    if (!headingVisible && zoom.value >= sceneConfig.heading.revealThreshold) {
      headingVisible = true;
      heading?.reveal();
    } else if (headingVisible && zoom.value <= sceneConfig.heading.hideThreshold) {
      headingVisible = false;
      heading?.hide();
    }
    invalidate();
  };

  calculateTargets();
  const context = gsap.context(() => {
    media.add(
      { motion: "(prefers-reduced-motion: no-preference)", reduced: "(prefers-reduced-motion: reduce)" },
      (match) => {
        if (match.conditions?.reduced) {
          gsap.set(modelGroup.rotation, { y: rotation.finalY });
          zoom.value = 0;
          heading?.hide();
          renderCamera();
          return;
        }

        gsap.set(modelGroup.rotation, { y: rotation.initialY });
        if (indicator) gsap.set(indicator, { opacity: 1 });
        const master = gsap.timeline({
          defaults: { ease: "none" },
          scrollTrigger: {
          // Measure upstream pins first, regardless of asynchronous mount order.
          refreshPriority: 40,
            trigger: section,
            start: scroll.start,
            end: () => `+=${section.clientHeight * scroll.distanceInViewports}`,
            scrub: scroll.scrub,
            pin: true,
            pinSpacing: false,
            anticipatePin: scroll.anticipatePin,
            invalidateOnRefresh: true,
            onRefreshInit: calculateTargets,
            onRefresh: renderCamera,
          },
          onUpdate: renderCamera,
        });

        master
          .fromTo(modelGroup.rotation, { y: rotation.initialY }, { y: rotation.finalY, duration: timing.rotationEnd }, 0)
          .to({}, { duration: timing.zoomStart - timing.rotationEnd }, timing.rotationEnd)
          .fromTo(zoom, { value: 0 }, { value: 1, duration: 1 - timing.zoomStart }, timing.zoomStart);
        if (indicator) master.to(indicator, { opacity: 0, duration: 1 - timing.indicatorFadeStart }, timing.indicatorFadeStart);

        renderCamera();
        refreshFrame = requestAnimationFrame(() => ScrollTrigger.refresh(true));
        return () => cancelAnimationFrame(refreshFrame);
      },
    );
  }, section);

  return () => {
    cancelAnimationFrame(refreshFrame);
    media.revert();
    context.revert();
    debug?.dispose();
  };
}
