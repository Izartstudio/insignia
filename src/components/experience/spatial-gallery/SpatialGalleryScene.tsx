import { useEffect, useRef, useState, type MutableRefObject } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { MathUtils, SRGBColorSpace, Texture, TextureLoader } from 'three';
import { galleryConfig, galleryStates } from '@/content/spatial-gallery';
import { GalleryEnvironment, type GalleryMotion } from './GalleryEnvironment';
import { InfiniteCanvasPlane } from './InfiniteCanvasPlane';
import { WorldCategory } from './WorldCategory';

const sources = [...new Set(galleryStates.flatMap(state => state.photos.map(photo => photo.src)))];
const initialSources = [...new Set(galleryStates[0].photos.map(photo => photo.src))];

export default function SpatialGalleryScene({ motion, onFailure }: { motion: MutableRefObject<GalleryMotion>; onFailure: () => void }) {
  const { camera, invalidate } = useThree();
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
    const loadDeferred = () => {
      const remaining = sources.filter(src => !initialSources.includes(src));
      load(remaining).then(entries => {
        if (!disposed) { setTextures(current => ({ ...current, ...Object.fromEntries(entries) })); invalidate(); }
      }).catch((error: unknown) => { if (!disposed) console.error("Deferred gallery texture loading failed", error); });
    };
    load(initialSources).then(entries => {
      if (disposed) return;
      setTextures(Object.fromEntries(entries));
      invalidate();
      loadDeferred();
    }).catch((error: unknown) => { if (!disposed) { console.error("Spatial gallery texture loading failed", error); onFailure(); } });
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

  useFrame((_, delta) => {
    const state = motion.current;
    const targetX = state.panX;
    const targetY = state.panY;
    offset.current.x = MathUtils.damp(offset.current.x, targetX, galleryConfig.exploration.damping, Math.min(delta, .05));
    offset.current.y = MathUtils.damp(offset.current.y, targetY, galleryConfig.exploration.damping, Math.min(delta, .05));
    camera.position.set(offset.current.x, offset.current.y, galleryConfig.distance - state.travel * galleryConfig.depthStep);
    camera.rotation.set(0, 0, 0);
    if (state.active && (Math.abs(offset.current.x - targetX) > .0001 || Math.abs(offset.current.y - targetY) > .0001)) invalidate();
  });

  if (!textures) return null;
  return <>
    <GalleryEnvironment motion={motion} />
    {galleryStates.filter(world => world.photos.every(photo => textures[photo.src])).map(world => <group key={world.id}>
      <WorldCategory world={world} />
      <InfiniteCanvasPlane world={world} textures={textures} />
    </group>)}
  </>;
}
