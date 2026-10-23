import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef } from "react";
import { useThree } from "@react-three/fiber";
import { BufferGeometry, Float32BufferAttribute, CanvasTexture, Group, Mesh, SRGBColorSpace, ShaderChunk, Vector2, Vector3 } from "three";
import { lcdConfig } from "@/lib/three/lcd-config";
import surface from "@/lib/three/lcd-surface-v2.json";
import type { LCDVideoResource } from "@/lib/three/useLCDVideo";

const debug = process.env.NODE_ENV === "development" && lcdConfig.debug.enabled;

function UVPattern() {
  const texture = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 512; canvas.height = 384;
    const context = canvas.getContext("2d")!;
    for (let y = 0; y < 6; y++) for (let x = 0; x < 8; x++) {
      context.fillStyle = (x + y) % 2 ? "#eee" : "#333";
      context.fillRect(x * 64, y * 64, 64, 64);
    }
    context.fillStyle = "red"; context.font = "bold 36px sans-serif";
    context.fillText("TOP LEFT →", 10, 42); context.fillText("BOTTOM", 10, 370);
    const map = new CanvasTexture(canvas); map.colorSpace = SRGBColorSpace;
    return map;
  }, []);
  useEffect(() => () => texture.dispose(), [texture]);
  return <meshBasicMaterial map={texture} toneMapped={false} />;
}

export type LCDSurfaceHandle = { root: Group; mesh: Mesh; setFullscreenProgress: (progress: number) => void };

export const LCDVideoSurface = forwardRef<LCDSurfaceHandle, { resource: LCDVideoResource; hasFrame: boolean }>(function LCDVideoSurface({ resource, hasFrame }, forwardedRef) {
  const invalidate = useThree(state => state.invalidate);
  const root = useRef<Group>(null);
  const screen = useRef<Mesh>(null);
  const fit = useMemo(() => ({
    progress: { value: 0 },
    contain: { value: new Vector2(1, 1) },
    cover: { value: new Vector2(1, 1) },
  }), []);
  useEffect(() => {
    const update = () => {
      const aspect = resource.video.videoWidth && resource.video.videoHeight
        ? resource.video.videoWidth / resource.video.videoHeight : lcdConfig.videoAspect;
      const screenAspect = lcdConfig.width / lcdConfig.height;
      fit.contain.value.set(Math.max(1, screenAspect / aspect), Math.max(1, aspect / screenAspect));
      fit.cover.value.set(Math.min(1, screenAspect / aspect), Math.min(1, aspect / screenAspect));
      invalidate();
    };
    update();
    resource.video.addEventListener("loadedmetadata", update);
    return () => resource.video.removeEventListener("loadedmetadata", update);
  }, [resource, fit, invalidate]);
  const geometry = useMemo(() => {
    const mesh = new BufferGeometry();
    const positions = surface.positions.map((value, i) => i % 3 === 0 ? value * lcdConfig.width : i % 3 === 1 ? value * lcdConfig.height : value + lcdConfig.normalOffset);
    mesh.setAttribute("position", new Float32BufferAttribute(positions, 3));
    mesh.setAttribute("uv", new Float32BufferAttribute(surface.uvs, 2));
    mesh.computeVertexNormals();
    return mesh;
  }, []);

  useImperativeHandle(forwardedRef, () => ({
    root: root.current!, mesh: screen.current!,
    setFullscreenProgress: (progress: number) => { fit.progress.value = progress; },
  }), [fit]);

  useEffect(() => {
    const { video } = resource;
    let disposed = false, frame = 0, fallback = 0;
    const notify = () => { if (!disposed) { invalidate(); frame = video.requestVideoFrameCallback(notify); } };
    const tick = () => { if (!disposed && !video.paused) { invalidate(); fallback = requestAnimationFrame(tick); } };
    const start = () => { cancelAnimationFrame(fallback); tick(); };
    const stop = () => cancelAnimationFrame(fallback);
    if (typeof video.requestVideoFrameCallback === "function") frame = video.requestVideoFrameCallback(notify);
    else { video.addEventListener("playing", start); video.addEventListener("pause", stop); if (!video.paused) start(); }
    invalidate();
    return () => {
      disposed = true;
      if (typeof video.cancelVideoFrameCallback === "function") video.cancelVideoFrameCallback(frame);
      cancelAnimationFrame(fallback);
      video.removeEventListener("playing", start); video.removeEventListener("pause", stop);
    };
  }, [resource, invalidate]);

  useEffect(() => () => geometry.dispose(), [geometry]);

  return <group ref={root} position={lcdConfig.position} rotation={lcdConfig.rotation}>
    <mesh ref={screen} geometry={geometry} frustumCulled={false}>
      {debug && lcdConfig.debug.uvPattern ? <UVPattern /> : <meshBasicMaterial map={hasFrame ? resource.texture : resource.poster} toneMapped={false}
        customProgramCacheKey={() => "lcd-contain-to-cover-v1"}
        onBeforeCompile={shader => {
          shader.uniforms.lcdFullscreen = fit.progress;
          shader.uniforms.lcdContain = fit.contain;
          shader.uniforms.lcdCover = fit.cover;
          shader.fragmentShader = "uniform float lcdFullscreen; uniform vec2 lcdContain; uniform vec2 lcdCover;\n" + shader.fragmentShader;
          shader.fragmentShader = shader.fragmentShader.replace("#include <map_fragment>", `
            #ifdef USE_MAP
            vec2 lcdUv = (vMapUv - 0.5) * mix(lcdContain, lcdCover, smoothstep(0.6, 1.0, lcdFullscreen)) + 0.5;
            float lcdInside = step(0.0, lcdUv.x) * step(lcdUv.x, 1.0) * step(0.0, lcdUv.y) * step(lcdUv.y, 1.0);
            #endif
            ${ShaderChunk.map_fragment.replace(/vMapUv/g, "lcdUv")}
            #ifdef USE_MAP
            diffuseColor.rgb *= lcdInside;
            #endif
          `);
        }} polygonOffset polygonOffsetFactor={-1} polygonOffsetUnits={-1} />}
    </mesh>
    {debug && <>
      {lcdConfig.debug.wireframe && <mesh geometry={geometry}><meshBasicMaterial color="cyan" wireframe depthTest={false} /></mesh>}
      {lcdConfig.debug.outline && <mesh position={[0, 0, lcdConfig.normalOffset]}><planeGeometry args={[lcdConfig.width, lcdConfig.height]} /><meshBasicMaterial color="yellow" wireframe depthTest={false} /></mesh>}
      {lcdConfig.debug.axes && <axesHelper args={[lcdConfig.height / 2]} />}
      {lcdConfig.debug.normal && <arrowHelper args={[new Vector3(0, 0, 1), new Vector3(), lcdConfig.height / 2, 0xff00ff]} />}
    </>}
  </group>;
});
