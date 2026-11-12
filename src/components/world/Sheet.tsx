import { useEffect, useMemo, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import type { ThreeEvent } from '@react-three/fiber'
import { play } from '~/lib/sound'
import { drawSheet } from './sheetTexture'
import { SHEET_SIZE } from './sheets'
import { withSkyFog } from './sky'
import { getWorld, setWorld } from './store'
import type { SheetSpec } from './sheets'

/** The sheet that the camera flies into, and the way it must face. */
export const focus = { id: null as string | null, yaw: 0 }

function shortestAngle(from: number, to: number) {
  return from + Math.atan2(Math.sin(to - from), Math.cos(to - from))
}

/**
 * A page as a sheet of paper that floats and turns. On hover it slows and
 * its edge lights up. When the camera flies in, it stops and faces the camera.
 */
export default function Sheet({
  sheet,
  index,
  accent,
  reducedMotion,
  onOpen,
}: {
  sheet: SheetSpec
  index: number
  accent: string
  reducedMotion: boolean
  onOpen: (sheet: SheetSpec) => void
}) {
  const group = useRef<THREE.Group>(null)
  const [texture, setTexture] = useState<THREE.Texture | null>(null)
  const hovered = useRef(false)
  const glow = useRef(0)
  const spin = useRef(index * 1.7)

  useEffect(() => {
    let alive = true
    let made: THREE.Texture | null = null
    void drawSheet(sheet).then((t) => {
      made = t
      if (alive) setTexture(t)
      else t.dispose()
    })
    return () => {
      alive = false
      made?.dispose()
    }
  }, [sheet])

  const paper = useMemo(
    () =>
      withSkyFog(
        new THREE.MeshBasicMaterial({
          color: '#d8d4ca',
          side: THREE.FrontSide,
        }),
      ),
    [],
  )
  useEffect(() => {
    if (!texture) return
    paper.map = texture
    paper.color.set('#ffffff')
    paper.needsUpdate = true
  }, [paper, texture])

  const edge = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: accent,
        transparent: true,
        opacity: 0,
        side: THREE.DoubleSide,
        depthWrite: false,
      }),
    [accent],
  )

  useFrame((state, delta) => {
    const g = group.current
    if (!g) return
    const focused = focus.id === sheet.id
    const t = state.clock.elapsedTime
    if (focused) {
      g.rotation.y = THREE.MathUtils.damp(
        g.rotation.y,
        shortestAngle(g.rotation.y, focus.yaw),
        4,
        delta,
      )
      spin.current = g.rotation.y
      g.position.y = THREE.MathUtils.damp(g.position.y, sheet.y, 4, delta)
    } else if (!reducedMotion) {
      spin.current += delta * (hovered.current ? 0.08 : 0.32)
      g.rotation.y = spin.current
      g.position.y = sheet.y + Math.sin(t * 0.7 + index) * 0.12
      g.rotation.z = Math.sin(t * 0.5 + index * 2) * 0.03
    }
    glow.current = THREE.MathUtils.damp(
      glow.current,
      hovered.current || focused ? 1 : 0,
      8,
      delta,
    )
    edge.opacity = glow.current
  })

  const over = (event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation()
    if (getWorld().phase !== 'roam') return
    hovered.current = true
    document.body.style.cursor = 'pointer'
    setWorld({ hover: sheet.id })
    play('hover')
  }
  const out = () => {
    hovered.current = false
    document.body.style.cursor = ''
    if (getWorld().hover === sheet.id) setWorld({ hover: null })
  }
  const click = (event: ThreeEvent<MouseEvent>) => {
    event.stopPropagation()
    if (event.delta > 6 || getWorld().phase !== 'roam') return
    out()
    onOpen(sheet)
  }

  const { width, height } = SHEET_SIZE
  return (
    <group
      ref={group}
      position={[sheet.x, sheet.y, sheet.z]}
      onPointerOver={over}
      onPointerOut={out}
      onClick={click}
    >
      <mesh material={edge}>
        <planeGeometry args={[width + 0.08, height + 0.08]} />
      </mesh>
      <mesh material={paper} position-z={0.003}>
        <planeGeometry args={[width, height]} />
      </mesh>
      <mesh material={paper} position-z={-0.003} rotation-y={Math.PI}>
        <planeGeometry args={[width, height]} />
      </mesh>
    </group>
  )
}
