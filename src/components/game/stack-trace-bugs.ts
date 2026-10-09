import * as THREE from 'three'
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js'

// Procedural insect models for Stack Trace. Every model faces local +Z and
// uses local +Y as "up", so Object3D.lookAt and surface-aligned bases both
// work without extra corrections. Shapes come from Three.js primitives so
// the game has no model files to download.

const Y_AXIS = new THREE.Vector3(0, 1, 0)
const BODY_COLOR = '#0d0e12'

type BugMaterials = {
  skin: THREE.MeshStandardMaterial
  glow: THREE.MeshBasicMaterial
  wire: THREE.MeshBasicMaterial
}

export type BugAnimationState = {
  // 0..1 wind-up before a shot. The bug shows it with open mandibles and
  // brighter eyes so the player can react.
  charge: number
  // 0..1 hit flash. It decays in the animation step.
  flash: number
  // Walk or flight cycle phase in radians.
  phase: number
  // Normalized move speed (0 = still, 1 = full speed).
  stride: number
  // Seconds since death. Negative while the bug is alive.
  dying: number
}

export type CrawlerVisual = {
  kind: 'crawler'
  group: THREE.Group
  body: THREE.Group
  head: THREE.Group
  mouth: THREE.Object3D
  mandibles: Array<THREE.Object3D>
  antennae: Array<THREE.Object3D>
  legs: Array<{ pivot: THREE.Object3D; side: 1 | -1; set: 0 | 1 }>
  materials: BugMaterials
  abdomen: THREE.MeshStandardMaterial
  state: BugAnimationState
}

export type WispVisual = {
  kind: 'wisp'
  group: THREE.Group
  body: THREE.Group
  head: THREE.Group
  mouth: THREE.Object3D
  wings: Array<{ pivot: THREE.Object3D; side: 1 | -1 }>
  lantern: THREE.Mesh
  materials: BugMaterials
  state: BugAnimationState
}

export type BugVisual = CrawlerVisual | WispVisual

export type CentipedeSegment = {
  group: THREE.Group
  legs: THREE.Object3D
  // Each segment owns its materials, so a shed segment can fade out
  // without fading the rest of the body.
  skin: THREE.MeshStandardMaterial
  alive: boolean
}

export type CentipedeVisual = {
  group: THREE.Group
  head: THREE.Group
  mouth: THREE.Object3D
  mandibles: Array<THREE.Object3D>
  antennae: Array<THREE.Object3D>
  segments: Array<CentipedeSegment>
  materials: BugMaterials
  state: BugAnimationState
}

function createMaterials(color: string): BugMaterials {
  return {
    skin: new THREE.MeshStandardMaterial({
      color: BODY_COLOR,
      emissive: color,
      emissiveIntensity: 0.1,
      metalness: 0.45,
      roughness: 0.38,
      flatShading: true,
    }),
    glow: new THREE.MeshBasicMaterial({ color, toneMapped: false }),
    wire: new THREE.MeshBasicMaterial({
      color,
      wireframe: true,
      transparent: true,
      opacity: 0.5,
      toneMapped: false,
    }),
  }
}

function createState(): BugAnimationState {
  return { charge: 0, flash: 0, phase: 0, stride: 0, dying: -1 }
}

function ellipsoid(
  material: THREE.Material,
  scale: readonly [number, number, number],
  position: readonly [number, number, number],
  detail = 10,
) {
  const mesh = new THREE.Mesh(
    new THREE.SphereGeometry(1, detail, Math.max(6, detail - 2)),
    material,
  )
  mesh.scale.set(...scale)
  mesh.position.set(...position)
  return mesh
}

// A tapered cylinder from `start` to `end`, baked into geometry so several
// limb parts can merge into one draw call.
function limbGeometry(
  start: THREE.Vector3,
  end: THREE.Vector3,
  radiusStart: number,
  radiusEnd: number,
) {
  const direction = end.clone().sub(start)
  const length = direction.length()
  const geometry = new THREE.CylinderGeometry(radiusEnd, radiusStart, length, 5)
  geometry.translate(0, length / 2, 0)
  geometry.applyQuaternion(
    new THREE.Quaternion().setFromUnitVectors(Y_AXIS, direction.normalize()),
  )
  geometry.translate(start.x, start.y, start.z)
  return geometry
}

function merged(geometries: Array<THREE.BufferGeometry>) {
  const geometry = mergeGeometries(geometries, false)
  geometries.forEach((part) => part.dispose())
  if (!geometry) throw new Error('Stack Trace could not build a bug limb')
  return geometry
}

