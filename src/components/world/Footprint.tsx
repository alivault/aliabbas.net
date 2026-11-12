import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { heightAt } from './noise'

const SIZE = 5
const SAMPLES = 12

/**
 * The outline on the ground under the pointer: where a click walks to. It
 * follows the shape of the ground, as a sheet of paper laid on the rock.
 */
export default function Footprint({
  point,
  color,
}: {
  point: React.RefObject<THREE.Vector3 | null>
  color: string
}) {
  const line = useRef<THREE.LineLoop>(null)
  const geometry = useMemo(() => {
    const g = new THREE.BufferGeometry()
    g.setAttribute(
      'position',
      new THREE.BufferAttribute(new Float32Array(SAMPLES * 4 * 3), 3),
    )
    return g
  }, [])
  const material = useMemo(
    () =>
      new THREE.LineBasicMaterial({
        color,
        transparent: true,
        opacity: 0.9,
        depthTest: false,
      }),
    [color],
  )
  const current = useRef(new THREE.Vector3())
  const shown = useRef(0)

  useFrame((state, delta) => {
    const target = point.current
    shown.current = THREE.MathUtils.damp(
      shown.current,
      target ? 1 : 0,
      10,
      delta,
    )
    material.opacity = shown.current * 0.9
    if (!line.current) return
    line.current.visible = shown.current > 0.01
    if (!target) return
    current.current.x = THREE.MathUtils.damp(
      current.current.x,
      target.x,
      14,
      delta,
    )
    current.current.z = THREE.MathUtils.damp(
      current.current.z,
      target.z,
      14,
      delta,
    )
    // A slow turn, so the outline feels alive.
    const angle = state.clock.elapsedTime * 0.15
    const cos = Math.cos(angle)
    const sin = Math.sin(angle)
    const corners: Array<[number, number]> = [
      [-1, -1],
      [1, -1],
      [1, 1],
      [-1, 1],
    ]
    const positions = geometry.attributes.position as THREE.BufferAttribute
    let n = 0
    for (let side = 0; side < 4; side++) {
      const [ax, az] = corners[side]
      const [bx, bz] = corners[(side + 1) % 4]
      for (let s = 0; s < SAMPLES; s++) {
        const t = s / SAMPLES
        const lx = ((ax + (bx - ax) * t) * SIZE) / 2
        const lz = ((az + (bz - az) * t) * SIZE) / 2
        const x = current.current.x + lx * cos - lz * sin
        const z = current.current.z + lx * sin + lz * cos
        positions.setXYZ(n++, x, heightAt(x, z) + 0.04, z)
      }
    }
    positions.needsUpdate = true
    geometry.computeBoundingSphere()
  })

  return (
    <lineLoop
      ref={line}
      geometry={geometry}
      material={material}
      renderOrder={2}
      frustumCulled={false}
    />
  )
}
