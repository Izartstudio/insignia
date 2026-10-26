import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { DynamicDrawUsage, InstancedMesh, Matrix4, MeshBasicMaterial, PlaneGeometry, MathUtils, type Texture } from 'three';
import { galleryConfig, type GalleryState } from '@/content/spatial-gallery';
import { mapPhoto } from './layout';

// Stable placement for the explored canvas; the reference composition stays exact.
function tileHash(x: number, y: number, salt: number) {
  let value = Math.imul(x + 104729, 73856093) ^ Math.imul(y + 130363, 19349663) ^ Math.imul(salt + 37, 83492791);
  value = Math.imul(value ^ (value >>> 16), 2246822519);
  return ((value ^ (value >>> 13)) >>> 0) / 4294967296;
}

/** A bounded instance pool follows the frustum; tile coordinates remain continuous. */
export function InfiniteCanvasPlane({ world, textures }: { world: GalleryState; textures: Record<string, Texture> }) {
  const { size } = useThree();
  const meshes = useRef<(InstancedMesh | null)[]>([]);
  const resources = useMemo(() => {
    const height = 2 * galleryConfig.distance * Math.tan(galleryConfig.fov * Math.PI / 360);
    const aspect = Math.min(size.width / size.height, 1.6);
    const width = height * aspect * world.tile.width / galleryConfig.reference.width;
    const tileHeight = height * world.tile.height / galleryConfig.reference.height;
    // Maximum visible distance is the next world, plus overscan and photo overhang.
    const geometry = new PlaneGeometry(1, 1);
    const photos = world.photos.map((photo, index) => {
      const texture = textures[photo.src];
      const image = texture?.image as HTMLImageElement | undefined;
      const layout = mapPhoto(photo, index, size.height * aspect, size.height, image ? image.width / image.height : photo.layout[2] / photo.layout[3], size.width <= 1024);
      texture?.repeat.set(...layout.repeat);
      texture?.offset.set((1-layout.repeat[0])/2, (1-layout.repeat[1])/2);
      return { ready: !!texture, bounds: null as string | null, layout, material: new MeshBasicMaterial({ map: texture ?? null, transparent: true, alphaTest: .02, toneMapped: false }) };
    });
    const maxWidth = Math.max(...photos.map(({ layout }) => layout.scale[0]));
    const maxHeight = Math.max(...photos.map(({ layout }) => layout.scale[1]));
    const cellW = Math.max(width * .30, maxWidth * 1.55);
    const cellH = Math.max(tileHeight * .30, maxHeight * 1.55);
    const columns = Math.ceil(3.3 * height * size.width / size.height / cellW) + 5;
    const rows = Math.ceil(3.3 * height / cellH) + 5;
    return { width, height: tileHeight, cellW, cellH, columns, rows, geometry, photos, matrix: new Matrix4() };
  }, [world, textures, size.width, size.height]);
  useEffect(() => () => { resources.geometry.dispose(); resources.photos.forEach(p => p.material.dispose()); }, [resources]);
  useFrame(({ camera }) => {
    const { cellW, cellH, columns, rows, matrix } = resources;
    const distance = camera.position.z - world.depth;
    const visible = distance > -1 && distance < galleryConfig.distance + galleryConfig.depthStep;
    const opacity = 1 - MathUtils.smoothstep(distance, galleryConfig.distance, galleryConfig.distance + galleryConfig.depthStep);
    resources.photos.forEach(({ layout, material, ready }, index) => {
      const mesh = meshes.current[index];
      if (!mesh) return;
      mesh.visible = visible;
      if (!ready || !visible || opacity <= 0) { mesh.visible = false; return; }
      material.opacity = opacity;
      const depth = distance - layout.position[2];
      if (depth <= .05) { mesh.count = 0; resources.photos[index].bounds = null; return; }
      const halfH = depth * Math.tan(galleryConfig.fov * Math.PI / 360);
      const halfW = halfH * size.width / size.height;
      // One photograph per cell. Spacing is based on the largest photograph,
      // so even jittered neighbors cannot overlap.
      const firstCellX = Math.floor((camera.position.x - halfW) / cellW) - 1;
      const lastCellX = Math.ceil((camera.position.x + halfW) / cellW) + 1;
      const firstCellY = Math.floor((camera.position.y - halfH) / cellH) - 1;
      const lastCellY = Math.ceil((camera.position.y + halfH) / cellH) + 1;
      // Positions are world-fixed: rebuild/upload only when the visible cell range changes.
      const bounds = `${firstCellX},${lastCellX},${firstCellY},${lastCellY}`;
      if (resources.photos[index].bounds === bounds) return;
      resources.photos[index].bounds = bounds;
      matrix.makeScale(...layout.scale);
      matrix.setPosition(layout.position[0], layout.position[1], world.depth + layout.position[2]);
      mesh.setMatrixAt(0, matrix);
      let count = 1;

      for (let cy = firstCellY; cy <= lastCellY; cy++) for (let cx = firstCellX; cx <= lastCellX; cx++) {
        const centerX = cx * cellW + (tileHash(cx, cy, 501) - .5) * cellW * .20;
        const centerY = cy * cellH + (tileHash(cx, cy, 502) - .5) * cellH * .20;
        const selected = ((cx * 5 + cy * 3 + Math.round(world.depth / 16)) % resources.photos.length + resources.photos.length) % resources.photos.length;
        if (selected !== index) continue;
        // Keep the first frame exact and protect the original photographs
        // from explored-canvas instances at every drag position.
        const openingHalfW = galleryConfig.distance * Math.tan(galleryConfig.fov * Math.PI / 360) * size.width / size.height;
        const openingHalfH = galleryConfig.distance * Math.tan(galleryConfig.fov * Math.PI / 360);
        if (Math.abs(centerX) < openingHalfW + layout.scale[0] / 2 && Math.abs(centerY) < openingHalfH + layout.scale[1] / 2) continue;
        if (resources.photos.some(({ layout: original }) =>
          Math.abs(centerX - original.position[0]) < (layout.scale[0] + original.scale[0]) / 2 + .2 &&
          Math.abs(centerY - original.position[1]) < (layout.scale[1] + original.scale[1]) / 2 + .2
        )) continue;
        if (count >= columns * rows + 1) continue;
        matrix.makeScale(...layout.scale);
        matrix.setPosition(centerX, centerY, world.depth + layout.position[2]);
        mesh.setMatrixAt(count++, matrix);
      }
      mesh.count = count;
      mesh.instanceMatrix.needsUpdate = true;
      mesh.boundingSphere = null; // Raycasting must use the current instance positions.
    });
  });
  return <>{resources.photos.map(({material}, index) => <instancedMesh userData={{ galleryPhoto: { worldId: world.id, photoIndex: index } }} key={index} ref={mesh => { meshes.current[index]=mesh; mesh?.instanceMatrix.setUsage(DynamicDrawUsage); }} args={[resources.geometry, material, resources.columns*resources.rows+1]} frustumCulled={false} dispose={null} />)}</>;
}
