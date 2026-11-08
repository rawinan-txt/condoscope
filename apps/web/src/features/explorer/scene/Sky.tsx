import { BackSide, Color, ShaderMaterial, Vector3 } from 'three';

/** Dusk gradient with a warm glow around the sun direction. */
export const skyMaterial = new ShaderMaterial({
  side: BackSide,
  depthWrite: false,
  fog: false,
  uniforms: {
    top: { value: new Color('#16223d') },
    mid: { value: new Color('#3e5079') },
    horizon: { value: new Color('#d98e62') },
    glow: { value: new Color('#ffb070') },
    sunDir: { value: new Vector3(-0.6, 0.08, -0.8).normalize() },
  },
  vertexShader: 'varying vec3 vDir; void main(){ vDir = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
  fragmentShader: `uniform vec3 top; uniform vec3 mid; uniform vec3 horizon; uniform vec3 glow; uniform vec3 sunDir; varying vec3 vDir;
    void main(){
      float h = vDir.y;
      vec3 c = mix(horizon, mid, smoothstep(0.0, 0.18, h));
      c = mix(c, top, smoothstep(0.18, 0.65, h));
      c = mix(c, horizon * 0.5, smoothstep(0.0, -0.1, h));
      c += glow * pow(max(dot(normalize(vDir), sunDir), 0.0), 6.0) * smoothstep(-0.05, 0.3, 0.3 - h);
      gl_FragColor = vec4(c, 1.0);
      #include <colorspace_fragment>
    }`,
});

export default function Sky({ radius = 2400 }: { radius?: number }) {
  return (
    <mesh material={skyMaterial}>
      <sphereGeometry args={[radius, 32, 16]} />
    </mesh>
  );
}
