import { useEffect, useRef, useState, type MutableRefObject } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { LinearFilter, MathUtils, SRGBColorSpace, Texture, TextureLoader, Raycaster, Vector2, Mesh, MeshBasicMaterial } from 'three';
import { galleryConfig, type GalleryState } from '@/content/spatial-gallery';
import { GalleryEnvironment, type GalleryMotion } from './GalleryEnvironment';
import { InfiniteCanvasPlane } from './InfiniteCanvasPlane';

export default function SpatialGalleryScene({ motion, onFailure, states, mobileControls }: { motion: MutableRefObject<GalleryMotion>; onFailure: () => void; states: GalleryState[]; mobileControls: boolean }) {
  const { camera, invalidate, scene, gl, size } = useThree();
  const [textures, setTextures] = useState<Record<string, Record<string, Texture>>>({});
  const offset = useRef({ x: 0, y: 0 });
  const cursor = useRef(0);

  useEffect(() => {
    const canvas = gl.domElement;
    const query = window.matchMedia('(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)');
    const reset = () => { cursor.current = 0; invalidate(); };
    const move = (event: PointerEvent) => {
      if (mobileControls || !query.matches || event.pointerType !== 'mouse' || motion.current.paused) return;
      const rect = canvas.getBoundingClientRect();
      cursor.current = MathUtils.clamp((event.clientX - rect.left) / Math.max(1, rect.width) * 2 - 1, -1, 1);
      invalidate();
    };
    canvas.addEventListener('pointermove', move, { passive: true });
    canvas.addEventListener('pointerleave', reset);
    query.addEventListener('change', reset);
    window.addEventListener('blur', reset);
    reset();
    return () => {
      canvas.removeEventListener('pointermove', move);
      canvas.removeEventListener('pointerleave', reset);
      query.removeEventListener('change', reset);
      window.removeEventListener('blur', reset);
      cursor.current = 0;
    };
  }, [gl, invalidate, mobileControls, motion]);

  useEffect(() => {
    let disposed = false;
    const owned: Texture[] = [];
    const loader = new TextureLoader();
    let publishFrame = 0;
    let uploadFrame = 0;
    const uploads: { texture: Texture; worldId: string; src: string }[] = [];
    const pending: Record<string, Record<string, Texture>> = {};
    const publish = () => {
      publishFrame = 0;
      if (disposed) return;
      const batch = { ...pending };
      Object.keys(pending).forEach(key => { delete pending[key]; });
      setTextures(current => {
        const next = { ...current };
        Object.entries(batch).forEach(([id, images]) => { next[id] = { ...current[id], ...images }; });
        return next;
      });
      invalidate();
    };
    const uploadNext = () => {
      uploadFrame = 0;
      if (disposed) return;
      const next = uploads.shift();
      if (!next) return;
      gl.initTexture(next.texture);
      (pending[next.worldId] ??= {})[next.src] = next.texture;
      if (!publishFrame) publishFrame = requestAnimationFrame(publish);
      if (uploads.length) uploadFrame = requestAnimationFrame(uploadNext);
    };
    let initialFailures = 0;
    // Publish decoded/uploaded photos as they arrive, batching updates to one per frame.
    states.forEach((world, index) => {
      world.photos.forEach(photo => {
        // Bound decoded CMS image size before downloading, especially on iOS.
        const url = new URL(photo.src, window.location.origin);
        if (url.hostname === 'cdn.sanity.io') {
          url.searchParams.set('w', mobileControls ? '512' : '1024');
          url.searchParams.set('h', mobileControls ? '512' : '1024');
          url.searchParams.set('fit', 'max');
          url.searchParams.set('auto', 'format');
        }
        loader.loadAsync(url.href).then(texture => {
          if (disposed) { texture.dispose(); return; }
          texture.colorSpace = SRGBColorSpace;
          if (mobileControls) {
            texture.generateMipmaps = false;
            texture.minFilter = LinearFilter;
          }
          owned.push(texture);
          if (mobileControls) {
            // Spread GPU uploads across frames instead of freezing touch input
            // when several downloaded images finish decoding together.
            uploads.push({ texture, worldId: world.id, src: photo.src });
            if (!uploadFrame) uploadFrame = requestAnimationFrame(uploadNext);
            return;
          }
          gl.initTexture(texture);
          (pending[world.id] ??= {})[photo.src] = texture;
          if (!publishFrame) publishFrame = requestAnimationFrame(publish);
        }).catch((error: unknown) => {
          if (disposed) return;
          console.error(`Gallery image failed: ${photo.src}`, error);
          if (index === 0 && ++initialFailures === world.photos.length) onFailure();
        });
      });
    });
    return () => {
      disposed = true;
      cancelAnimationFrame(publishFrame);
      cancelAnimationFrame(uploadFrame);
      uploads.length = 0;
      owned.forEach(texture => texture.dispose());
    };
  }, [gl, invalidate, onFailure, states, mobileControls]);

  useEffect(() => {
    motion.current.invalidate = invalidate;
    invalidate();
    return () => { motion.current.invalidate = () => {}; };
  }, [motion, invalidate]);

  useEffect(() => {
    const raycaster = new Raycaster();
    const pointer = new Vector2();
    // The photo objects only change when textures/layouts change. Avoid walking
    // the entire scene for every desktop pointer event while scrolling.
    const photos: Mesh[] = [];
    scene.traverse(object => {
      if (object instanceof Mesh && object.userData.galleryPhoto) photos.push(object);
    });
    motion.current.pickPhoto = (x, y) => {
      const rect = gl.domElement.getBoundingClientRect();
      pointer.set((x - rect.left) / rect.width * 2 - 1, -(y - rect.top) / rect.height * 2 + 1);
      camera.updateMatrixWorld();
      scene.updateMatrixWorld();
      raycaster.setFromCamera(pointer, camera);
      const visiblePhotos = photos.filter(object => object.visible && object.material instanceof MeshBasicMaterial && object.material.opacity > .05);
      return raycaster.intersectObjects(visiblePhotos, false)[0]?.object.userData.galleryPhoto;
    };
    return () => { motion.current.pickPhoto = undefined; };
  }, [camera, gl, motion, scene, textures, size.width, size.height]);

  useFrame((_, delta) => {
    const state = motion.current;
    if (state.paused) return;
    // Moving the camera right shifts the scene left. Keep travel under 12 CSS pixels.
    const unitsPerPixel = 2 * galleryConfig.distance * Math.tan(galleryConfig.fov * Math.PI / 360) / Math.max(1, size.height);
    const parallaxX = !mobileControls && state.active ? cursor.current * Math.min(12, size.width * .008) * unitsPerPixel : 0;
    const targetX = state.panX + parallaxX;
    const targetY = state.panY;
    const damping = galleryConfig.exploration.damping * (mobileControls ? .7 : 1);
    offset.current.x = state.dragging && !mobileControls ? targetX : MathUtils.damp(offset.current.x, targetX, damping, Math.min(delta, .05));
    offset.current.y = state.dragging && !mobileControls ? targetY : MathUtils.damp(offset.current.y, targetY, damping, Math.min(delta, .05));
    camera.position.set(offset.current.x, offset.current.y, galleryConfig.distance - state.travel * galleryConfig.depthStep);
    camera.rotation.set(0, 0, 0);
    if (state.active && (Math.abs(offset.current.x - targetX) > .0001 || Math.abs(offset.current.y - targetY) > .0001)) invalidate();
  }, -1); // Update the camera before the environment and tile visibility callbacks.

  return <>
    <GalleryEnvironment motion={motion} states={states} />
    {states.filter(world => textures[world.id]).map(world => <InfiniteCanvasPlane key={world.id} world={world} textures={textures[world.id]} />)}
  </>;
}