// A jointed leg that points along +X (side = 1) or -X (side = -1) and ends
// `reach` units below its pivot.
function legGeometry(side: 1 | -1, span: number, reach: number, radius = 0.04) {
  const knee = new THREE.Vector3(side * span * 0.55, reach * 0.55, 0)
  const foot = new THREE.Vector3(side * span, -reach, 0)
  return merged([
    limbGeometry(new THREE.Vector3(), knee, radius, radius * 0.8),
    limbGeometry(knee, foot, radius * 0.8, radius * 0.3),
  ])
}

function eyePairGeometry(radius: number, spread: number, height: number) {
  const left = new THREE.SphereGeometry(radius, 8, 6)
  left.translate(-spread, height, 0)
  const right = new THREE.SphereGeometry(radius, 8, 6)
  right.translate(spread, height, 0)
  return merged([left, right])
}

function mandible(
  material: THREE.Material,
  side: 1 | -1,
  length: number,
  radius: number,
) {
  const pivot = new THREE.Group()
  const geometry = new THREE.ConeGeometry(radius, length, 5)
  geometry.translate(0, length / 2, 0)
  geometry.rotateX(Math.PI / 2)
  // Curve the tip inward a little so the pair reads as pincers.
  geometry.rotateY(-side * 0.35)
  pivot.add(new THREE.Mesh(geometry, material))
  return pivot
}

function antenna(material: THREE.Material, length: number) {
  const pivot = new THREE.Group()
  const base = new THREE.Vector3()
  const bend = new THREE.Vector3(0, length * 0.6, length * 0.1)
  const tip = new THREE.Vector3(0, length, length * 0.35)
  pivot.add(
    new THREE.Mesh(
      merged([
        limbGeometry(base, bend, 0.018, 0.014),
        limbGeometry(bend, tip, 0.014, 0.008),
      ]),
      material,
    ),
  )
  return pivot
}

export function createCrawlerVisual(color = '#ff694a'): CrawlerVisual {
  const materials = createMaterials(color)
  const abdomen = materials.skin.clone()
  const group = new THREE.Group()
  group.name = 'Crawler bug'
  const body = new THREE.Group()
  group.add(body)

  body.add(
    ellipsoid(abdomen, [0.5, 0.36, 0.72], [0, 0.06, -0.62]),
    ellipsoid(materials.wire, [0.55, 0.41, 0.77], [0, 0.06, -0.62], 6),
    ellipsoid(materials.skin, [0.36, 0.27, 0.38], [0, 0, 0.04]),
  )

  const head = new THREE.Group()
  head.position.set(0, 0.02, 0.42)
  head.add(ellipsoid(materials.skin, [0.27, 0.22, 0.24], [0, 0, 0.06]))
  const eyes = new THREE.Mesh(eyePairGeometry(0.07, 0.13, 0.08), materials.glow)
  eyes.position.z = 0.2
  head.add(eyes)
  const mandibles = ([-1, 1] as const).map((side) => {
    const pivot = mandible(materials.skin, side, 0.32, 0.05)
    pivot.position.set(side * 0.1, -0.08, 0.22)
    head.add(pivot)
    return pivot
  })
  const antennae = ([-1, 1] as const).map((side) => {
    const pivot = antenna(materials.skin, 0.6)
    pivot.position.set(side * 0.09, 0.15, 0.14)
    pivot.rotation.set(0.75, 0, side * -0.4)
    head.add(pivot)
    return pivot
  })
  const mouth = new THREE.Object3D()
  mouth.position.set(0, -0.04, 0.45)
  head.add(mouth)
  body.add(head)

  const legGeometries = {
    [1]: legGeometry(1, 0.78, 0.44),
    [-1]: legGeometry(-1, 0.78, 0.44),
  } as const
  const legs: CrawlerVisual['legs'] = []
  ;[0.2, 0.02, -0.18].forEach((z, row) => {
    ;([-1, 1] as const).forEach((side) => {
      const pivot = new THREE.Group()
      pivot.position.set(side * 0.26, -0.04, z)
      // Front legs reach forward, back legs reach back.
      pivot.rotation.y = side * (row - 1) * 0.45
      pivot.userData.baseYaw = pivot.rotation.y
      pivot.add(new THREE.Mesh(legGeometries[side], materials.skin))
      body.add(pivot)
      // Tripod gait: front-right, middle-left, and back-right move together.
      const set = ((row + (side === 1 ? 0 : 1)) % 2) as 0 | 1
      legs.push({ pivot, side, set })
    })
  })

  return {
    kind: 'crawler',
    group,
    body,
    head,
    mouth,
    mandibles,
    antennae,
    legs,
    materials,
    abdomen,
    state: createState(),
  }
}

