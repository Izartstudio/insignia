import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Mesh, MeshBasicMaterial, PlaneGeometry, MathUtils, type Texture } from 'three';
import { galleryConfig, type GalleryState } from '@/content/spatial-gallery';
import { fitPhotoLayouts, mapPhoto } from './layout';
import { canPanGallery } from './interaction';
import { hasDesktopComposition, mapDesktopReferencePhoto } from './desktop-composition';

function tileHash(x: number, y: number, salt: number) {
  let value = Math.imul(x + 104729, 73856093) ^ Math.imul(y + 130363, 19349663) ^ Math.imul(salt + 37, 83492791);
  value = Math.imul(value ^ (value >>> 16), 2246822519);
  return ((value ^ (value >>> 13)) >>> 0) / 4294967296;
}

/** Unbounded tiles, with at most one visible copy of each source per category. */
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
      texture?.repeat.set(...layout.repeat);
      texture?.offset.set((1-layout.repeat[0])/2, (1-layout.repeat[1])/2);
      return { ready: !!texture, unique: world.photos.findIndex(item => item.src === photo.src) === index, layout, material: new MeshBasicMaterial({ map: texture ?? null, transparent: true, alphaTest: .02, toneMapped: false }) };
    });
    if (size.width <= 1024 || !hasDesktopComposition(world.id, world.photos.length)) {
      fitPhotoLayouts(photos.filter(photo => photo.unique).map(photo => photo.layout), size.width, size.height);
    }
    const uniquePhotos = photos.filter(photo => photo.unique);
    const cellW = Math.max(...uniquePhotos.map(photo => photo.layout.scale[0])) * 1.55;
    const cellH = Math.max(...uniquePhotos.map(photo => photo.layout.scale[1])) * 1.55;
    return { geometry, photos, uniquePhotos, cellW, cellH };
  }, [world, textures, size.width, size.height]);
  useEffect(() => () => { resources.geometry.dispose(); resources.photos.forEach(p => p.material.dispose()); }, [resources]);
  useFrame(({ camera }) => {
    const distance = camera.position.z - world.depth;
    const visible = distance > .05 && distance < galleryConfig.distance + galleryConfig.depthStep;
    const opacity = 1 - MathUtils.smoothstep(distance, galleryConfig.distance, galleryConfig.distance + galleryConfig.depthStep);
    const halfH = distance * Math.tan(galleryConfig.fov * Math.PI / 360);
    const halfW = halfH * size.width / size.height;
    const { cellW, cellH, uniquePhotos } = resources;
    const intersects = (x: number, y: number, w: number, h: number) =>
      Math.abs(x - camera.position.x) < halfW + w / 2 && Math.abs(y - camera.position.y) < halfH + h / 2;
    resources.photos.forEach((photo, index) => {
      const { material, ready, unique, layout } = photo;
      const mesh = meshes.current[index];
      if (!mesh) return;
      material.opacity = opacity;
      mesh.visible = false;
      if (!visible || !ready || !unique || opacity <= 0) return;
      const [w, h] = layout.scale;
      let x = layout.position[0], y = layout.position[1];
      let found = intersects(x, y, w, h);
      // Original photos win while on screen; only look for a tile after they leave.
      if (!found && canPanGallery(world, size.width <= 1024)) {
        const sourceIndex = uniquePhotos.indexOf(photo);
        let best = Infinity;
        const firstX = Math.floor((camera.position.x - halfW - w / 2) / cellW) - 1;
        const lastX = Math.ceil((camera.position.x + halfW + w / 2) / cellW) + 1;
        const firstY = Math.floor((camera.position.y - halfH - h / 2) / cellH) - 1;
        const lastY = Math.ceil((camera.position.y + halfH + h / 2) / cellH) + 1;
        for (let cy = firstY; cy <= lastY; cy++) for (let cx = firstX; cx <= lastX; cx++) {
          const selected = ((cx * 5 + cy * 3 + Math.round(world.depth / 16)) % uniquePhotos.length + uniquePhotos.length) % uniquePhotos.length;
          if (selected !== sourceIndex) continue;
          const tx = cx * cellW + (tileHash(cx, cy, 501) - .5) * cellW * .20;
          const ty = cy * cellH + (tileHash(cx, cy, 502) - .5) * cellH * .20;
          if (!intersects(tx, ty, w, h)) continue;
          if (uniquePhotos.some(({ layout: original }) =>
            Math.abs(tx - original.position[0]) < (w + original.scale[0]) / 2 + .2 &&
            Math.abs(ty - original.position[1]) < (h + original.scale[1]) / 2 + .2)) continue;
          const score = (tx - camera.position.x) ** 2 + (ty - camera.position.y) ** 2;
          if (score < best) { best = score; x = tx; y = ty; found = true; }
        }
      }
      // Exactly one mesh owns this source, so two copies cannot share the viewport.
      mesh.visible = found;
      if (found) mesh.position.set(x, y, world.depth);
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
