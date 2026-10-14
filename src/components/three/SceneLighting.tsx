import { sceneConfig } from "@/config/scene";
export function SceneLighting() {
  const { hemisphere, key, fill } = sceneConfig.lighting;
  return <><hemisphereLight args={[hemisphere.sky, hemisphere.ground, hemisphere.intensity]} /><directionalLight position={key.position} intensity={key.intensity} /><directionalLight position={fill.position} intensity={fill.intensity} /></>;
}
