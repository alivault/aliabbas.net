import { useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import type { ThreeEvent } from '@react-three/fiber'
import { ORB_GLSL, OrbBody } from '~/lib/orb'
import { play } from '~/lib/sound'
import { heightAt } from './noise'
import { ICON_SIZE } from './sheets'
import { FOG_DENSITY, SKY_GLSL, WORLD_UNIFORMS } from './sky'
import { getWorld, iconScrollShow, setWorld } from './store'
import { focus, getShadowTexture } from './WorldIcon'
import type { SheetSpec } from './sheets'

/** The orb is as wide as an icon. */
const RADIUS = ICON_SIZE / 2
/** The surface is 3 radii from the center to each side, room to stretch. */
const SPAN = 6
/** The pointer is on the orb within this many radii of its center. */
const HIT = 1.15
/** A press that moves less than this, in CSS pixels, is a click. */
const CLICK_SLOP = 6

const VERTEX = /* glsl */ `
varying vec2 vUv;
varying vec3 vWorld;
void main() {
  vUv = uv;
  vec4 world = modelMatrix * vec4(position, 1.0);
  vWorld = world.xyz;
  gl_Position = projectionMatrix * viewMatrix * world;
}
`

const FRAGMENT = /* glsl */ `
varying vec2 vUv;
varying vec3 vWorld;
uniform vec2 uCenter;       // orb center, in radii
uniform float uSeed;
uniform float uDim;
uniform float uFogDensity;
uniform float uOpacity;
${SKY_GLSL}
${ORB_GLSL}
void main() {
  vec2 local = vec2(vUv.x - 0.5, 0.5 - vUv.y) * ${SPAN.toFixed(1)};
  vec2 p = local - uCenter;
  float aa = 1.5 * fwidth(p.x);
  // Fade the halo out before the border of the surface.
  vec2 border = (${(SPAN / 2).toFixed(1)} - abs(local)) / 0.5;
  float fade = clamp(min(border.x, border.y), 0.0, 1.0);
  vec4 orb = orbColor(p, aa, fade, orbHash(gl_FragCoord.xy + uSeed));
  if (orb.a * uOpacity <= 0.002) discard;

  // The fog and the dark of the world, as on the icons, on the straight
  // color; then premultiplied again.
  vec3 color = orb.rgb / orb.a;
  vec3 toPoint = vWorld - cameraPosition;
  float dist = length(toPoint);
  vec3 dir = toPoint / dist;
  float fog = 1.0 - exp(-uFogDensity * uFogDensity * dist * dist);
  color = mix(color, skyColor(dir), fog);
  color = mix(color, skyColor(dir) * 0.14, uDim);
  gl_FragColor = vec4(color * orb.a, orb.a) * uOpacity;
}
`

/** Reads a color token as sRGB from 0 to 1, through one canvas pixel. */
function tokenRgb(name: string): [number, number, number] {
  const value = getComputedStyle(document.documentElement)
    .getPropertyValue(name)
    .trim()
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = 1
  const context = canvas.getContext('2d', { willReadFrequently: true })
  if (!value || !context) return [0.06, 0.06, 0.07]
  context.fillStyle = value
  context.fillRect(0, 0, 1, 1)
  const [r = 0, g = 0, b = 0] = context.getImageData(0, 0, 1, 1).data
  return [r / 255, g / 255, b / 255]
}

/**
 * The page of the chat as the orb of the old site: a marble of light that
 * floats in the world and always faces the camera. Its edge is a ring of
 * springs. In the world, a hover makes it ripple and a click opens the
 * chat. With the chat open, it stays on the right and you can play with
 * it: press to squish it, drag to stretch it.
 */
export default function WorldOrb({
  sheet,
  index,
  reducedMotion,
  onOpen,
}: {
  sheet: SheetSpec
  index: number
  reducedMotion: boolean
  onOpen: (sheet: SheetSpec) => void
}) {
  const group = useRef<THREE.Group>(null)
  const surface = useRef<THREE.Mesh>(null)
  const camera = useThree((state) => state.camera)
  const body = useMemo(() => new OrbBody(), [])
  const hovered = useRef(false)
  const press = useRef<{ x: number; y: number; id: number } | null>(null)

  const material = useMemo(() => {
    const [r, g, b] = tokenRgb('--chrome')
    return new THREE.ShaderMaterial({
      vertexShader: VERTEX,
      fragmentShader: FRAGMENT,
      transparent: true,
      premultipliedAlpha: true,
      depthWrite: false,
      uniforms: {
        uEdge: { value: body.edges },
        uFlow: { value: 0 },
        uTwist: { value: 0 },
        uEnergy: { value: 0 },
        uTilt: { value: new THREE.Vector2() },
        uBase: { value: new THREE.Vector3(r, g, b) },
        uCenter: { value: new THREE.Vector2() },
        uSeed: { value: 0 },
        uDim: { value: 0 },
        uFogDensity: { value: FOG_DENSITY },
        uOpacity: { value: 1 },
      },
    })
  }, [body])

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

  /** True when the chat is open: the orb is a toy, not a link. */
  const isOpen = () =>
    getWorld().target === sheet.id &&
    getWorld().phase === 'inside' &&
    material.uniforms.uOpacity.value > 0.5

  useFrame((state, delta) => {
    const g = group.current
    const mesh = surface.current
    if (!g || !mesh) return
    const focused = focus.id === sheet.id
    const t = state.clock.elapsedTime
    if (focused || reducedMotion) {
      g.position.y = THREE.MathUtils.damp(g.position.y, sheet.y, 4, delta)
    } else {
      g.position.y = sheet.y + Math.sin(t * 0.7 + index) * 0.12
    }
    // A sphere looks the same from every side: the surface faces the camera.
    mesh.quaternion.copy(camera.quaternion)

    if (reducedMotion) body.updateEdges()
    else body.advance(delta)
    const u = material.uniforms
    u.uFlow.value = body.phase.flow
    u.uTwist.value = body.phase.twist
    u.uEnergy.value = body.energy
    ;(u.uTilt.value as THREE.Vector2).set(body.tilt.x, body.tilt.y)
    ;(u.uCenter.value as THREE.Vector2).set(body.center.x, body.center.y)
    u.uSeed.value = (performance.now() % 1000) / 7.3
    // Only the page in focus stays lit while the world goes dark.
    u.uDim.value = focused ? 0 : WORLD_UNIFORMS.uDim.value
    // On a phone, the orb fades as the text scrolls up over it.
    u.uOpacity.value = THREE.MathUtils.damp(
      u.uOpacity.value,
      focused && getWorld().phase === 'inside'
        ? iconScrollShow(state.size.width / state.size.height)
        : 1,
      10,
      delta,
    )
    shadow.opacity = 1 - WORLD_UNIFORMS.uDim.value
  })

  /** A point in the world, on the surface, in radii from the orb center. */
  const toOrb = (point: THREE.Vector3) => {
    const local = surface.current!.worldToLocal(point.clone())
    return { x: local.x / RADIUS, y: -local.y / RADIUS }
  }

  /** Where the pointer ray meets the surface, also off the surface. */
  const plane = useMemo(() => new THREE.Plane(), [])
  const hit = useMemo(() => new THREE.Vector3(), [])
  const onSurface = (event: ThreeEvent<PointerEvent>) => {
    const mesh = surface.current!
    const normal = new THREE.Vector3(0, 0, 1).applyQuaternion(mesh.quaternion)
    plane.setFromNormalAndCoplanarPoint(
      normal,
      mesh.getWorldPosition(new THREE.Vector3()),
    )
    return event.ray.intersectPlane(plane, hit) ? toOrb(hit) : null
  }

  const setHover = (on: boolean) => {
    if (hovered.current === on) return
    hovered.current = on
    document.body.style.cursor = on ? 'pointer' : ''
    if (getWorld().phase !== 'roam') return
    if (on) {
      setWorld({ hover: sheet.id })
      play('hover')
    } else if (getWorld().hover === sheet.id) {
      setWorld({ hover: null })
    }
  }

  const move = (event: ThreeEvent<PointerEvent>) => {
    const at = onSurface(event)
    if (!at) return
    const inside = Math.hypot(at.x, at.y) < HIT
    const { phase } = getWorld()
    if (phase === 'roam' || isOpen() || press.current) {
      setHover(inside || press.current !== null)
    }
    if (reducedMotion) return
    if (
      press.current &&
      !body.drag.moved &&
      Math.hypot(
        event.nativeEvent.clientX - press.current.x,
        event.nativeEvent.clientY - press.current.y,
      ) > CLICK_SLOP
    ) {
      body.stretch()
    }
    body.hover(at.x, at.y)
    if (inside || press.current) event.stopPropagation()
  }

  const down = (event: ThreeEvent<PointerEvent>) => {
    if (event.button !== 0 || !isOpen()) return
    const at = onSurface(event)
    if (!at || Math.hypot(at.x, at.y) > HIT) return
    event.stopPropagation()
    ;(event.target as Element).setPointerCapture(event.pointerId)
    press.current = {
      x: event.nativeEvent.clientX,
      y: event.nativeEvent.clientY,
      id: event.pointerId,
    }
    if (!reducedMotion) body.grab(at.x, at.y)
    play('click')
  }

  const up = (event: ThreeEvent<PointerEvent>) => {
    if (!press.current) return
    event.stopPropagation()
    const target = event.target as Element
    if (target.hasPointerCapture(press.current.id)) {
      target.releasePointerCapture(press.current.id)
    }
    press.current = null
    body.release()
    const at = onSurface(event)
    if (!at || Math.hypot(at.x, at.y) > HIT) setHover(false)
  }

  const click = (event: ThreeEvent<MouseEvent>) => {
    if (getWorld().phase !== 'roam' || event.delta > 6) return
    const at = toOrb(event.point)
    if (Math.hypot(at.x, at.y) > HIT) return
    event.stopPropagation()
    setHover(false)
    onOpen(sheet)
  }

  return (
    <>
      <group ref={group} position={[sheet.x, sheet.y, sheet.z]}>
        <mesh
          ref={surface}
          material={material}
          renderOrder={2}
          onPointerMove={move}
          onPointerDown={down}
          onPointerUp={up}
          onPointerCancel={up}
          onPointerOut={() => {
            if (!press.current) setHover(false)
            body.leave()
          }}
          onClick={click}
        >
          <planeGeometry args={[RADIUS * SPAN, RADIUS * SPAN]} />
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
