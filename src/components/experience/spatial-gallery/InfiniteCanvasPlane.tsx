import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Mesh, MeshBasicMaterial, PlaneGeometry, MathUtils, type Texture } from 'three';
import { galleryConfig, type GalleryState } from '@/content/spatial-gallery';
import { fitPhotoLayouts, mapPhoto } from './layout';

/** A finite photo canvas: every source appears once, with no wrapping tiles. */
export function InfiniteCanvasPlane({ world, textures }: { world: GalleryState; textures: Record<string, Texture> }) {
  const { size } = useThree();
  const meshes = useRef<(Mesh | null)[]>([]);
  const resources = useMemo(() => {
    const aspect = Math.min(size.width / size.height, 1.6);
    const geometry = new PlaneGeometry(1, 1);
    const photos = world.photos.map((photo, index) => {
      const texture = textures[photo.src];
      const image = texture?.image as HTMLImageElement | undefined;
      const layout = mapPhoto(photo, index, size.height * aspect, size.height, image ? image.width / image.height : photo.layout[2] / photo.layout[3], size.width <= 1024);
      // Enlarge leaders and their spacing only at the desktop breakpoint.
      // Use actual viewport width; the composition aspect above is capped.
      if (world.id === 'leaders' && size.width > 1024) {
        layout.scale[0] *= 1.25;
        layout.scale[1] *= 1.25;
        layout.position[0] *= 1.25;
        layout.position[1] *= 1.25;
      }
      texture?.repeat.set(...layout.repeat);
      texture?.offset.set((1-layout.repeat[0])/2, (1-layout.repeat[1])/2);
      return { ready: !!texture, unique: world.photos.findIndex(item => item.src === photo.src) === index, layout, material: new MeshBasicMaterial({ map: texture ?? null, transparent: true, alphaTest: .02, toneMapped: false }) };
    });
    fitPhotoLayouts(photos.filter(photo => photo.unique).map(photo => photo.layout), size.width, size.height);
    return { geometry, photos };
  }, [world, textures, size.width, size.height]);
  useEffect(() => () => { resources.geometry.dispose(); resources.photos.forEach(p => p.material.dispose()); }, [resources]);
  useFrame(({ camera }) => {
    const distance = camera.position.z - world.depth;
    const visible = distance > .05 && distance < galleryConfig.distance + galleryConfig.depthStep;
    const opacity = 1 - MathUtils.smoothstep(distance, galleryConfig.distance, galleryConfig.distance + galleryConfig.depthStep);
    resources.photos.forEach(({ material, ready, unique }, index) => {
      const mesh = meshes.current[index];
      if (!mesh) return;
      mesh.visible = visible && ready && unique && opacity > 0;
      material.opacity = opacity;
    });
  });
  return <>{resources.photos.map(({ material, layout, unique }, index) => unique && <mesh
    key={index} ref={mesh => { meshes.current[index] = mesh; }}
    userData={{ galleryPhoto: { worldId: world.id, photoIndex: index } }}
    geometry={resources.geometry} material={material}
    position={[layout.position[0], layout.position[1], world.depth + layout.position[2]]}
    scale={layout.scale} dispose={null}
  />)}</>;
}
