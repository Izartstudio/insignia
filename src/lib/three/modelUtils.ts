import { Box3, Vector3, type Object3D } from "three";
export function measureModel(scene: Object3D) {
  scene.updateWorldMatrix(true, true);
  const box = new Box3().setFromObject(scene, true);
  if (box.isEmpty()) throw new Error("The model has no renderable geometry.");
  const center = box.getCenter(new Vector3());
  const radius = box.getSize(new Vector3()).length() / 2;
  if (!Number.isFinite(radius) || radius <= 0) throw new Error("Invalid model bounds.");
  return { halfHeight: box.getSize(new Vector3()).y / 2, offset: center.negate().toArray() as [number, number, number], radius };
}
