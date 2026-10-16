import { useEffect } from "react";
import { useThree } from "@react-three/fiber";

/** Bound drawing-buffer cost on touch hardware without changing scene coordinates. */
export function CanvasRuntime() {
  const { gl, size, setDpr, invalidate } = useThree();
  useEffect(() => {
    const query = window.matchMedia("(pointer: coarse)");
    const update = () => {
      const cap = query.matches ? 1.25 : 1.5;
      setDpr(Math.min(window.devicePixelRatio || 1, cap));
    };
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, [setDpr, size.width]);
  useEffect(() => {
    const canvas = gl.domElement;
    const lost = (event: Event) => {
      event.preventDefault();
      console.warn("Insignia WebGL context lost", {
        width: canvas.width, height: canvas.height,
        maxTextureSize: gl.capabilities.maxTextureSize,
      });
    };
    const restored = () => invalidate();
    canvas.addEventListener("webglcontextlost", lost);
    canvas.addEventListener("webglcontextrestored", restored);
    return () => {
      canvas.removeEventListener("webglcontextlost", lost);
      canvas.removeEventListener("webglcontextrestored", restored);
    };
  }, [gl, invalidate]);
  return null;
}
