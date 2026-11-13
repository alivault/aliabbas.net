import { useEffect, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { play, setDroneOpen } from '~/lib/sound'
import { FOOTPRINT_SIZE } from './Footprint'
import { heightAt } from './noise'
import { ICON_SIZE, SHEETS } from './sheets'
import { WORLD_UNIFORMS } from './sky'
import { focus } from './WorldIcon'
import { getWorld, markVisited, setWorld, worldCommands } from './store'
import type { SheetSpec } from './sheets'

const EYE = 1.7
const WALK = 5
const RUN = 11
const LOOK = 0.0035

type Pose = { position: THREE.Vector3; yaw: number; pitch: number }

type Flight = {
  from: Pose
  to: Pose
  start: number
  duration: number
  /** How high the path arcs, in meters, for a long flight. */
  lift: number
  /** A key or a drag stops it. */
  cancellable: boolean
  onArrive?: () => void
}

function easeInOut(t: number) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
}

function easeOut(t: number) {
  return 1 - Math.pow(1 - t, 3)
}

function lerpAngle(a: number, b: number, t: number) {
  return a + Math.atan2(Math.sin(b - a), Math.cos(b - a)) * t
}

/**
 * The camera, as a person who walks on the ground. Drag to look, WASD or the
 * arrows to walk, Shift to run, a click on the ground to walk there. Flights
 * (into a sheet, back out, or to the next sheet) take over until they end.
 */
/** The vertical view of the camera, in degrees (as in World.tsx). */
const FOV = 55
/** The least view across, in degrees, for a tall screen. */
const MIN_SIDE_FOV = 42

