import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { CanvasTexture, MathUtils, Mesh, SRGBColorSpace } from 'three';
import { galleryConfig, type GalleryState } from '@/content/spatial-gallery';

/** The category belongs to the world, behind its photograph planes. */
export function WorldCategory({ world }: { world: GalleryState }) {
  const { size } = useThree();
  const mesh = useRef<Mesh>(null);
  const depth = 1.5;
  const distance = galleryConfig.distance + depth;
  const height = 2 * distance * Math.tan(galleryConfig.fov * Math.PI / 360);
  const width = height * size.width / size.height;
  const texture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(size.width * 2));
    canvas.height = Math.max(1, Math.round(size.height * 2));
    const context = canvas.getContext('2d');
    if (context) {
      const mobile = size.width < 768;
      const fontSize = mobile
        ? Math.min(28, Math.max(18, size.width * .052))
        : Math.min(34, Math.max(22, size.width * .0222));
      context.font = `${fontSize * 2}px Arial, Helvetica, sans-serif`;
      context.textAlign = 'center';
      context.textBaseline = 'middle';
      const gradient = context.createLinearGradient(0, 0, canvas.width, 0);
      gradient.addColorStop(0, '#ff0033');
      gradient.addColorStop(.25, '#ff5020');
      gradient.addColorStop(.5, '#ffff00');
      gradient.addColorStop(.75, '#ff5020');
      gradient.addColorStop(1, '#ff0033');
      context.fillStyle = gradient;
      const inset = canvas.width * (mobile ? .05 : .027);
      [...world.category].forEach((letter, index, letters) => {
        context.fillText(letter, inset + (canvas.width - 2 * inset) * index / (letters.length - 1), canvas.height / 2);
      });
    }
    const result = new CanvasTexture(canvas);
    result.colorSpace = SRGBColorSpace;
    return result;
  }, [size.width, size.height, world.category]);
  useEffect(() => () => texture.dispose(), [texture]);

  useFrame(({ camera }) => {
    if (!mesh.current) return;
    const separation = camera.position.z - world.depth;
    mesh.current.visible = separation > -1 && separation < galleryConfig.distance + galleryConfig.depthStep;
    const material = mesh.current.material;
    if (!Array.isArray(material)) {
      material.opacity = 1 - MathUtils.smoothstep(separation, galleryConfig.distance, galleryConfig.distance + galleryConfig.depthStep);
    }
  });

  return <mesh ref={mesh} position={[0, 0, world.depth - depth]} scale={[width, height, 1]} renderOrder={-1}>
    <planeGeometry args={[1, 1]} />
    <meshBasicMaterial map={texture} transparent depthWrite={false} toneMapped={false} />
  </mesh>;
}
