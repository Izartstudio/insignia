import { useEffect, useRef, useState, type MutableRefObject } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { MathUtils, SRGBColorSpace, Texture, TextureLoader, Raycaster, Vector2, Mesh, MeshBasicMaterial } from 'three';
import { galleryConfig, galleryStates } from '@/content/spatial-gallery';
import { GalleryEnvironment, type GalleryMotion } from './GalleryEnvironment';
import { InfiniteCanvasPlane } from './InfiniteCanvasPlane';

// Keep each world's texture map stable when another world finishes loading.
function LoadedWorld({ world, textures }: { world: typeof galleryStates[number]; textures: Record<string, Texture> }) {
  const [worldTextures] = useState(() => Object.fromEntries(world.photos.map(photo => [photo.src, textures[photo.src]])));
  return <group><InfiniteCanvasPlane world={world} textures={worldTextures} /></group>;
}

export default function SpatialGalleryScene({ motion, onFailure }: { motion: MutableRefObject<GalleryMotion>; onFailure: () => void }) {
  const { camera, invalidate, scene, gl } = useThree();
  const [textures, setTextures] = useState<Record<string, Texture> | null>(null);
  const offset = useRef({ x: 0, y: 0 });

  useEffect(() => {
    let disposed = false;
    const owned: Texture[] = [];
    const loader = new TextureLoader();
    const load = async (items: string[]) => Promise.all(items.map(async src => {
      const texture = await loader.loadAsync(src);
      if (disposed) { texture.dispose(); return [src, texture] as const; }
      texture.colorSpace = SRGBColorSpace;
      owned.push(texture);
      return [src, texture] as const;
    }));
    // Publish categories independently: one slow download must not block all later worlds.
    galleryStates.forEach((world, index) => {
      load([...new Set(world.photos.map(photo => photo.src))]).then(entries => {
        if (!disposed) {
          setTextures(current => ({ ...current, ...Object.fromEntries(entries) }));
          invalidate();
        }
      }).catch((error: unknown) => {
        if (disposed) return;
        console.error(`Gallery textures failed for ${world.id}`, error);
        if (index === 0) onFailure();
      });
    });
    return () => {
      disposed = true;
      owned.forEach(texture => texture.dispose());
    };
  }, [invalidate, onFailure]);

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
    offset.current.x = state.dragging ? targetX : MathUtils.damp(offset.current.x, targetX, galleryConfig.exploration.damping, Math.min(delta, .05));
    offset.current.y = state.dragging ? targetY : MathUtils.damp(offset.current.y, targetY, galleryConfig.exploration.damping, Math.min(delta, .05));
    camera.position.set(offset.current.x, offset.current.y, galleryConfig.distance - state.travel * galleryConfig.depthStep);
    camera.rotation.set(0, 0, 0);
    if (state.active && (Math.abs(offset.current.x - targetX) > .0001 || Math.abs(offset.current.y - targetY) > .0001)) invalidate();
  }, -1); // Update the camera before the environment and tile visibility callbacks.

  if (!textures) return null;
  return <>
    <GalleryEnvironment motion={motion} />
    {galleryStates.filter(world => world.photos.every(photo => textures[photo.src])).map(world => <LoadedWorld key={world.id} world={world} textures={textures} />)}
  </>;
}