export function createWispVisual(color = '#d9ff43'): WispVisual {
  const materials = createMaterials(color)
  const group = new THREE.Group()
  group.name = 'Wisp bug'
  const body = new THREE.Group()
  group.add(body)

  body.add(
    ellipsoid(materials.skin, [0.2, 0.18, 0.25], [0, 0, 0]),
    ellipsoid(materials.skin, [0.15, 0.14, 0.48], [0, -0.03, -0.5]),
  )
  const lantern = ellipsoid(
    materials.glow,
    [0.17, 0.16, 0.2],
    [0, -0.05, -0.98],
  )
  body.add(lantern)

  const head = new THREE.Group()
  head.position.set(0, 0.02, 0.28)
  head.add(ellipsoid(materials.skin, [0.14, 0.13, 0.13], [0, 0, 0]))
  const eyes = new THREE.Mesh(
    eyePairGeometry(0.045, 0.085, 0.03),
    materials.glow,
  )
  eyes.position.z = 0.05
  head.add(eyes)
  const proboscis = new THREE.Mesh(
    (() => {
      const geometry = new THREE.ConeGeometry(0.025, 0.5, 5)
      geometry.translate(0, 0.25, 0)
      geometry.rotateX(Math.PI / 2)
      return geometry
    })(),
    materials.skin,
  )
  proboscis.position.set(0, -0.04, 0.1)
  head.add(proboscis)
  const mouth = new THREE.Object3D()
  mouth.position.set(0, -0.04, 0.6)
  head.add(mouth)
  body.add(head)

  // Dangling legs, merged into one mesh.
  const legParts: Array<THREE.BufferGeometry> = []
  ;([-1, 1] as const).forEach((side) => {
    ;[0.08, -0.08].forEach((z) => {
      const start = new THREE.Vector3(side * 0.1, -0.12, z)
      const knee = new THREE.Vector3(side * 0.22, -0.32, z - 0.05)
      const foot = new THREE.Vector3(side * 0.2, -0.6, z - 0.22)
      legParts.push(limbGeometry(start, knee, 0.018, 0.014))
      legParts.push(limbGeometry(knee, foot, 0.014, 0.006))
    })
  })
  body.add(new THREE.Mesh(merged(legParts), materials.skin))

  const wingMaterial = new THREE.MeshBasicMaterial({
    color,
    transparent: true,
    opacity: 0.3,
    side: THREE.DoubleSide,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    toneMapped: false,
  })
  const wingEdgeMaterial = new THREE.LineBasicMaterial({
    color,
    transparent: true,
    opacity: 0.7,
    toneMapped: false,
  })
  const wings: WispVisual['wings'] = []
  ;([-1, 1] as const).forEach((side) => {
    ;[0, 1].forEach((pair) => {
      const length = pair === 0 ? 0.9 : 0.7
      const geometry = new THREE.CircleGeometry(1, 18)
      geometry.scale(length / 2, 0.16, 1)
      geometry.rotateX(-Math.PI / 2)
      geometry.translate((side * length) / 2, 0, 0)
      const pivot = new THREE.Group()
      pivot.position.set(side * 0.08, 0.14, pair === 0 ? 0.05 : -0.08)
      pivot.rotation.y = side * (pair === 0 ? -0.25 : -0.6)
      pivot.add(new THREE.Mesh(geometry, wingMaterial))
      pivot.add(
        new THREE.LineSegments(
          new THREE.EdgesGeometry(geometry, 1),
          wingEdgeMaterial,
        ),
      )
      body.add(pivot)
      wings.push({ pivot, side })
    })
  })

  return {
    kind: 'wisp',
    group,
    body,
    head,
    mouth,
    wings,
    lantern,
    materials,
    state: createState(),
  }
}

export function createBugVisual(kind: 'crawler' | 'wisp', color: string) {
  return kind === 'crawler'
    ? createCrawlerVisual(color)
    : createWispVisual(color)
}

export const CENTIPEDE_SEGMENTS = 8

