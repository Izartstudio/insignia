import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Mesh, MeshBasicMaterial, PlaneGeometry, MathUtils, type Texture } from 'three';
import { galleryConfig, type GalleryState } from '@/content/spatial-gallery';
import { fitPhotoLayouts, mapPhoto } from './layout';
import { hasDesktopComposition, mapDesktopReferencePhoto } from './desktop-composition';

/** One static mesh per unique source; the complete composition fits the viewport. */
export function InfiniteCanvasPlane({ world, textures }: { world: GalleryState; textures: Record<string, Texture> }) {
  const { size } = useThree();
  const meshes = useRef<(Mesh | null)[]>([]);
  const resources = useMemo(() => {
    const aspect = Math.min(size.width / size.height, 1.6);
    const geometry = new PlaneGeometry(1, 1);
    const photos = world.photos.map((photo, index) => {
      const texture = textures[photo.src];
      const image = texture?.image as HTMLImageElement | undefined;
      const imageAspect = image ? image.width / image.height : photo.layout[2] / photo.layout[3];
      const reference = size.width > 1024 ? mapDesktopReferencePhoto(world.id, photo, index, world.photos.length, size.width, size.height, imageAspect) : null;
      const layout = reference ?? mapPhoto(photo, index, size.height * aspect, size.height, imageAspect, size.width <= 1024);
      // Enlarge leaders and their spacing only at the desktop breakpoint.
      // Use actual viewport width; the composition aspect above is capped.
      if (!reference && world.id === 'leaders' && size.width > 1024) {
        layout.scale[0] *= 1.25;
        layout.scale[1] *= 1.25;
        layout.position[0] *= 1.25;
        layout.position[1] *= 1.25;
      }
      if (size.width <= 1024) {
        layout.scale[0] *= 1.2;
        layout.scale[1] *= 1.2;
      }
      texture?.repeat.set(...layout.repeat);
      texture?.offset.set((1-layout.repeat[0])/2, (1-layout.repeat[1])/2);
      return { ready: !!texture, unique: world.photos.findIndex(item => item.src === photo.src) === index, layout, material: new MeshBasicMaterial({ map: texture ?? null, transparent: true, alphaTest: .02, toneMapped: false }) };
    });
    if (size.width <= 1024 || !hasDesktopComposition(world.id, world.photos.length)) {
      fitPhotoLayouts(photos.filter(photo => photo.unique).map(photo => photo.layout), size.width, size.height);
    }
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
      material.opacity = opacity;
      mesh.visible = visible && ready && unique && opacity > 0;
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
