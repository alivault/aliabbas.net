import { useMemo, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import Footprint from './Footprint'
import Player from './Player'
import { SHEETS } from './sheets'
import Sky from './Sky'
import { SUN_DIRECTION, WORLD_UNIFORMS } from './sky'
import { getWorld } from './store'
import Terrain from './Terrain'
import WorldIcon from './WorldIcon'
import type { SheetSpec } from './sheets'

/** Reads a color token, for the parts of the scene that match the HUD. */
function token(name: string, fallback: string) {
  if (typeof document === 'undefined') return fallback
  const value = getComputedStyle(document.documentElement)
    .getPropertyValue(name)
    .trim()
  if (!value) return fallback
  // three.js does not read oklch: let the canvas convert it.
  const context = document.createElement('canvas').getContext('2d')
  if (!context) return fallback
  context.fillStyle = value
  return context.fillStyle
}

/**
 * The world: the sky, ground without end, and the pages as sheets. It loads
 * on the client only, after the page.
 */
export default function World({
  reducedMotion,
  onOpen,
}: {
  reducedMotion: boolean
  /** The visitor clicked an icon: fly in and open its page. */
  onOpen: (sheet: SheetSpec) => void
}) {
  const pointer = useRef<THREE.Vector3 | null>(null)
  const walkTarget = useRef<THREE.Vector3 | null>(null)
  const accent = useMemo(() => token('--hud', '#e0501f'), [])
  const sun = useMemo(() => SUN_DIRECTION.clone().multiplyScalar(100), [])

  return (
    <Canvas
      flat
      dpr={[1, 1.5]}
      camera={{ fov: 55, near: 0.05, far: 900 }}
      gl={{ antialias: true, powerPreference: 'high-performance' }}
      onPointerMissed={() => {
        pointer.current = null
      }}
    >
      <Sky />
      <hemisphereLight args={['#d6d2cc', '#202020', 1.2]} />
      <directionalLight position={sun} color="#ffe0c0" intensity={1.1} />
      <Terrain
        onPoint={(point) => {
          pointer.current = getWorld().phase === 'roam' ? point : null
        }}
        onPick={(point) => {
          if (getWorld().phase !== 'roam') return
          walkTarget.current = point.clone()
        }}
      />
      <Footprint point={pointer} color={accent} />
      {SHEETS.map((sheet, index) => (
        <WorldIcon
          key={sheet.id}
          sheet={sheet}
          index={index}
          accent={accent}
          reducedMotion={reducedMotion}
          onOpen={onOpen}
        />
      ))}
      <Player reducedMotion={reducedMotion} walkTarget={walkTarget} />
      <Dimmer />
    </Canvas>
  )
}

/** Darkens the world while a page is open, and lights it again after. */
function Dimmer() {
  useFrame((_, delta) => {
    const { phase } = getWorld()
    const target = phase === 'inside' || phase === 'entering' ? 1 : 0
    WORLD_UNIFORMS.uDim.value = THREE.MathUtils.damp(
      WORLD_UNIFORMS.uDim.value,
      target,
      target ? 2.2 : 3,
      Math.min(delta, 0.05),
    )
  })
  return null
}
