import { useMemo, useRef } from 'react'
import { Canvas } from '@react-three/fiber'
import * as THREE from 'three'
import Footprint from './Footprint'
import Player from './Player'
import Sheet from './Sheet'
import { SHEETS } from './sheets'
import Sky from './Sky'
import { SUN_DIRECTION } from './sky'
import { getWorld, worldCommands } from './store'
import Terrain from './Terrain'
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
  paused,
  onEntered,
}: {
  reducedMotion: boolean
  /** A page covers the world: stop drawing it. */
  paused: boolean
  onEntered: (sheet: SheetSpec) => void
}) {
  const pointer = useRef<THREE.Vector3 | null>(null)
  const walkTarget = useRef<THREE.Vector3 | null>(null)
  const accent = useMemo(() => token('--hud', '#e0501f'), [])
  const sun = useMemo(() => SUN_DIRECTION.clone().multiplyScalar(100), [])

  return (
    <Canvas
      flat
      frameloop={paused ? 'never' : 'always'}
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
        <Sheet
          key={sheet.id}
          sheet={sheet}
          index={index}
          accent={accent}
          reducedMotion={reducedMotion}
          onOpen={(s) => worldCommands.enter(s.id)}
        />
      ))}
      <Player
        reducedMotion={reducedMotion}
        onEntered={onEntered}
        walkTarget={walkTarget}
      />
    </Canvas>
  )
}
