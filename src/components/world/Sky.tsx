import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { DIM_GLSL, SKY_GLSL, WORLD_UNIFORMS } from './sky'

/** How fast the dust clouds drift, in noise units per second. */
const DRIFT = 0.006

/**
 * A dome around the camera. It moves with the camera, so it never ends. On
 * the dome only: far ridges at the horizon, and slow dust clouds.
 */
export default function Sky({ reducedMotion }: { reducedMotion: boolean }) {
  const mesh = useRef<THREE.Mesh>(null)
  const time = useRef({ value: 0 })
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        side: THREE.BackSide,
        depthWrite: false,
        uniforms: { uDim: WORLD_UNIFORMS.uDim, uTime: time.current },
        vertexShader: /* glsl */ `
          varying vec3 vDirection;
          void main() {
            vDirection = position;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: /* glsl */ `
          varying vec3 vDirection;
          uniform float uTime;
          ${SKY_GLSL}
          ${DIM_GLSL}

          float hash2(vec2 p) {
            p = fract(p * vec2(123.34, 456.21));
            p += dot(p, p + 45.32);
            return fract(p.x * p.y);
          }
          float noise2(vec2 p) {
            vec2 i = floor(p);
            vec2 f = fract(p);
            vec2 u = f * f * (3.0 - 2.0 * f);
            return mix(
              mix(hash2(i), hash2(i + vec2(1.0, 0.0)), u.x),
              mix(hash2(i + vec2(0.0, 1.0)), hash2(i + vec2(1.0, 1.0)), u.x),
              u.y
            );
          }
          float fbm2(vec2 p, int octaves) {
            float sum = 0.0;
            float amp = 0.5;
            float total = 0.0;
            for (int i = 0; i < 5; i++) {
              if (i >= octaves) break;
              sum += noise2(p) * amp;
              total += amp;
              p = p * 2.03 + vec2(17.1, -9.7);
              amp *= 0.5;
            }
            return sum / total;
          }

          // The height of a line of far ridges toward a direction across
          // the ground. The noise goes round a circle, so it has no seam.
          float ridge(vec2 flat2, float seed, float scale) {
            return fbm2(flat2 * scale + seed, 4);
          }

          void main() {
            vec3 d = normalize(vDirection);
            vec3 color = skyColor(d);
            vec2 flat2 = normalize(d.xz + 1e-5);
            float pixel = fwidth(d.y) * 1.5;

            // Dust clouds: long thin bands, high in the haze, that drift.
            // They are a little darker than the sky, with a warm edge
            // toward where the sun set.
            if (d.y > 0.02 && d.y < 0.85) {
              vec2 p = d.xz / (d.y + 0.12);
              p = vec2(p.x * 0.35, p.y * 1.1) + vec2(uTime, uTime * 0.3);
              float n = fbm2(p * 0.9, 4);
              float cover = smoothstep(0.52, 0.78, n);
              cover *= smoothstep(0.02, 0.12, d.y) * (1.0 - smoothstep(0.35, 0.85, d.y));
              float toSun = max(dot(d, SUN_AT), 0.0);
              vec3 cloud = color * 0.86 + SUN_LIGHT * pow(toSun, 5.0) * 0.12;
              color = mix(color, cloud, cover * 0.55);
            }

            // Far ridges: two lines of hills beyond the ground, the far
            // one paler in the haze. Only near the horizon, where they are.
            if (d.y < 0.06) {
              vec3 haze = skyColor(normalize(vec3(d.x, 0.0, d.z)));
              float far = 0.012 + ridge(flat2, 3.0, 1.6) * 0.045;
              color = mix(color, haze * 0.92, 1.0 - smoothstep(far - pixel, far + pixel, d.y));
              float near = 0.004 + ridge(flat2, 11.0, 2.4) * 0.03;
              color = mix(color, haze * 0.85, 1.0 - smoothstep(near - pixel, near + pixel, d.y));
            }

            color = dimmed(color, d);
            // A grain of less than one step of color, so the smooth
            // gradient shows no bands.
            float grain = fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233))) * 43758.5453);
            color += (grain - 0.5) / 255.0;
            gl_FragColor = vec4(color, 1.0);
          }
        `,
      }),
    [],
  )
  useFrame(({ camera }, delta) => {
    mesh.current?.position.copy(camera.position)
    // With reduced motion, the clouds stand still.
    if (!reducedMotion) time.current.value += Math.min(delta, 0.1) * DRIFT
  })
  return (
    <mesh ref={mesh} material={material} renderOrder={-1} frustumCulled={false}>
      <sphereGeometry args={[500, 64, 32]} />
    </mesh>
  )
}
