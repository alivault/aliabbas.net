import { useEffect, useMemo, useRef, useState } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import type { ThreeEvent } from '@react-three/fiber'
import { play } from '~/lib/sound'
import { drawIcon } from './iconTexture'
import { heightAt } from './noise'
import { ICON_SIZE } from './sheets'
import { WORLD_UNIFORMS, withSkyFog } from './sky'
import { registerSpinner, spinGrab } from './cubeSpin'
import { getWorld, iconScrollShow, setWorld } from './store'
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
 * The ground under the spot, as a small mesh that follows the hills. A
 * flat plane cuts into a slope: the ground hides the part under it, with
 * a hard edge. It sits a little above heightAt, as the ground mesh is
 * coarser than the noise and can be a little higher between its points.
 */
export function shadowGeometry(x: number, z: number) {
  const size = ICON_SIZE * 1.4
  const geometry = new THREE.PlaneGeometry(size, size, 12, 12)
  geometry.rotateX(-Math.PI / 2)
  const ground = heightAt(x, z)
  const positions = geometry.attributes.position as THREE.BufferAttribute
  for (let i = 0; i < positions.count; i++) {
    const height = heightAt(x + positions.getX(i), z + positions.getZ(i))
    positions.setY(i, height - ground + 0.12)
  }
  return geometry
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
  const cameraUp = useMemo(() => new THREE.Vector3(), [])
  const cameraForward = useMemo(() => new THREE.Vector3(), [])
  const rest = useMemo(() => new THREE.Vector3(), [])
  const yawTurn = useMemo(() => new THREE.Quaternion(), [])
  const dim = useMemo(() => ({ value: 0 }), [])
  /** 1 while this icon is in focus: no fog, so a far camera (the small
      cube of the lab) does not darken it. */
  const clear = useMemo(() => ({ value: 0 }), [])

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
        clear,
      ),
    [dim, clear],
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
    const lines = new THREE.LineSegments(geometry, material)
    // Only the box takes the pointer. A line counts a hit within a whole
    // unit of it, so the frame and the box took turns under the pointer
    // near an edge, and each turn played the hover sound again.
    lines.raycast = () => {}
    return lines
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
  const shadowShape = useMemo(
    () => shadowGeometry(sheet.x, sheet.z),
    [sheet.x, sheet.z],
  )

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
      // The spin settles on a quarter turn, so a face looks straight out.
      // The tilt rolls back upright (after any number of full flips), so
      // the icon on that face is right side up.
      for (const [axis, step] of [
        [turn.yaw, QUARTER],
        [turn.tilt, Math.PI * 2],
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
      if (sheet.wide && getWorld().phase === 'inside') {
        // The small cube of the lab moves with the page: up by as many
        // pixels as the page scrolls, at its depth from the camera.
        rest.set(sheet.x, sheet.y, sheet.z)
        const camera = state.camera as THREE.PerspectiveCamera
        const depth = rest
          .clone()
          .sub(camera.position)
          .dot(cameraForward.set(0, 0, -1).applyQuaternion(camera.quaternion))
        const half = Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2)
        const perPixel = (2 * depth * half) / state.size.height
        cameraUp.set(0, 1, 0).applyQuaternion(camera.quaternion)
        g.position
          .copy(rest)
          .addScaledVector(cameraUp, window.scrollY * perPixel)
      } else {
        g.position.x = THREE.MathUtils.damp(g.position.x, sheet.x, 4, delta)
        g.position.z = THREE.MathUtils.damp(g.position.z, sheet.z, 4, delta)
        g.position.y = THREE.MathUtils.damp(g.position.y, sheet.y, 4, delta)
      }
    } else {
      // In the world, a drag spins the cube too. The spin goes on and
      // slows down, and the slow turn of every cube takes over again; the
      // tilt rolls back upright.
      spin.current += turn.yaw.offset
      turn.yaw.offset = 0
      if (!turn.dragging) {
        turn.yaw.velocity *= Math.exp(-2.5 * delta)
        spin.current += turn.yaw.velocity * delta
        turn.tilt.velocity *= Math.exp(-2.5 * delta)
        turn.tilt.offset += turn.tilt.velocity * delta
        if (Math.abs(turn.tilt.velocity) < 1) {
          const upright =
            Math.round(turn.tilt.offset / (Math.PI * 2)) * Math.PI * 2
          turn.tilt.offset = THREE.MathUtils.damp(
            turn.tilt.offset,
            upright,
            4,
            delta,
          )
          // Upright after whole flips is upright: count from zero again.
          if (Math.abs(turn.tilt.offset - upright) < 0.002) {
            turn.tilt.offset -= upright
            turn.tiltShown -= upright
          }
        }
      }
      if (!reducedMotion) {
        spin.current += delta * (hovered.current ? 0.08 : 0.32)
      }
      turn.tiltShown = THREE.MathUtils.damp(
        turn.tiltShown,
        turn.tilt.offset,
        turn.dragging ? 30 : 6,
        delta,
      )
      if (Math.abs(turn.tiltShown) < 0.001 && !turn.tilt.offset) {
        turn.tiltShown = 0
      }
      cameraRight
        .set(1, 0, 0)
        .applyQuaternion(state.camera.quaternion)
        .setY(0)
        .normalize()
      if (Math.abs(turn.tiltShown) > 0.001) {
        yawTurn.setFromAxisAngle(UP, spin.current)
        g.quaternion
          .setFromAxisAngle(cameraRight, turn.tiltShown)
          .multiply(yawTurn)
      } else {
        turn.tiltShown = 0
        g.rotation.set(
          0,
          spin.current,
          reducedMotion ? 0 : Math.sin(t * 0.5 + index * 2) * 0.03,
        )
      }
      g.position.x = sheet.x
      g.position.z = sheet.z
      g.position.y = reducedMotion
        ? sheet.y
        : sheet.y + Math.sin(t * 0.7 + index) * 0.12
    }
    // Only the icon in focus stays lit while the world goes dark. On a
    // narrow screen it fades as the text scrolls over it; the small icon of
    // the lab fades as its title scrolls away.
    dim.value = focused ? 0 : WORLD_UNIFORMS.uDim.value
    clear.value = THREE.MathUtils.damp(
      clear.value,
      focused ? 1 : 0,
      4,
      Math.min(delta, 0.05),
    )
    // The small cube of a wide page (the lab) is far from the camera, and
    // its icon blurs into the dark face. More light keeps it bright.
    face.emissiveIntensity = THREE.MathUtils.damp(
      face.emissiveIntensity,
      focused && sheet.wide ? 1.6 : 1,
      4,
      Math.min(delta, 0.05),
    )
    if (texture) {
      const inside = focused && getWorld().phase === 'inside'
      const target = !inside
        ? 1
        : sheet.wide
          ? 1
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
  const spinnable = () => focus.id === sheet.id && getWorld().phase === 'inside'

  /** A press on the cube, at a point of the screen (CSS pixels). */
  const startSpin = (x: number, y: number) => {
    const turn = turned.current
    turn.yaw.velocity = turn.tilt.velocity = 0
    Object.assign(turn, { dragging: true, x, y, time: performance.now() })
    document.body.style.cursor = 'grabbing'
    // In the world, a press can still be a click that opens the page:
    // the sound of the open plays then, not this one.
    if (getWorld().phase === 'roam') spinGrab.active = true
    else play('click')
  }
  const moveSpin = (x: number, y: number) => {
    const turn = turned.current
    if (!turn.dragging) return
    const now = performance.now()
    const seconds = Math.max((now - turn.time) / 1000, 1 / 240)
    const across = (x - turn.x) * DRAG_TURN
    const down = (y - turn.y) * DRAG_TURN
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
    turn.x = x
    turn.y = y
    turn.time = now
  }
  /** The drag ends: on a pointer up anywhere, also off the cube. */
  const release = () => {
    const turn = turned.current
    if (!turn.dragging) return
    turn.dragging = false
    spinGrab.active = false
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
    document.body.style.cursor = !hovered.current
      ? ''
      : spinnable()
        ? 'grab'
        : 'pointer'
  }
  useEffect(() => {
    window.addEventListener('pointerup', release)
    window.addEventListener('pointercancel', release)
    return () => {
      window.removeEventListener('pointerup', release)
      window.removeEventListener('pointercancel', release)
    }
  })
  // The DOM can spin this cube too (the lab page covers its cube).
  useEffect(() =>
    registerSpinner(sheet.id, {
      grab: (x, y) => {
        if (spinnable()) startSpin(x, y)
      },
      drag: moveSpin,
      release,
    }),
  )

  const grab = (event: ThreeEvent<PointerEvent>) => {
    if (event.button !== 0) return
    if (!spinnable() && getWorld().phase !== 'roam') return
    event.stopPropagation()
    try {
      ;(event.target as Element).setPointerCapture(event.pointerId)
    } catch {
      // A pointer that is not active (a synthetic event) has no capture.
    }
    turned.current.pointer = event.pointerId
    startSpin(event.nativeEvent.clientX, event.nativeEvent.clientY)
  }
  const drag = (event: ThreeEvent<PointerEvent>) => {
    if (!turned.current.dragging) return
    event.stopPropagation()
    moveSpin(event.nativeEvent.clientX, event.nativeEvent.clientY)
  }

  const over = (event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation()
    if (spinnable()) {
      hovered.current = true
      if (!turned.current.dragging) document.body.style.cursor = 'grab'
      return
    }
    if (getWorld().phase !== 'roam') return
    const already = hovered.current
    hovered.current = true
    document.body.style.cursor = 'pointer'
    setWorld({ hover: sheet.id })
    if (!already) play('hover')
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
        geometry={shadowShape}
        position={[sheet.x, ground, sheet.z]}
      />
    </>
  )
}
