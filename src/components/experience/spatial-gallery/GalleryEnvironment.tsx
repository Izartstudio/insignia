import { useMemo, useRef, type MutableRefObject } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { ShaderMaterial, Vector2 } from 'three';
import { galleryStates } from '@/content/spatial-gallery';

export type GalleryMotion = { travel: number; panX: number; panY: number; active: boolean; invalidate: () => void };

export function GalleryEnvironment({ motion }: { motion: MutableRefObject<GalleryMotion> }) {
  const { size } = useThree();
  const material = useRef<ShaderMaterial>(null);
  const uniforms = useMemo(() => ({ radius: { value: galleryStates[0].radius }, shift: { value: new Vector2() }, gridScale: { value: 1 }, gridColumns: { value: 7 } }), []);
  useFrame(({ camera }) => {
    if (!material.current) return;
    material.current.uniforms.gridColumns.value = size.width / size.height < .85 ? 2 : 7;
    const journey = motion.current.travel;
    const from = Math.min(Math.floor(journey), galleryStates.length - 1);
    const to = Math.min(from + 1, galleryStates.length - 1);
    const fraction = journey - from;
    material.current.uniforms.radius.value = galleryStates[from].radius + (galleryStates[to].radius - galleryStates[from].radius) * fraction;
    material.current.uniforms.shift.value.set(camera.position.x * .016, camera.position.y * .03);
    material.current.uniforms.gridScale.value = 1 + Math.sin(fraction * Math.PI) * .045;
  });
  return <mesh renderOrder={-100} frustumCulled={false}>
    <planeGeometry args={[2, 2]} />
    <shaderMaterial ref={material} uniforms={uniforms} depthWrite={false} depthTest={false} toneMapped={false}
      vertexShader={`varying vec2 vUv; void main(){vUv=uv; gl_Position=vec4(position.xy,0.999,1.0);}`}
      fragmentShader={`uniform float radius; uniform vec2 shift; uniform float gridScale; uniform float gridColumns; varying vec2 vUv;
        void main(){
          float d=length((vUv-0.5+0.05*sin(shift))/radius);
          vec3 inner=vec3(254.,140.,1.)/255.; vec3 middle=vec3(170.,0.,9.)/255.;
          vec3 color=d<0.368333?mix(inner,middle,d/0.368333):mix(middle,vec3(0.),clamp((d-0.368333)/0.631667,0.,1.));
          vec2 q=(vUv-0.5)/gridScale;
          q*=1.0+0.12*dot(q,q);
          vec2 cell=q*vec2(gridColumns,6.)+shift*3.;
          vec2 edge=abs(fract(cell+0.5)-0.5);
          vec2 aa=fwidth(cell);
          float line=1.-min(smoothstep(aa.x*.25,aa.x*.85,edge.x),smoothstep(aa.y*.25,aa.y*.85,edge.y));
          float dotGrid=1.-smoothstep(.014,.025,length(edge));
          vec4 lines=vec4(max(line*.14,dotGrid*.24));
          color=mix(color,vec3(240.,170.,30.)/255.,lines.r);
          // The source gradient interpolates in sRGB; Three expects linear output
          // before its renderer-specific display conversion.
          color=mix(color/12.92,pow((color+0.055)/1.055,vec3(2.4)),step(vec3(0.04045),color));
          gl_FragColor=vec4(color,1.);
          #include <colorspace_fragment>
        }`} />
  </mesh>;
}