export function createCentipedeVisual(): CentipedeVisual {
  const materials = createMaterials('#8da4ff')
  const accent = new THREE.MeshBasicMaterial({
    color: '#ff694a',
    toneMapped: false,
  })
  const group = new THREE.Group()
  group.name = 'Root bug'

  const head = new THREE.Group()
  head.add(
    ellipsoid(materials.skin, [0.95, 0.72, 1], [0, 0, 0], 12),
    ellipsoid(materials.wire, [1.02, 0.79, 1.07], [0, 0, 0], 7),
  )
  const eyes = new THREE.Mesh(eyePairGeometry(0.16, 0.42, 0.22), accent)
  eyes.position.z = 0.72
  head.add(eyes)
  const eyesSmall = new THREE.Mesh(eyePairGeometry(0.09, 0.62, 0.02), accent)
  eyesSmall.position.z = 0.62
  head.add(eyesSmall)
  const mandibles = ([-1, 1] as const).map((side) => {
    const pivot = mandible(materials.skin, side, 1.05, 0.15)
    pivot.position.set(side * 0.38, -0.32, 0.72)
    head.add(pivot)
    return pivot
  })
  const antennae = ([-1, 1] as const).map((side) => {
    const pivot = antenna(materials.skin, 1.9)
    pivot.scale.setScalar(1.6)
    pivot.position.set(side * 0.32, 0.5, 0.55)
    pivot.rotation.set(0.6, 0, side * -0.5)
    head.add(pivot)
    return pivot
  })
  const mouth = new THREE.Object3D()
  mouth.position.set(0, -0.3, 1.25)
  head.add(mouth)
  group.add(head)

  const ringGeometry = new THREE.TorusGeometry(1, 0.06, 5, 20)
  const segments = Array.from({ length: CENTIPEDE_SEGMENTS }, (_, index) => {
    const size = 1 - index * 0.06
    const segment = new THREE.Group()
    segment.scale.setScalar(size)
    const skin = materials.skin.clone()
    segment.add(
      ellipsoid(skin, [0.78, 0.58, 0.58], [0, 0, 0]),
      ellipsoid(materials.wire.clone(), [0.84, 0.64, 0.64], [0, 0, 0], 6),
    )
    const ring = new THREE.Mesh(ringGeometry, materials.glow.clone())
    ring.scale.set(0.8, 0.6, 1)
    segment.add(ring)
    const legs = new THREE.Mesh(
      merged([
        legGeometry(1, 1.5, 0.75, 0.07),
        legGeometry(-1, 1.5, 0.75, 0.07),
      ]),
      skin,
    )
    legs.position.y = -0.15
    segment.add(legs)
    group.add(segment)
    return { group: segment, legs, skin, alive: true }
  })

  return {
    group,
    head,
    mouth,
    mandibles,
    antennae,
    segments,
    materials,
    state: createState(),
  }
}

function applyFlash(
  materials: BugMaterials,
  state: BugAnimationState,
  delta: number,
  base = 0.1,
) {
  state.flash = Math.max(0, state.flash - delta * 6)
  materials.skin.emissiveIntensity =
    base + state.flash * 2.4 + state.charge * 0.25
}

export function animateCrawler(
  visual: CrawlerVisual,
  time: number,
  delta: number,
) {
  const { state } = visual
  applyFlash(visual.materials, state, delta)
  visual.abdomen.emissiveIntensity =
    0.2 + state.flash * 2.4 + state.charge * 1.6 + Math.sin(time * 3) * 0.05

  const stride = state.stride
  visual.legs.forEach(({ pivot, side, set }) => {
    const phase = state.phase + set * Math.PI
    const baseYaw = pivot.userData.baseYaw as number
    pivot.rotation.y = baseYaw + Math.sin(phase) * 0.42 * stride * side
    pivot.rotation.z = side * Math.max(0, Math.cos(phase)) * 0.38 * stride
  })
  visual.body.position.y = Math.abs(Math.sin(state.phase)) * 0.03 * stride

  const open = 0.2 + state.charge * 0.75
  visual.mandibles.forEach((pivot, index) => {
    const side = index === 0 ? -1 : 1
    pivot.rotation.y = side * (open + Math.sin(time * 9 + index) * 0.06)
  })
  visual.antennae.forEach((pivot, index) => {
    pivot.rotation.x = 0.75 + Math.sin(time * 4.2 + index * 1.7) * 0.18
    pivot.rotation.y = Math.sin(time * 2.6 + index) * 0.2
  })
}

