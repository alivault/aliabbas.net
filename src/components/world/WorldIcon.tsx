import { useEffect, useMemo, useRef, useState } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import type { ThreeEvent } from '@react-three/fiber'
import { play } from '~/lib/sound'
import { drawIcon } from './iconTexture'
import { heightAt } from './noise'
import { ICON_SIZE } from './sheets'
import { WORLD_UNIFORMS, withSkyFog } from './sky'
import { getWorld, iconScrollShow, iconSlotShow, setWorld } from './store'
import type { SheetSpec } from './sheets'

/** The icon that the camera flies to or reads, and the way it must face. */
export const focus = { id: null as string | null, yaw: 0 }

/** A quarter turn: the cube settles with a face to the camera. */
const QUARTER = Math.PI / 2
/** Radians of spin for each pixel of a drag. */
const DRAG_TURN = 0.012
const UP = new THREE.Vector3(0, 1, 0)

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
 * A page as its icon: a cube that floats and turns over the ground. On hover it slows
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
  const gl = useThree((state) => state.gl)
  const [texture, setTexture] = useState<THREE.Texture | null>(null)
  const hovered = useRef(false)
  const glow = useRef(0)
  const spin = useRef(index * 1.7)
  /** The spin that a drag gives the cube while its page is open. */
  const turned = useRef({
    yaw: { offset: 0, velocity: 0 },
    tilt: { offset: 0, velocity: 0 },
    /** The tilt on screen: it follows tilt.offset, smoothly. */
    tiltShown: 0,
    dragging: false,
    x: 0,
    y: 0,
    time: 0,
    pointer: -1,
  })
  const cameraRight = useMemo(() => new THREE.Vector3(), [])
  const yawTurn = useMemo(() => new THREE.Quaternion(), [])
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

  // Every face shows the icon. Lambert light shades each face by the way
  // it faces the sun, and the emissive map keeps the icon bright on the
  // dark side.
  const face = useMemo(
    () =>
      withSkyFog(
        new THREE.MeshLambertMaterial({
          color: new THREE.Color(0.45, 0.45, 0.45),
          emissive: new THREE.Color(0.7, 0.7, 0.7),
          transparent: true,
          opacity: 0,
        }),
        dim,
      ),
    [dim],
  )
  useEffect(() => {
    if (!texture) return
    face.map = texture
    face.emissiveMap = texture
    face.opacity = 1
    face.needsUpdate = true
  }, [face, texture])

  // The hover frame: the edges of the cube, a little outside it.
  const frame = useMemo(() => {
    const size = ICON_SIZE + 0.08
    const geometry = new THREE.EdgesGeometry(
      new THREE.BoxGeometry(size, size, size),
    )
    const material = new THREE.LineBasicMaterial({
      color: accent,
      transparent: true,
      opacity: 0,
    })
    return new THREE.LineSegments(geometry, material)
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
    const turn = turned.current
    if (focused) {
      // With the page open, a drag spins the cube: across turns it about
      // the vertical axis, up and down tilts it toward or away from the
      // camera. Let go, and it spins on, slows down, and settles with a
      // face to the camera.
      // Both settle on a quarter turn, so a face looks straight out.
      for (const [axis, step] of [
        [turn.yaw, QUARTER],
        [turn.tilt, QUARTER],
      ] as const) {
        if (turn.dragging) continue
        axis.velocity *= Math.exp(-2.5 * delta)
        axis.offset += axis.velocity * delta
        if (Math.abs(axis.velocity) < 1) {
          const rest = Math.round(axis.offset / step) * step
          axis.offset = THREE.MathUtils.damp(axis.offset, rest, 5, delta)
        }
      }
      const fast =
        turn.dragging ||
        Math.abs(turn.yaw.velocity) + Math.abs(turn.tilt.velocity) > 0.05
      spin.current = THREE.MathUtils.damp(
        spin.current,
        shortestAngle(spin.current, focus.yaw + turn.yaw.offset),
        fast ? 30 : 3.5,
        delta,
      )
      turn.tiltShown = THREE.MathUtils.damp(
        turn.tiltShown,
        turn.tilt.offset,
        fast ? 30 : 5,
        delta,
      )
      // The tilt turns about the camera's horizontal axis, after the spin.
      cameraRight
        .set(1, 0, 0)
        .applyQuaternion(state.camera.quaternion)
        .setY(0)
        .normalize()
      yawTurn.setFromAxisAngle(UP, spin.current)
      g.quaternion
        .setFromAxisAngle(cameraRight, turn.tiltShown)
        .multiply(yawTurn)
      g.position.y = THREE.MathUtils.damp(g.position.y, sheet.y, 4, delta)
    } else if (!reducedMotion) {
      turn.yaw.offset = turn.yaw.velocity = 0
      turn.tilt.offset = turn.tilt.velocity = 0
      spin.current += delta * (hovered.current ? 0.08 : 0.32)
      // A cube left tilted rolls back upright, smoothly.
      turn.tiltShown = THREE.MathUtils.damp(turn.tiltShown, 0, 3, delta)
      if (Math.abs(turn.tiltShown) > 0.001) {
        yawTurn.setFromAxisAngle(UP, spin.current)
        g.quaternion
          .setFromAxisAngle(cameraRight, turn.tiltShown)
          .multiply(yawTurn)
      } else {
        turn.tiltShown = 0
        g.rotation.set(0, spin.current, Math.sin(t * 0.5 + index * 2) * 0.03)
      }
      g.position.y = sheet.y + Math.sin(t * 0.7 + index) * 0.12
    }
    // Only the icon in focus stays lit while the world goes dark. On a
    // narrow screen it fades as the text scrolls over it; the small icon of
    // the lab fades as its title scrolls away.
    dim.value = focused ? 0 : WORLD_UNIFORMS.uDim.value
    if (texture) {
      const inside = focused && getWorld().phase === 'inside'
      const target = !inside
        ? 1
        : sheet.wide
          ? iconSlotShow()
          : iconScrollShow(state.size.width / state.size.height)
      face.opacity = THREE.MathUtils.damp(face.opacity, target, 8, delta)
      // An opaque cube writes depth; a fading one must not hide what is
      // behind its own faces.
      face.depthWrite = face.opacity > 0.98
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

  /** The page of this cube is open, and the cube can be spun. */
  const spinnable = () =>
    focus.id === sheet.id && getWorld().phase === 'inside' && !sheet.wide

  const grab = (event: ThreeEvent<PointerEvent>) => {
    if (event.button !== 0 || !spinnable()) return
    event.stopPropagation()
    try {
      ;(event.target as Element).setPointerCapture(event.pointerId)
    } catch {
      // A pointer that is not active (a synthetic event) has no capture.
    }
    const turn = turned.current
    turn.yaw.velocity = turn.tilt.velocity = 0
    Object.assign(turn, {
      dragging: true,
      x: event.nativeEvent.clientX,
      y: event.nativeEvent.clientY,
      time: performance.now(),
      pointer: event.pointerId,
    })
    document.body.style.cursor = 'grabbing'
    play('click')
  }
  const drag = (event: ThreeEvent<PointerEvent>) => {
    const turn = turned.current
    if (!turn.dragging) return
    event.stopPropagation()
    const now = performance.now()
    const seconds = Math.max((now - turn.time) / 1000, 1 / 240)
    const across = (event.nativeEvent.clientX - turn.x) * DRAG_TURN
    const down = (event.nativeEvent.clientY - turn.y) * DRAG_TURN
    turn.yaw.offset += across
    turn.tilt.offset += down
    // The speed of the last moves, smoothed, for the spin after release.
    turn.yaw.velocity = THREE.MathUtils.lerp(
      turn.yaw.velocity,
      across / seconds,
      0.5,
    )
    turn.tilt.velocity = THREE.MathUtils.lerp(
      turn.tilt.velocity,
      down / seconds,
      0.5,
    )
    turn.x = event.nativeEvent.clientX
    turn.y = event.nativeEvent.clientY
    turn.time = now
  }
  /** The drag ends: on a pointer up anywhere, also off the cube. */
  const release = () => {
    const turn = turned.current
    if (!turn.dragging) return
    turn.dragging = false
    try {
      gl.domElement.releasePointerCapture(turn.pointer)
    } catch {
      // No capture to release.
    }
    // A pause before the release stops the spin.
    const paused = performance.now() - turn.time > 80
    for (const axis of [turn.yaw, turn.tilt]) {
      axis.velocity = paused ? 0 : THREE.MathUtils.clamp(axis.velocity, -25, 25)
    }
    document.body.style.cursor = spinnable() ? 'grab' : ''
  }
  useEffect(() => {
    window.addEventListener('pointerup', release)
    window.addEventListener('pointercancel', release)
    return () => {
      window.removeEventListener('pointerup', release)
      window.removeEventListener('pointercancel', release)
    }
  })

  const over = (event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation()
    if (spinnable()) {
      if (!turned.current.dragging) document.body.style.cursor = 'grab'
      return
    }
    if (getWorld().phase !== 'roam') return
    hovered.current = true
    document.body.style.cursor = 'pointer'
    setWorld({ hover: sheet.id })
    play('hover')
  }
  const out = () => {
    hovered.current = false
    if (!turned.current.dragging) document.body.style.cursor = ''
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
        onPointerDown={grab}
        onPointerMove={drag}
        onClick={click}
      >
        <primitive object={frame} />
        <mesh material={face}>
          <boxGeometry args={[ICON_SIZE, ICON_SIZE, ICON_SIZE]} />
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
