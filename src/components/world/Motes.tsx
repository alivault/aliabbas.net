import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { WORLD_UNIFORMS } from './sky'

/** How many motes, and the box around the camera that they fill. */
const COUNT = 700
const BOX = 36

/**
 * Dust in the air: small warm motes that drift on the wind and catch the
 * light. They fill a box that moves with the camera: each one wraps to
 * the far side when it leaves, so there is dust wherever the visitor
 * goes. With reduced motion they stand still. On a page they fade out.
 */
export default function Motes({ reducedMotion }: { reducedMotion: boolean }) {
  const time = useRef({ value: 0 })
  const points = useMemo(() => {
    const seeds = new Float32Array(COUNT * 4)
    for (let i = 0; i < COUNT; i++) {
      seeds[i * 4] = Math.random() * BOX
      seeds[i * 4 + 1] = Math.random() * BOX * 0.4
      seeds[i * 4 + 2] = Math.random() * BOX
      seeds[i * 4 + 3] = Math.random()
    }
    const geometry = new THREE.BufferGeometry()
    // three.js needs a position; the shader uses the seed.
    geometry.setAttribute(
      'position',
      new THREE.BufferAttribute(new Float32Array(COUNT * 3), 3),
    )
    geometry.setAttribute('seed', new THREE.BufferAttribute(seeds, 4))
    const material = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uTime: time.current,
        uDim: WORLD_UNIFORMS.uDim,
        uScale: { value: 1 },
      },
      vertexShader: /* glsl */ `
        attribute vec4 seed;
        uniform float uTime;
        uniform float uScale;
        varying float vAlpha;
        const float BOX = ${BOX.toFixed(1)};
        void main() {
          // The wind blows from where the sun set, with a slow sway.
          vec3 wind = vec3(1.0, 0.04, 0.35) * (0.5 + seed.w * 0.6);
          vec3 sway = vec3(
            sin(uTime * 0.7 + seed.w * 40.0),
            sin(uTime * 0.5 + seed.w * 23.0),
            cos(uTime * 0.6 + seed.w * 31.0)
          ) * 0.6;
          vec3 box = vec3(BOX, BOX * 0.4, BOX);
          vec3 p = seed.xyz + wind * uTime + sway;
          // Wrap into the box around the camera.
          p = mod(p - cameraPosition + box * 0.5, box) - box * 0.5 + cameraPosition;
          vec4 view = viewMatrix * vec4(p, 1.0);
          float dist = -view.z;
          // Fade near (they would be blots) and far (into the box edge).
          vAlpha = smoothstep(0.6, 2.5, dist) * (1.0 - smoothstep(10.0, BOX * 0.5, length(p - cameraPosition)));
          vAlpha *= 0.35 + seed.w * 0.65;
          gl_PointSize = uScale * (1.0 + seed.w * 1.6) * 22.0 / max(dist, 0.1);
          gl_Position = projectionMatrix * view;
        }
      `,
      fragmentShader: /* glsl */ `
        uniform float uDim;
        varying float vAlpha;
        void main() {
          float r = length(gl_PointCoord - 0.5) * 2.0;
          float soft = 1.0 - smoothstep(0.2, 1.0, r);
          gl_FragColor = vec4(vec3(1.0, 0.72, 0.45) * 0.55, 1.0) * soft * vAlpha * (1.0 - uDim);
        }
      `,
    })
    const mesh = new THREE.Points(geometry, material)
    mesh.frustumCulled = false
    mesh.raycast = () => {}
    return mesh
  }, [])

  useFrame(({ gl }, delta) => {
    const material = points.material as THREE.ShaderMaterial
    // Point sizes are in pixels of the drawing buffer.
    material.uniforms.uScale.value = gl.getPixelRatio()
    if (!reducedMotion) time.current.value += Math.min(delta, 0.1)
  })

  return <primitive object={points} />
}