export function animateWisp(visual: WispVisual, time: number, delta: number) {
  const { state } = visual
  applyFlash(visual.materials, state, delta)
  const beat = time * 42 + state.phase
  visual.wings.forEach(({ pivot, side }, index) => {
    pivot.rotation.z = side * (Math.sin(beat + index * 0.6) * 0.75 + 0.15)
  })
  const glow =
    0.9 + Math.sin(time * 5 + state.phase) * 0.12 + state.charge * 0.7
  visual.lantern.scale.set(0.17 * glow, 0.16 * glow, 0.2 * glow)
  visual.body.position.y = Math.sin(time * 3.1 + state.phase) * 0.05
  visual.body.rotation.x = Math.sin(time * 2.2 + state.phase) * 0.08
}

export function animateCentipede(
  visual: CentipedeVisual,
  time: number,
  delta: number,
) {
  const { state } = visual
  applyFlash(visual.materials, state, delta, 0.14)
  const open = 0.15 + state.charge * 0.8
  visual.mandibles.forEach((pivot, index) => {
    const side = index === 0 ? -1 : 1
    pivot.rotation.y = side * (open + Math.sin(time * 6 + index) * 0.08)
  })
  visual.antennae.forEach((pivot, index) => {
    pivot.rotation.x = 0.6 + Math.sin(time * 2.4 + index * 1.3) * 0.22
  })
  visual.segments.forEach((segment, index) => {
    // Segments flash and glow with the head.
    segment.skin.emissiveIntensity = visual.materials.skin.emissiveIntensity
    segment.legs.rotation.z = Math.sin(time * 9 - index * 0.9) * 0.28
    segment.legs.rotation.y = Math.cos(time * 9 - index * 0.9) * 0.18
  })
}

export function animateBug(visual: BugVisual, time: number, delta: number) {
  if (visual.kind === 'crawler') animateCrawler(visual, time, delta)
  else animateWisp(visual, time, delta)
}

// Crawlers walk on the inside faces of their room. A face is an axis-aligned
// plane with an inward normal; tunnel openings sit at face centres, so the
// walker steers around them.
export type CrawlerRoom = {
  bounds: THREE.Box3
  openings: Array<THREE.Vector3>
}

export type CrawlerWalker = {
  room: CrawlerRoom
  contact: THREE.Vector3
  normal: THREE.Vector3
  target: THREE.Vector3
  nextNormal: THREE.Vector3 | null
  heading: THREE.Vector3
}

const OPENING_CLEARANCE = 3.6
const FACE_MARGIN = 0.7
const AXES = ['x', 'y', 'z'] as const
type Axis = (typeof AXES)[number]

function normalAxis(normal: THREE.Vector3): Axis {
  if (Math.abs(normal.x) > 0.5) return 'x'
  if (Math.abs(normal.y) > 0.5) return 'y'
  return 'z'
}

function planeCoordinate(room: CrawlerRoom, normal: THREE.Vector3) {
  const axis = normalAxis(normal)
  // An inward +axis normal means the face sits on the minimum side.
  return normal[axis] > 0 ? room.bounds.min[axis] : room.bounds.max[axis]
}

function segmentClearsOpenings(
  room: CrawlerRoom,
  from: THREE.Vector3,
  to: THREE.Vector3,
) {
  const line = new THREE.Line3(from, to)
  const closest = new THREE.Vector3()
  return room.openings.every((opening) => {
    line.closestPointToPoint(opening, true, closest)
    return closest.distanceTo(opening) > OPENING_CLEARANCE
  })
}

function randomOnFace(
  room: CrawlerRoom,
  normal: THREE.Vector3,
  out: THREE.Vector3,
  bias?: THREE.Vector3,
) {
  const axis = normalAxis(normal)
  AXES.forEach((other) => {
    if (other === axis) return
    const min = room.bounds.min[other] + FACE_MARGIN
    const max = room.bounds.max[other] - FACE_MARGIN
    const value = bias
      ? bias[other] + (Math.random() - 0.5) * 4
      : THREE.MathUtils.lerp(min, max, Math.random())
    out[other] = THREE.MathUtils.clamp(value, min, max)
  })
  out[axis] = planeCoordinate(room, normal)
  return out
}

export function createCrawlerWalker(
  room: CrawlerRoom,
  home: THREE.Vector3,
): CrawlerWalker {
  const walker: CrawlerWalker = {
    room,
    contact: new THREE.Vector3(),
    normal: new THREE.Vector3(0, 1, 0),
    target: new THREE.Vector3(),
    nextNormal: null,
    heading: new THREE.Vector3(0, 0, 1),
  }
  resetCrawlerWalker(walker, home)
  return walker
}

