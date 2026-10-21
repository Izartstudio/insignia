import { useEffect, useRef, useState, type MutableRefObject } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { MathUtils, SRGBColorSpace, Texture, TextureLoader, Raycaster, Vector2, Mesh, MeshBasicMaterial } from 'three';
import { galleryConfig, type GalleryState } from '@/content/spatial-gallery';
import { GalleryEnvironment, type GalleryMotion } from './GalleryEnvironment';
import { InfiniteCanvasPlane } from './InfiniteCanvasPlane';

export default function SpatialGalleryScene({ motion, onFailure, states, mobileControls }: { motion: MutableRefObject<GalleryMotion>; onFailure: () => void; states: GalleryState[]; mobileControls: boolean }) {
  const { camera, invalidate, scene, gl } = useThree();
  const [textures, setTextures] = useState<Record<string, Record<string, Texture>>>({});
  const offset = useRef({ x: 0, y: 0 });

  useEffect(() => {
    let disposed = false;
    const owned: Texture[] = [];
    const loader = new TextureLoader();
    let publishFrame = 0;
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
    let initialFailures = 0;
    // Publish decoded/uploaded photos as they arrive, batching updates to one per frame.
    states.forEach((world, index) => {
      world.photos.forEach(photo => {
        loader.loadAsync(photo.src).then(texture => {
          if (disposed) { texture.dispose(); return; }
          texture.colorSpace = SRGBColorSpace;
          owned.push(texture);
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
      owned.forEach(texture => texture.dispose());
    };
  }, [gl, invalidate, onFailure, states]);

  useEffect(() => {
    motion.current.invalidate = invalidate;
    invalidate();
    return () => { motion.current.invalidate = () => {}; };
  }, [motion, invalidate]);

  useEffect(() => {
    const raycaster = new Raycaster();
    const pointer = new Vector2();
    motion.current.pickPhoto = (x, y) => {
      const rect = gl.domElement.getBoundingClientRect();
      pointer.set((x - rect.left) / rect.width * 2 - 1, -(y - rect.top) / rect.height * 2 + 1);
      camera.updateMatrixWorld();
      scene.updateMatrixWorld(true);
      raycaster.setFromCamera(pointer, camera);
      const photos: Mesh[] = [];
      scene.traverseVisible(object => {
        if (object instanceof Mesh && object.userData.galleryPhoto && object.material instanceof MeshBasicMaterial && object.material.opacity > .05) photos.push(object);
      });
      return raycaster.intersectObjects(photos, false)[0]?.object.userData.galleryPhoto;
    };
    return () => { motion.current.pickPhoto = undefined; };
  }, [camera, gl, motion, scene]);

  useFrame((_, delta) => {
    const state = motion.current;
    if (state.paused) return;
    const targetX = state.panX;
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
