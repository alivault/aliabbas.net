import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { DIM_GLSL, SKY_GLSL, WORLD_UNIFORMS } from './sky'

/** A dome around the camera. It moves with the camera, so it never ends. */
export default function Sky() {
  const mesh = useRef<THREE.Mesh>(null)
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        side: THREE.BackSide,
        depthWrite: false,
        uniforms: { uDim: WORLD_UNIFORMS.uDim },
        vertexShader: /* glsl */ `
          varying vec3 vDirection;
          void main() {
            vDirection = position;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: /* glsl */ `
          varying vec3 vDirection;
          ${SKY_GLSL}
          ${DIM_GLSL}
          void main() {
            vec3 d = normalize(vDirection);
            vec3 color = dimmed(skyColor(d), d);
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
  useFrame(({ camera }) => {
    mesh.current?.position.copy(camera.position)
  })
  return (
    <mesh ref={mesh} material={material} renderOrder={-1} frustumCulled={false}>
      <sphereGeometry args={[500, 32, 16]} />
    </mesh>
  )
}