export function resetCrawlerWalker(walker: CrawlerWalker, home: THREE.Vector3) {
  // Start on the face nearest to the authored spawn point.
  let best = Infinity
  AXES.forEach((axis) => {
    ;([1, -1] as const).forEach((sign) => {
      const normal = new THREE.Vector3()
      normal[axis] = sign
      const distance = Math.abs(
        home[axis] - planeCoordinate(walker.room, normal),
      )
      if (distance >= best) return
      best = distance
      walker.normal.copy(normal)
    })
  })
  walker.contact.copy(home)
  walker.contact[normalAxis(walker.normal)] = planeCoordinate(
    walker.room,
    walker.normal,
  )
  walker.target.copy(walker.contact)
  walker.nextNormal = null
  walker.heading.set(0, 0, 1)
  if (normalAxis(walker.normal) === 'z') walker.heading.set(1, 0, 0)
}

function pickCrawlerTarget(walker: CrawlerWalker, player: THREE.Vector3) {
  const candidate = new THREE.Vector3()
  const axis = normalAxis(walker.normal)

  // Sometimes walk over an edge onto a neighbouring face.
  if (Math.random() < 0.35) {
    const others = AXES.filter((other) => other !== axis)
    const edgeAxis = others[Math.floor(Math.random() * others.length)] ?? 'x'
    const sign = Math.random() < 0.5 ? 1 : -1
    const nextNormal = new THREE.Vector3()
    nextNormal[edgeAxis] = sign
    for (let attempt = 0; attempt < 6; attempt += 1) {
      randomOnFace(walker.room, walker.normal, candidate)
      candidate[edgeAxis] = planeCoordinate(walker.room, nextNormal)
      if (!segmentClearsOpenings(walker.room, walker.contact, candidate)) {
        continue
      }
      walker.target.copy(candidate)
      walker.nextNormal = nextNormal
      return
    }
  }

  // Otherwise stalk the player's projection on this face.
  for (let attempt = 0; attempt < 10; attempt += 1) {
    randomOnFace(
      walker.room,
      walker.normal,
      candidate,
      attempt < 5 ? player : undefined,
    )
    if (candidate.distanceTo(walker.contact) < 1.2) continue
    if (!segmentClearsOpenings(walker.room, walker.contact, candidate)) continue
    walker.target.copy(candidate)
    walker.nextNormal = null
    return
  }
  walker.target.copy(walker.contact)
  walker.nextNormal = null
}

const walkStep = new THREE.Vector3()

// Moves the walker along its face. Returns the distance it moved.
export function stepCrawlerWalker(
  walker: CrawlerWalker,
  player: THREE.Vector3,
  speed: number,
  delta: number,
) {
  walkStep.copy(walker.target).sub(walker.contact)
  const remaining = walkStep.length()
  if (remaining < 0.12) {
    if (walker.nextNormal) {
      walker.normal.copy(walker.nextNormal)
      walker.nextNormal = null
    }
    pickCrawlerTarget(walker, player)
    return 0
  }
  const distance = Math.min(remaining, speed * delta)
  walkStep.multiplyScalar(1 / remaining)
  walker.contact.addScaledVector(walkStep, distance)
  walker.heading.lerp(walkStep, 1 - Math.exp(-8 * delta)).normalize()
  return distance
}

const basisX = new THREE.Vector3()
const basisZ = new THREE.Vector3()
const basisMatrix = new THREE.Matrix4()
const basisQuaternion = new THREE.Quaternion()

// Builds a +Y = up, +Z = forward orientation and eases `object` toward it.
export function easeToBasis(
  object: THREE.Object3D,
  up: THREE.Vector3,
  forward: THREE.Vector3,
  rate: number,
  delta: number,
) {
  basisZ.copy(forward).addScaledVector(up, -forward.dot(up))
  if (basisZ.lengthSq() < 1e-6) {
    basisZ.set(1, 0, 0).addScaledVector(up, -up.x)
    if (basisZ.lengthSq() < 1e-6) basisZ.set(0, 0, 1)
  }
  basisZ.normalize()
  basisX.crossVectors(up, basisZ).normalize()
  basisMatrix.makeBasis(basisX, up, basisZ)
  basisQuaternion.setFromRotationMatrix(basisMatrix)
  object.quaternion.slerp(basisQuaternion, 1 - Math.exp(-rate * delta))
}