export default function Player({
  reducedMotion,
  walkTarget,
}: {
  reducedMotion: boolean
  walkTarget: React.RefObject<THREE.Vector3 | null>
}) {
  const { camera, gl, size } = useThree()
  const position = useRef(new THREE.Vector3(0, heightAt(0, 6) + EYE, 6))
  const yaw = useRef(0)
  const pitch = useRef(-0.06)
  const velocity = useRef(new THREE.Vector3())
  const keys = useRef(new Set<string>())
  const flight = useRef<Flight | null>(null)
  const home = useRef<Pose | null>(null)
  const stepClock = useRef(0)
  const droneClock = useRef(0)

  const pose = (): Pose => ({
    position: position.current.clone(),
    yaw: yaw.current,
    pitch: pitch.current,
  })

  const fly = (to: Pose, options: Partial<Flight> = {}) => {
    const from = pose()
    const distance = from.position.distanceTo(to.position)
    flight.current = {
      from,
      to,
      start: performance.now() / 1000,
      duration: reducedMotion ? 0.01 : Math.min(2.6, 1.1 + distance * 0.025),
      lift: reducedMotion ? 0 : Math.min(8, distance * 0.12),
      cancellable: false,
      ...options,
    }
  }

  /**
   * Where the camera reads a page: the icon large on the right, turned at an
   * angle, and the text on the left. On a narrow screen, the icon is at the
   * top and the text runs under it. A full-width page (the lab) zooms
   * straight into its icon, in the middle and face on; the icon then fades
   * out as the page comes in.
   */
  const insidePose = (sheet: SheetSpec): Pose => {
    const perspective = camera as THREE.PerspectiveCamera
    let dx = position.current.x - sheet.x
    let dz = position.current.z - sheet.z
    const length = Math.hypot(dx, dz) || 1
    dx /= length
    dz /= length
    const aspect = size.width / size.height
    const wide = aspect >= 1
    const full = Boolean(sheet.wide)
    const half = Math.tan(THREE.MathUtils.degToRad(perspective.fov) / 2)
    // The share of the screen height that the icon fills.
    const share = full ? 0.8 : wide ? 0.56 : 0.24
    const distance = ICON_SIZE / (share * 2 * half)
    // Where the icon center is on screen, from -1 to 1.
    const screenX = full ? 0 : wide ? 0.42 : 0
    const screenY = full ? 0 : wide ? 0 : 0.5
    const facing = Math.atan2(dx, dz)
    focus.yaw = facing - (full ? 0 : wide ? 0.95 : 0.6)
    return {
      position: new THREE.Vector3(
        sheet.x + dx * distance,
        sheet.y,
        sheet.z + dz * distance,
      ),
      yaw: facing + Math.atan(screenX * half * aspect),
      pitch: -Math.atan(screenY * half),
    }
  }

  // Commands from the DOM: the HUD and the router.
  useEffect(() => {
    worldCommands.enter = (id) => {
      const sheet = SHEETS.find((s) => s.id === id)
      if (!sheet) return
      // From one page to the next, keep the place to go back to.
      if (getWorld().phase === 'roam' || !home.current) home.current = pose()
      focus.id = sheet.id
      walkTarget.current = null
      setWorld({ phase: 'entering', target: sheet.id, hover: null })
      play('portal-in')
      fly(insidePose(sheet), {
        onArrive: () => {
          setWorld({ phase: 'inside' })
          markVisited(sheet.id)
        },
      })
    }
    worldCommands.snapInto = (id) => {
      const sheet = SHEETS.find((s) => s.id === id)
      if (!sheet) return
      if (!home.current) home.current = pose()
      focus.id = sheet.id
      const to = insidePose(sheet)
      position.current.copy(to.position)
      yaw.current = to.yaw
      pitch.current = to.pitch
      flight.current = null
      // A deep link starts in the dark, with no fade.
      WORLD_UNIFORMS.uDim.value = 1
      setWorld({ phase: 'inside', target: sheet.id, hover: null })
      markVisited(sheet.id)
    }
    worldCommands.leave = () => {
      const { phase, target } = getWorld()
      if (phase !== 'inside' && phase !== 'entering') return
      const sheet = SHEETS.find((s) => s.id === target)
      // Back out a few steps in front of the sheet, or to where the
      // visitor stood before.
      let to = home.current
      if (!to && sheet) {
        let dx = position.current.x - sheet.x
        let dz = position.current.z - sheet.z
        const length = Math.hypot(dx, dz) || 1
        dx /= length
        dz /= length
        const x = sheet.x + dx * 6
        const z = sheet.z + dz * 6
        to = {
          position: new THREE.Vector3(x, heightAt(x, z) + EYE, z),
          yaw: Math.atan2(dx, dz),
          pitch: -0.05,
        }
      }
      home.current = null
      setWorld({ phase: 'leaving' })
      play('portal-out')
      fly(to ?? pose(), {
        onArrive: () => {
          focus.id = null
          setWorld({ phase: 'roam', target: null })
        },
      })
    }
    worldCommands.next = () => {
      if (getWorld().phase !== 'roam') return
      const { visited } = getWorld()
      const here = position.current
      const candidates = SHEETS.filter((s) => !visited.includes(s.id))
      const pool = candidates.length ? candidates : SHEETS
      // The nearest one that is not right in front of the visitor.
      const sheet =
        [...pool]
          .map((s) => ({ s, d: Math.hypot(s.x - here.x, s.z - here.z) }))
          .filter(({ d }) => d > 7)
          .sort((a, b) => a.d - b.d)[0]?.s ?? pool[0]
      let dx = here.x - sheet.x
      let dz = here.z - sheet.z
      const length = Math.hypot(dx, dz) || 1
      dx /= length
      dz /= length
      const x = sheet.x + dx * 5.5
      const z = sheet.z + dz * 5.5
      const y = heightAt(x, z) + EYE
      walkTarget.current = null
      play('click')
      fly(
        {
          position: new THREE.Vector3(x, y, z),
          yaw: Math.atan2(dx, dz),
          pitch: Math.atan2(sheet.y - y, 5.5) * 0.8,
        },
        { cancellable: true },
      )
    }
  })

  // A tall screen (a phone) sees little to the sides with the same
  // vertical view: widen it so the view is at least MIN_SIDE_FOV across.
  useEffect(() => {
    const perspective = camera as THREE.PerspectiveCamera
    const aspect = size.width / size.height
    const side = Math.tan(THREE.MathUtils.degToRad(MIN_SIDE_FOV) / 2)
    const fromSide = THREE.MathUtils.radToDeg(2 * Math.atan(side / aspect))
    perspective.fov = Math.max(FOV, fromSide)
    perspective.updateProjectionMatrix()
  }, [camera, size.width, size.height])

  // On a phone, the walk starts facing the nearest icon, so the first view
  // has one in it.
  useEffect(() => {
    if (size.width >= size.height || getWorld().phase !== 'roam') return
    const here = position.current
    const nearest = [...SHEETS].sort(
      (a, b) =>
        Math.hypot(a.x - here.x, a.z - here.z) -
        Math.hypot(b.x - here.x, b.z - here.z),
    )[0]
    if (!nearest) return
    yaw.current = Math.atan2(here.x - nearest.x, here.z - nearest.z)
    // Only at the start.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // A new window size moves the icon: put the camera where it reads it.
  useEffect(() => {
    const { phase, target } = getWorld()
    const sheet = SHEETS.find((s) => s.id === target)
    if (phase !== 'inside' || !sheet) return
    const to = insidePose(sheet)
    position.current.copy(to.position)
    yaw.current = to.yaw
    pitch.current = to.pitch
    // insidePose reads the camera; this runs only when the size changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [size.width, size.height])

  // After the commands are in place: tell the DOM.
  useEffect(() => {
    setWorld({ ready: true })
    return () => setWorld({ ready: false })
  }, [])

  // Look by dragging.
  useEffect(() => {
    const element = gl.domElement
    let dragging = false
    let lastX = 0
    let lastY = 0
    const down = (event: PointerEvent) => {
      dragging = true
      lastX = event.clientX
      lastY = event.clientY
    }
    const move = (event: PointerEvent) => {
      if (!dragging || getWorld().phase !== 'roam' || getWorld().indexOpen)
        return
      const dx = event.clientX - lastX
      const dy = event.clientY - lastY
      lastX = event.clientX
      lastY = event.clientY
      if (flight.current?.cancellable && Math.hypot(dx, dy) > 2) {
        flight.current = null
      }
      if (flight.current) return
      const speed = event.pointerType === 'touch' ? LOOK * 1.6 : LOOK
      yaw.current += dx * speed
      pitch.current = THREE.MathUtils.clamp(
        pitch.current + dy * speed,
        -1.1,
        1.1,
      )
    }
    const up = () => {
      dragging = false
    }
    element.addEventListener('pointerdown', down)
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
    window.addEventListener('pointercancel', up)
    return () => {
      element.removeEventListener('pointerdown', down)
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
      window.removeEventListener('pointercancel', up)
    }
  }, [gl])

  // Walk with the keyboard.
  useEffect(() => {
    const MOVE = new Set([
      'KeyW',
      'KeyA',
      'KeyS',
      'KeyD',
      'ArrowUp',
      'ArrowDown',
      'ArrowLeft',
      'ArrowRight',
      'ShiftLeft',
      'ShiftRight',
    ])
    const typing = (target: EventTarget | null) =>
      target instanceof HTMLElement &&
      (target.isContentEditable ||
        target.matches('input, textarea, select, [role="textbox"]'))
    const down = (event: KeyboardEvent) => {
      if (!MOVE.has(event.code) || typing(event.target)) return
      if (getWorld().phase !== 'roam' || getWorld().indexOpen) return
      if (event.code.startsWith('Arrow')) event.preventDefault()
      keys.current.add(event.code)
      walkTarget.current = null
      if (flight.current?.cancellable) flight.current = null
    }
    const up = (event: KeyboardEvent) => keys.current.delete(event.code)
    const blur = () => keys.current.clear()
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    window.addEventListener('blur', blur)
    return () => {
      window.removeEventListener('keydown', down)
      window.removeEventListener('keyup', up)
      window.removeEventListener('blur', blur)
    }
  }, [walkTarget])

  useFrame((_, rawDelta) => {
    const delta = Math.min(rawDelta, 0.05)
    const now = performance.now() / 1000
    const f = flight.current

    if (f) {
      const t = Math.min(1, (now - f.start) / f.duration)
      const move = easeInOut(t)
      const look = easeOut(Math.min(1, t * 1.5))
      position.current.lerpVectors(f.from.position, f.to.position, move)
      position.current.y += Math.sin(Math.PI * move) * f.lift
      yaw.current = lerpAngle(f.from.yaw, f.to.yaw, look)
      pitch.current = THREE.MathUtils.lerp(f.from.pitch, f.to.pitch, look)
      if (t >= 1) {
        flight.current = null
        f.onArrive?.()
      }
    } else if (getWorld().phase === 'roam' && !getWorld().indexOpen) {
      // Input, as a direction relative to where the camera looks.
      const k = keys.current
      const forward =
        (k.has('KeyW') || k.has('ArrowUp') ? 1 : 0) -
        (k.has('KeyS') || k.has('ArrowDown') ? 1 : 0)
      const strafe = (k.has('KeyD') ? 1 : 0) - (k.has('KeyA') ? 1 : 0)
      const turn = (k.has('ArrowLeft') ? 1 : 0) - (k.has('ArrowRight') ? 1 : 0)
      yaw.current += turn * delta * 1.8

      const wish = new THREE.Vector3()
      const sin = Math.sin(yaw.current)
      const cos = Math.cos(yaw.current)
      wish.x = -sin * forward + cos * strafe
      wish.z = -cos * forward - sin * strafe
      let speed = k.has('ShiftLeft') || k.has('ShiftRight') ? RUN : WALK

      const target = walkTarget.current
      if (!forward && !strafe && target) {
        const dx = target.x - position.current.x
        const dz = target.z - position.current.z
        // The walk stops at the near edge of the square on the ground, not
        // at its middle: the square marks the place to stand in front of.
        const distance = Math.hypot(dx, dz) - FOOTPRINT_SIZE / 2
        if (distance < 0.15) {
          walkTarget.current = null
        } else {
          wish.set(dx, 0, dz)
          speed = Math.min(WALK, distance * 2)
          // Turn gently toward where the visitor walks.
          yaw.current = lerpAngle(
            yaw.current,
            Math.atan2(-dx, -dz),
            1 - Math.exp(-1.5 * delta),
          )
        }
      }
      if (wish.lengthSq() > 0) wish.normalize().multiplyScalar(speed)
      velocity.current.lerp(wish, 1 - Math.exp(-8 * delta))
      position.current.addScaledVector(velocity.current, delta)

      // Stay on the ground, with a soft follow so steps feel smooth.
      const ground = heightAt(position.current.x, position.current.z) + EYE
      position.current.y = THREE.MathUtils.damp(
        position.current.y,
        ground,
        10,
        delta,
      )

      const moving = velocity.current.length()
      if (moving > 1) {
        stepClock.current += delta * (moving / WALK)
        if (stepClock.current > 0.5) {
          stepClock.current = 0
          play('step')
        }
      }
    }

    camera.position.copy(position.current)
    camera.rotation.set(pitch.current, yaw.current, 0, 'YXZ')

    // The drone opens as a sheet comes near.
    droneClock.current += delta
    if (droneClock.current > 0.25) {
      droneClock.current = 0
      const phase = getWorld().phase
      let nearest = Infinity
      for (const sheet of SHEETS) {
        nearest = Math.min(
          nearest,
          Math.hypot(
            sheet.x - position.current.x,
            sheet.z - position.current.z,
          ),
        )
      }
      setDroneOpen(phase === 'roam' ? Math.max(0, 1 - nearest / 14) * 0.6 : 1)
    }
  })

  return null
}
