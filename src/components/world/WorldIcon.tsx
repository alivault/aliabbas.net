import { useEffect, useMemo, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import type { ThreeEvent } from '@react-three/fiber'
import { play } from '~/lib/sound'
import { drawIcon } from './iconTexture'
import { heightAt } from './noise'
import { ICON_SIZE } from './sheets'
import { WORLD_UNIFORMS, withSkyFog } from './sky'
import { getWorld, setWorld } from './store'
import type { SheetSpec } from './sheets'

/** The icon that the camera flies to or reads, and the way it must face. */
export const focus = { id: null as string | null, yaw: 0 }

/**
 * The icon of a full-width page fades over this range of camera distance,
 * in meters, as the camera zooms in. The camera stops at about 1.7 m.
 */
const FADE_FROM = 9
const FADE_GONE = 2.4

function shortestAngle(from: number, to: number) {
  return from + Math.atan2(Math.sin(to - from), Math.cos(to - from))
}

/** A soft dark spot under each icon, so it hangs over the ground. */
let shadowTexture: THREE.Texture | null = null
export function getShadowTexture() {
  if (shadowTexture) return shadowTexture
  const size = 128
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = size
  const context = canvas.getContext('2d')!
  const gradient = context.createRadialGradient(
    size / 2,
    size / 2,
    0,
    size / 2,
    size / 2,
    size / 2,
  )
  gradient.addColorStop(0, 'rgba(0,0,0,0.55)')
  gradient.addColorStop(1, 'rgba(0,0,0,0)')
  context.fillStyle = gradient
  context.fillRect(0, 0, size, size)
  shadowTexture = new THREE.CanvasTexture(canvas)
  return shadowTexture
}

/**
 * A page as its icon: it floats and turns over the ground. On hover it slows
 * and a frame in the HUD color shows around it. When the camera flies in, it
 * stops at an angle and stays lit while the rest of the world goes dark.
 */
export default function WorldIcon({
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
  const dim = useMemo(() => ({ value: 0 }), [])

  useEffect(() => {
    let alive = true
    let made: THREE.Texture | null = null
    void drawIcon(sheet.icon).then((t) => {
      made = t
      if (alive) setTexture(t)
      else t.dispose()
    })
    return () => {
      alive = false
      made?.dispose()
    }
  }, [sheet])

  const face = useMemo(
    () =>
      withSkyFog(
        new THREE.MeshBasicMaterial({
          transparent: true,
          alphaTest: 0.02,
          side: THREE.FrontSide,
          opacity: 0,
        }),
        dim,
      ),
    [dim],
  )
  useEffect(() => {
    if (!texture) return
    face.map = texture
    face.opacity = 1
    face.needsUpdate = true
  }, [face, texture])

  const frame = useMemo(() => {
    const half = ICON_SIZE / 2 + 0.06
    const geometry = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-half, -half, 0),
      new THREE.Vector3(half, -half, 0),
      new THREE.Vector3(half, half, 0),
      new THREE.Vector3(-half, half, 0),
    ])
    const material = new THREE.LineBasicMaterial({
      color: accent,
      transparent: true,
      opacity: 0,
    })
    return new THREE.LineLoop(geometry, material)
  }, [accent])

  const shadow = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        map: getShadowTexture(),
        transparent: true,
        depthWrite: false,
      }),
    [],
  )
  const ground = heightAt(sheet.x, sheet.z)

  useFrame((state, delta) => {
    const g = group.current
    if (!g) return
    const focused = focus.id === sheet.id
    const t = state.clock.elapsedTime
    if (focused) {
      g.rotation.y = THREE.MathUtils.damp(
        g.rotation.y,
        shortestAngle(g.rotation.y, focus.yaw),
        3.5,
        delta,
      )
      spin.current = g.rotation.y
      g.rotation.z = THREE.MathUtils.damp(g.rotation.z, 0, 4, delta)
      g.position.y = THREE.MathUtils.damp(g.position.y, sheet.y, 4, delta)
    } else if (!reducedMotion) {
      spin.current += delta * (hovered.current ? 0.08 : 0.32)
      g.rotation.y = spin.current
      g.position.y = sheet.y + Math.sin(t * 0.7 + index) * 0.12
      g.rotation.z = Math.sin(t * 0.5 + index * 2) * 0.03
    }
    // Only the icon in focus stays lit while the world goes dark. The icon
    // of a full-width page fades out instead as the camera zooms in: by the
    // distance to it, so it is gone when the camera arrives.
    dim.value = focused ? 0 : WORLD_UNIFORMS.uDim.value
    if (texture) {
      const { phase } = getWorld()
      const zooming =
        focused && sheet.wide && (phase === 'entering' || phase === 'inside')
      const distance = state.camera.position.distanceTo(g.position)
      const target = zooming
        ? THREE.MathUtils.smoothstep(distance, FADE_GONE, FADE_FROM)
        : 1
      face.opacity = THREE.MathUtils.damp(face.opacity, target, 8, delta)
    }
    glow.current = THREE.MathUtils.damp(
      glow.current,
      hovered.current && !focused ? 1 : 0,
      8,
      delta,
    )
    ;(frame.material as THREE.LineBasicMaterial).opacity = glow.current
    shadow.opacity = 1 - WORLD_UNIFORMS.uDim.value
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

  return (
    <>
      <group
        ref={group}
        position={[sheet.x, sheet.y, sheet.z]}
        onPointerOver={over}
        onPointerOut={out}
        onClick={click}
      >
        <primitive object={frame} />
        <mesh material={face} position-z={0.002}>
          <planeGeometry args={[ICON_SIZE, ICON_SIZE]} />
        </mesh>
        <mesh material={face} position-z={-0.002} rotation-y={Math.PI}>
          <planeGeometry args={[ICON_SIZE, ICON_SIZE]} />
        </mesh>
      </group>
      <mesh
        material={shadow}
        position={[sheet.x, ground + 0.05, sheet.z]}
        rotation-x={-Math.PI / 2}
      >
        <planeGeometry args={[ICON_SIZE * 1.4, ICON_SIZE * 1.4]} />
      </mesh>
    </>
  )
}
