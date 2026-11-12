import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { SKY_GLSL } from './sky'

/** A dome around the camera. It moves with the camera, so it never ends. */
export default function Sky() {
  const mesh = useRef<THREE.Mesh>(null)
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        side: THREE.BackSide,
        depthWrite: false,
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
          void main() {
            gl_FragColor = vec4(skyColor(normalize(vDirection)), 1.0);
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
