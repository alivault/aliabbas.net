import { useEffect, useRef } from 'react'
import { nextOnTour } from './tour'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { play, playFlight, setDroneOpen } from '~/lib/sound'
import { spinGrab } from './cubeSpin'
import { FOOTPRINT_SIZE } from './Footprint'
import { CLICK_EASE, CLICK_WALK, dashTiming } from './dash'
import { frameScreenX } from './frame'
import { iconSlot } from './iconSlot'
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
/** Meters per second of glide that one pixel of scroll gives. */
const SCROLL_PUSH = 0.03
/** The fastest glide from the scroll wheel, in meters per second. */
const SCROLL_TOP = RUN
/** How fast the glide dies out after the scroll stops, per second. */
const SCROLL_DRAG = 3

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
  /** Stops the sound of the flight, when the flight stops early. */
  stopSound?: () => void
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
 * arrows to walk, Shift to run, a click on the ground to walk there, scroll
 * to glide forward and back (and to the side, with a sideways scroll). Flights
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
  /** The sheets that Next has shown in this tour, in order. */
  const toured = useRef(new Set<string>())
  const stepClock = useRef(0)
  /** The dash that has its sound, and the function that stops it. */
  const dash = useRef<{ target: THREE.Vector3; stop: () => void } | null>(null)
  const droneClock = useRef(0)
  /** The glide from the scroll wheel: forward and to the right, in m/s. */
  const glide = useRef({ forward: 0, strafe: 0 })

  const pose = (): Pose => ({
    position: position.current.clone(),
    yaw: yaw.current,
    pitch: pitch.current,
  })

  /** Stops the flight where the camera is, and its sound. */
  const stopFlight = () => {
    flight.current?.stopSound?.()
    flight.current = null
  }

  const fly = (to: Pose, options: Partial<Flight> = {}) => {
    stopFlight()
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
   * top and the text runs under it. A full-width page (the lab) puts its
   * icon small, in the square before its title (iconSlot.ts).
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
    // A cube comes nearer the camera than its middle: its front half and
    // its turned corner. Its share is smaller, and the camera stands back
    // by half a cube. The orb is a flat disc to the camera.
    const cube = sheet.icon.type !== 'orb'
    const slot = full ? iconSlot(size.width, size.height) : null
    // The share of the screen height that the icon fills, and where its
    // middle is on screen, from -1 to 1.
    const share = slot
      ? (slot.size / size.height) * 0.6
      : wide
        ? cube
          ? 0.42
          : 0.56
        : cube
          ? 0.2
          : 0.24
    // On a wide screen the icon is at 71% of the frame's width (frame.ts).
    const screenX = slot
      ? (2 * slot.x) / size.width - 1
      : wide
        ? frameScreenX(size.width, 0.71)
        : 0
    const screenY = slot ? 1 - (2 * slot.y) / size.height : wide ? 0 : 0.5
    const distance = ICON_SIZE / (share * 2 * half) + (cube ? ICON_SIZE / 2 : 0)
    const facing = Math.atan2(dx, dz)
    focus.yaw = facing - (full ? 0.35 : wide ? 0.55 : 0.4)
    // The camera pitches so the icon is at screenY, then turns so it is at
    // screenX. The turn is exact for a pitched camera: the side offset
    // shrinks by the length of the pitched ray.
    const up = screenY * half
    const side = screenX * half * aspect
    return {
      position: new THREE.Vector3(
        sheet.x + dx * distance,
        sheet.y,
        sheet.z + dz * distance,
      ),
      yaw: facing + Math.atan(side / Math.sqrt(1 + up * up)),
      pitch: -Math.atan(up),
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
      stopFlight()
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
    /** Fly to a stop in front of a sheet, facing it. */
    const flyNear = (sheet: (typeof SHEETS)[number]) => {
      const here = position.current
      let dx = here.x - sheet.x
      let dz = here.z - sheet.z
      const length = Math.hypot(dx, dz) || 1
      dx /= length
      dz /= length
      const x = sheet.x + dx * 5.5
      const z = sheet.z + dz * 5.5
      const y = heightAt(x, z) + EYE
      walkTarget.current = null
      fly(
        {
          position: new THREE.Vector3(x, y, z),
          yaw: Math.atan2(dx, dz),
          pitch: Math.atan2(sheet.y - y, 5.5) * 0.8,
        },
        { cancellable: true },
      )
      // The swoop of a dash, as long as the flight: Next and the guide
      // arrows fly the camera.
      const f = flight.current as Flight | null
      if (f) f.stopSound = playFlight(f.duration)
    }
    worldCommands.next = () => {
      if (getWorld().phase !== 'roam') return
      const { visited } = getWorld()
      flyNear(nextOnTour(SHEETS, position.current, visited, toured.current))
    }
    worldCommands.goTo = (id) => {
      const sheet = SHEETS.find((s) => s.id === id)
      if (!sheet || getWorld().phase !== 'roam') return
      toured.current.add(sheet.id)
      flyNear(sheet)
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
      // The drag spins a cube: the view stays.
      if (spinGrab.active) {
        lastX = event.clientX
        lastY = event.clientY
        return
      }
      const dx = event.clientX - lastX
      const dy = event.clientY - lastY
      lastX = event.clientX
      lastY = event.clientY
      if (flight.current?.cancellable && Math.hypot(dx, dy) > 2) {
        stopFlight()
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

  // Glide with the scroll wheel or two fingers on a touchpad: down goes
  // forward, as into the world, and sideways goes to the side.
  useEffect(() => {
    const wheel = (event: WheelEvent) => {
      // A pinch on a touchpad comes as a wheel with Ctrl: it is a zoom.
      if (event.ctrlKey) return
      if (getWorld().phase !== 'roam' || getWorld().indexOpen) return
      // Lines and pages to pixels.
      const unit =
        event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? size.height : 1
      const g = glide.current
      g.forward = THREE.MathUtils.clamp(
        g.forward - event.deltaY * unit * SCROLL_PUSH,
        -SCROLL_TOP,
        SCROLL_TOP,
      )
      g.strafe = THREE.MathUtils.clamp(
        g.strafe + event.deltaX * unit * SCROLL_PUSH,
        -SCROLL_TOP,
        SCROLL_TOP,
      )
      // The world does not scroll, and a sideways swipe must not go back
      // in the browser history.
      event.preventDefault()
      walkTarget.current = null
      if (flight.current?.cancellable) stopFlight()
    }
    window.addEventListener('wheel', wheel, { passive: false })
    return () => window.removeEventListener('wheel', wheel)
  }, [walkTarget, size.height])

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
      if (flight.current?.cancellable) stopFlight()
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
      const speed = k.has('ShiftLeft') || k.has('ShiftRight') ? RUN : WALK
      if (wish.lengthSq() > 0) wish.normalize().multiplyScalar(speed)
      // The glide of the scroll wheel adds to the keys, and dies out.
      const g = glide.current
      const fade = Math.exp(-SCROLL_DRAG * delta)
      g.forward = Math.abs(g.forward * fade) < 0.05 ? 0 : g.forward * fade
      g.strafe = Math.abs(g.strafe * fade) < 0.05 ? 0 : g.strafe * fade
      wish.x += -sin * g.forward + cos * g.strafe
      wish.z += -cos * g.forward - sin * g.strafe
      const gliding = g.forward !== 0 || g.strafe !== 0

      const target = walkTarget.current
      // A new dash starts its swoop, as long as the dash; a dash that ends
      // or stops (a key, a new click) stops it.
      if (dash.current && dash.current.target !== target) {
        dash.current.stop()
        dash.current = null
      }
      if (target && !dash.current && !forward && !strafe && !gliding) {
        const timing = dashTiming(
          Math.hypot(
            target.x - position.current.x,
            target.z - position.current.z,
          ) -
            FOOTPRINT_SIZE / 2,
        )
        dash.current = {
          target,
          stop: playFlight(timing.duration, timing.peak),
        }
      }
      if (!forward && !strafe && !gliding && target) {
        const dx = target.x - position.current.x
        const dz = target.z - position.current.z
        // The walk stops at the near edge of the square on the ground, not
        // at its middle: the square marks the place to stand in front of.
        const distance = Math.hypot(dx, dz) - FOOTPRINT_SIZE / 2
        if (distance < 0.15) {
          walkTarget.current = null
        } else {
          wish
            .set(dx, 0, dz)
            .normalize()
            .multiplyScalar(Math.min(CLICK_WALK, distance * CLICK_EASE))
          // Turn gently toward where the visitor walks.
          yaw.current = lerpAngle(
            yaw.current,
            Math.atan2(-dx, -dz),
            1 - Math.exp(-1.5 * delta),
          )
        }
      }
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
      // A dash has its own sound (played when it starts), not steps.
      if (moving > 1 && !walkTarget.current) {
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
