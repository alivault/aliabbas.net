import * as THREE from 'three'
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js'

export type RoomId =
  | 'surface'
  | 'interface'
  | 'ui-fault'
  | 'application'
  | 'state-fault'
  | 'data'
  | 'data-fault'
  | 'deploy'

type RoomTheme = 'surface' | 'interface' | 'application' | 'data' | 'deploy'
type VectorTuple = readonly [number, number, number]
type RoomMaterials = {
  chamber: THREE.Material
  tunnel: THREE.Material
  line: THREE.Material
}

export type RoomSpec = {
  id: RoomId
  label: string
  frame: string
  center: VectorTuple
  size: VectorTuple
  theme: RoomTheme
}

type ConnectionSpec = readonly [RoomId, RoomId]

export type FaultSpec = {
  id: string
  roomId: RoomId
  frame: string
  label: string
  position: VectorTuple
}

export type EnemySpec = {
  id: string
  roomId: RoomId
  kind: 'crawler' | 'wisp'
  position: VectorTuple
}

export type LevelDoor = {
  group: THREE.Group
  bounds: THREE.Box3
}

export type LevelWorld = {
  group: THREE.Group
  rooms: Map<RoomId, RoomSpec>
  graph: Map<RoomId, Array<RoomId>>
  volumes: Array<
    | { kind: 'box'; bounds: THREE.Box3 }
    | {
        kind: 'tube'
        axis: 'x' | 'y' | 'z'
        center: THREE.Vector3
        min: number
        max: number
        radius: number
      }
  >
  door: LevelDoor
}

const JUNCTION_SIZE = 10
const OPENING_SIZE = 6
const TUNNEL_RADIUS = OPENING_SIZE / 2
const TUNNEL_SEGMENTS = 64
const WALL_THICKNESS = 0.24

const themeColors = {
  surface: { wall: '#242a40', chamber: '#292d42', accent: '#f1efe8' },
  interface: { wall: '#111a39', chamber: '#172b64', accent: '#335cff' },
  application: { wall: '#172016', chamber: '#2b3926', accent: '#d9ff43' },
  data: { wall: '#291716', chamber: '#502720', accent: '#ff694a' },
  deploy: { wall: '#171426', chamber: '#302752', accent: '#8da4ff' },
} as const satisfies Record<
  RoomTheme,
  { wall: string; chamber: string; accent: string }
>

export const rooms = [
  {
    id: 'surface',
    label: 'Surface entry',
    frame: '/surface',
    center: [0, 0, 0],
    size: [18, 12, 18],
    theme: 'surface',
  },
  {
    id: 'interface',
    label: 'Interface deck',
    frame: '/ui',
    center: [0, 0, -28],
    size: [16, 14, 16],
    theme: 'interface',
  },
  {
    id: 'ui-fault',
    label: 'Interaction fault',
    frame: '/ui/interaction',
    center: [-24, 0, -28],
    size: [14, 14, 14],
    theme: 'interface',
  },
  {
    id: 'application',
    label: 'Application core',
    frame: '/app',
    center: [0, -24, -28],
    size: [16, 14, 16],
    theme: 'application',
  },
  {
    id: 'state-fault',
    label: 'State fault',
    frame: '/app/state',
    center: [24, -24, -28],
    size: [14, 14, 14],
    theme: 'application',
  },
  {
    id: 'data',
    label: 'Data vault',
    frame: '/data',
    center: [0, -24, -56],
    size: [16, 16, 16],
    theme: 'data',
  },
  {
    id: 'data-fault',
    label: 'Session fault',
    frame: '/data/session',
    center: [-24, -24, -56],
    size: [14, 14, 14],
    theme: 'data',
  },
  {
    id: 'deploy',
    label: 'Deployment core',
    frame: '/deploy/core',
    center: [0, -48, -56],
    size: [24, 18, 20],
    theme: 'deploy',
  },
] as const satisfies ReadonlyArray<RoomSpec>

export const connections = [
  ['surface', 'interface'],
  ['interface', 'ui-fault'],
  ['interface', 'application'],
  ['application', 'state-fault'],
  ['application', 'data'],
  ['data', 'data-fault'],
  ['data', 'deploy'],
] as const satisfies ReadonlyArray<ConnectionSpec>

export const faultSpecs = [
  {
    id: 'interaction-fault',
    roomId: 'ui-fault',
    frame: '/ui/interaction',
    label: 'Interaction fault',
    position: [-24, 0, -30],
  },
  {
    id: 'state-fault',
    roomId: 'state-fault',
    frame: '/app/state',
    label: 'State fault',
    position: [24, -24, -30],
  },
  {
    id: 'session-fault',
    roomId: 'data-fault',
    frame: '/data/session',
    label: 'Session fault',
    position: [-24, -24, -58],
  },
] as const satisfies ReadonlyArray<FaultSpec>

export const enemySpecs = [
  {
    id: 'crawler-interface',
    roomId: 'interface',
    kind: 'crawler',
    position: [3, 2.5, -30],
  },
  {
    id: 'wisp-ui',
    roomId: 'ui-fault',
    kind: 'wisp',
    position: [-26, 2, -25],
  },
  {
    id: 'crawler-application',
    roomId: 'application',
    kind: 'crawler',
    position: [-3, -21, -31],
  },
  {
    id: 'wisp-state',
    roomId: 'state-fault',
    kind: 'wisp',
    position: [25, -22, -25],
  },
  {
    id: 'crawler-data',
    roomId: 'data',
    kind: 'crawler',
    position: [3, -21, -58],
  },
  {
    id: 'wisp-session',
    roomId: 'data-fault',
    kind: 'wisp',
    position: [-26, -22, -53],
  },
  {
    id: 'crawler-deploy',
    roomId: 'deploy',
    kind: 'crawler',
    position: [3, -46, -54],
  },
] as const satisfies ReadonlyArray<EnemySpec>

export const startPosition = new THREE.Vector3(0, 0, 4)
export const exitPosition = new THREE.Vector3(0, 0, 4)
export const rootPosition = new THREE.Vector3(0, -48, -57.5)

function vector(tuple: VectorTuple | readonly [number, number, number]) {
  return new THREE.Vector3(tuple[0], tuple[1], tuple[2])
}

function addBox(
  group: THREE.Group,
  size: VectorTuple,
  position: VectorTuple,
  material: THREE.Material,
) {
  if (size.some((dimension) => dimension <= 0)) return
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(...size), material)
  mesh.position.set(...position)
  group.add(mesh)
}

function addZWall(
  group: THREE.Group,
  room: RoomSpec,
  sign: -1 | 1,
  isOpen: boolean,
  material: THREE.Material,
) {
  const [width, height, depth] = room.size
  const z = sign * (depth / 2)
  if (!isOpen) {
    addBox(group, [width, height, WALL_THICKNESS], [0, 0, z], material)
    return
  }

  const sideWidth = (width - OPENING_SIZE) / 2
  const verticalHeight = (height - OPENING_SIZE) / 2
  addBox(
    group,
    [sideWidth, height, WALL_THICKNESS],
    [-(OPENING_SIZE / 2 + sideWidth / 2), 0, z],
    material,
  )
  addBox(
    group,
    [sideWidth, height, WALL_THICKNESS],
    [OPENING_SIZE / 2 + sideWidth / 2, 0, z],
    material,
  )
  addBox(
    group,
    [OPENING_SIZE, verticalHeight, WALL_THICKNESS],
    [0, -(OPENING_SIZE / 2 + verticalHeight / 2), z],
    material,
  )
  addBox(
    group,
    [OPENING_SIZE, verticalHeight, WALL_THICKNESS],
    [0, OPENING_SIZE / 2 + verticalHeight / 2, z],
    material,
  )
}

function addXWall(
  group: THREE.Group,
  room: RoomSpec,
  sign: -1 | 1,
  isOpen: boolean,
  material: THREE.Material,
) {
  const [width, height, depth] = room.size
  const x = sign * (width / 2)
  if (!isOpen) {
    addBox(group, [WALL_THICKNESS, height, depth], [x, 0, 0], material)
    return
  }

  const sideDepth = (depth - OPENING_SIZE) / 2
  const verticalHeight = (height - OPENING_SIZE) / 2
  addBox(
    group,
    [WALL_THICKNESS, height, sideDepth],
    [x, 0, -(OPENING_SIZE / 2 + sideDepth / 2)],
    material,
  )
  addBox(
    group,
    [WALL_THICKNESS, height, sideDepth],
    [x, 0, OPENING_SIZE / 2 + sideDepth / 2],
    material,
  )
  addBox(
    group,
    [WALL_THICKNESS, verticalHeight, OPENING_SIZE],
    [x, -(OPENING_SIZE / 2 + verticalHeight / 2), 0],
    material,
  )
  addBox(
    group,
    [WALL_THICKNESS, verticalHeight, OPENING_SIZE],
    [x, OPENING_SIZE / 2 + verticalHeight / 2, 0],
    material,
  )
}

function addYWall(
  group: THREE.Group,
  room: RoomSpec,
  sign: -1 | 1,
  isOpen: boolean,
  material: THREE.Material,
) {
  const [width, height, depth] = room.size
  const y = sign * (height / 2)
  if (!isOpen) {
    addBox(group, [width, WALL_THICKNESS, depth], [0, y, 0], material)
    return
  }

  const sideWidth = (width - OPENING_SIZE) / 2
  const sideDepth = (depth - OPENING_SIZE) / 2
  addBox(
    group,
    [sideWidth, WALL_THICKNESS, depth],
    [-(OPENING_SIZE / 2 + sideWidth / 2), y, 0],
    material,
  )
  addBox(
    group,
    [sideWidth, WALL_THICKNESS, depth],
    [OPENING_SIZE / 2 + sideWidth / 2, y, 0],
    material,
  )
  addBox(
    group,
    [OPENING_SIZE, WALL_THICKNESS, sideDepth],
    [0, y, -(OPENING_SIZE / 2 + sideDepth / 2)],
    material,
  )
  addBox(
    group,
    [OPENING_SIZE, WALL_THICKNESS, sideDepth],
    [0, y, OPENING_SIZE / 2 + sideDepth / 2],
    material,
  )
}

function directionBetween(from: RoomSpec, to: RoomSpec) {
  const fromCenter = vector(from.center)
  const toCenter = vector(to.center)
  const delta = toCenter.sub(fromCenter)
  if (Math.abs(delta.x) > 0) return delta.x > 0 ? 'x+' : 'x-'
  if (Math.abs(delta.y) > 0) return delta.y > 0 ? 'y+' : 'y-'
  return delta.z > 0 ? 'z+' : 'z-'
}

function addCircularOpeningWall(
  group: THREE.Group,
  axis: 'x' | 'y' | 'z',
  sign: -1 | 1,
  material: THREE.Material,
) {
  const half = JUNCTION_SIZE / 2
  const shape = new THREE.Shape()
  shape.moveTo(-half, -half)
  shape.lineTo(half, -half)
  shape.lineTo(half, half)
  shape.lineTo(-half, half)
  shape.closePath()
  const opening = new THREE.Path()
  opening.absarc(0, 0, TUNNEL_RADIUS, 0, Math.PI * 2, true)
  shape.holes.push(opening)

  const wall = new THREE.Mesh(
    new THREE.ShapeGeometry(shape, TUNNEL_SEGMENTS),
    material,
  )
  const face = sign * (half - WALL_THICKNESS / 2)
  if (axis === 'x') {
    wall.position.x = face
    wall.rotation.y = Math.PI / 2
  } else if (axis === 'y') {
    wall.position.y = face
    wall.rotation.x = Math.PI / 2
  } else {
    wall.position.z = face
  }
  group.add(wall)
}

function addChamberWall(
  group: THREE.Group,
  room: RoomSpec,
  axis: 'x' | 'y' | 'z',
  sign: -1 | 1,
  isOpen: boolean,
  material: THREE.Material,
) {
  if (isOpen) {
    addCircularOpeningWall(group, axis, sign, material)
  } else if (axis === 'x') {
    addXWall(group, room, sign, false, material)
  } else if (axis === 'y') {
    addYWall(group, room, sign, false, material)
  } else {
    addZWall(group, room, sign, false, material)
  }
}

function addChamberGrid(
  group: THREE.Group,
  axis: 'x' | 'y' | 'z',
  sign: -1 | 1,
  isOpen: boolean,
  material: THREE.Material,
) {
  const half = JUNCTION_SIZE / 2
  const face = sign * (half - WALL_THICKNESS / 2 - 0.012)
  const positions: Array<number> = []
  const point = (u: number, v: number): VectorTuple => {
    if (axis === 'x') return [face, u, v]
    if (axis === 'y') return [u, face, v]
    return [u, v, face]
  }
  const segment = (u1: number, v1: number, u2: number, v2: number) => {
    positions.push(...point(u1, v1), ...point(u2, v2))
  }
  const gridCoordinates = [-half, -2.5, 0, 2.5, half]

  gridCoordinates.forEach((coordinate) => {
    if (isOpen && Math.abs(coordinate) < TUNNEL_RADIUS) {
      const openingEdge = Math.sqrt(
        TUNNEL_RADIUS * TUNNEL_RADIUS - coordinate * coordinate,
      )
      segment(coordinate, -half, coordinate, -openingEdge)
      segment(coordinate, openingEdge, coordinate, half)
      segment(-half, coordinate, -openingEdge, coordinate)
      segment(openingEdge, coordinate, half, coordinate)
      return
    }
    segment(coordinate, -half, coordinate, half)
    segment(-half, coordinate, half, coordinate)
  })

  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute(
    'position',
    new THREE.Float32BufferAttribute(positions, 3),
  )
  const grid = new THREE.LineSegments(geometry, material)
  grid.name = 'Room surface grid'
  group.add(grid)
}

function createRoom(
  room: RoomSpec,
  roomConnections: Array<RoomSpec>,
  materials: Map<RoomTheme, RoomMaterials>,
) {
  const group = new THREE.Group()
  group.position.copy(vector(room.center))
  group.name = room.label
  const roomMaterials = materials.get(room.theme)
  if (!roomMaterials) return group

  const exits = new Set(
    roomConnections.map((connectedRoom) =>
      directionBetween(room, connectedRoom),
    ),
  )

  const junctionRoom: RoomSpec = {
    ...room,
    center: [0, 0, 0],
    size: [JUNCTION_SIZE, JUNCTION_SIZE, JUNCTION_SIZE],
  }
  addChamberWall(
    group,
    junctionRoom,
    'x',
    -1,
    exits.has('x-'),
    roomMaterials.chamber,
  )
  addChamberWall(
    group,
    junctionRoom,
    'x',
    1,
    exits.has('x+'),
    roomMaterials.chamber,
  )
  addChamberWall(
    group,
    junctionRoom,
    'y',
    -1,
    exits.has('y-'),
    roomMaterials.chamber,
  )
  addChamberWall(
    group,
    junctionRoom,
    'y',
    1,
    exits.has('y+'),
    roomMaterials.chamber,
  )
  addChamberWall(
    group,
    junctionRoom,
    'z',
    -1,
    exits.has('z-'),
    roomMaterials.chamber,
  )
  addChamberWall(
    group,
    junctionRoom,
    'z',
    1,
    exits.has('z+'),
    roomMaterials.chamber,
  )
  addChamberGrid(group, 'x', -1, exits.has('x-'), roomMaterials.line)
  addChamberGrid(group, 'x', 1, exits.has('x+'), roomMaterials.line)
  addChamberGrid(group, 'y', -1, exits.has('y-'), roomMaterials.line)
  addChamberGrid(group, 'y', 1, exits.has('y+'), roomMaterials.line)
  addChamberGrid(group, 'z', -1, exits.has('z-'), roomMaterials.line)
  addChamberGrid(group, 'z', 1, exits.has('z+'), roomMaterials.line)

  return group
}

function corridorAxis(from: RoomSpec, to: RoomSpec): 'x' | 'y' | 'z' {
  if (from.center[0] !== to.center[0]) return 'x'
  if (from.center[1] !== to.center[1]) return 'y'
  return 'z'
}

function addTunnelCircle(
  group: THREE.Group,
  axis: 'x' | 'y' | 'z',
  offset: number,
  material: THREE.Material,
) {
  const positions: Array<number> = []
  const radius = TUNNEL_RADIUS - 0.01
  for (let index = 0; index < TUNNEL_SEGMENTS; index += 1) {
    const angle = (index / TUNNEL_SEGMENTS) * Math.PI * 2
    const u = Math.cos(angle) * radius
    const v = Math.sin(angle) * radius
    if (axis === 'x') positions.push(offset, u, v)
    else if (axis === 'y') positions.push(u, offset, v)
    else positions.push(u, v, offset)
  }

  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute(
    'position',
    new THREE.Float32BufferAttribute(positions, 3),
  )
  const circle = new THREE.LineLoop(geometry, material)
  circle.name = 'Tunnel surface grid circle'
  group.add(circle)
}

function addCorridorShell(
  group: THREE.Group,
  axis: 'x' | 'y' | 'z',
  length: number,
  material: THREE.Material,
) {
  const tunnel = new THREE.Mesh(
    new THREE.CylinderGeometry(
      TUNNEL_RADIUS,
      TUNNEL_RADIUS,
      length,
      TUNNEL_SEGMENTS,
      1,
      true,
    ),
    material,
  )
  if (axis === 'x') tunnel.rotation.z = Math.PI / 2
  if (axis === 'z') tunnel.rotation.x = Math.PI / 2
  group.add(tunnel)
}

function addCorridorGridCircles(
  group: THREE.Group,
  axis: 'x' | 'y' | 'z',
  length: number,
  material: THREE.Material,
) {
  const frameCount = Math.max(1, Math.floor(length / 3.5))
  for (let index = 0; index <= frameCount; index += 1) {
    const offset = -length / 2 + (index / frameCount) * length
    addTunnelCircle(group, axis, offset, material)
  }
}

function createCorridor(
  from: RoomSpec,
  to: RoomSpec,
  material: THREE.Material,
  lineMaterial: THREE.Material,
) {
  const group = new THREE.Group()
  const fromCenter = vector(from.center)
  const toCenter = vector(to.center)
  const axis = corridorAxis(from, to)
  const axisIndex = axis === 'x' ? 0 : axis === 'y' ? 1 : 2
  const direction = Math.sign(to.center[axisIndex] - from.center[axisIndex])
  const junctionHalf = JUNCTION_SIZE / 2
  const start = from.center[axisIndex] + direction * junctionHalf
  const end = to.center[axisIndex] - direction * junctionHalf
  const length = Math.abs(end - start) + WALL_THICKNESS
  const midpoint = fromCenter.clone().add(toCenter).multiplyScalar(0.5)
  midpoint.setComponent(axisIndex, (start + end) / 2)
  group.position.copy(midpoint)

  addCorridorShell(group, axis, length, material)
  addCorridorGridCircles(group, axis, length, lineMaterial)

  return group
}

function createDoor(from: RoomSpec, to: RoomSpec) {
  const fromCenter = vector(from.center)
  const toCenter = vector(to.center)
  const center = fromCenter.clone().add(toCenter).multiplyScalar(0.5)
  const group = new THREE.Group()
  group.position.copy(center)

  const fieldMaterial = new THREE.MeshBasicMaterial({
    color: '#ff694a',
    transparent: true,
    opacity: 0.22,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide,
    toneMapped: false,
  })
  addBox(
    group,
    [OPENING_SIZE - 0.25, 0.16, OPENING_SIZE - 0.25],
    [0, 0, 0],
    fieldMaterial,
  )

  const barMaterial = new THREE.MeshBasicMaterial({
    color: '#ff694a',
    toneMapped: false,
  })
  for (let index = -2; index <= 2; index += 1) {
    addBox(group, [0.06, 0.2, OPENING_SIZE], [index * 1.1, 0, 0], barMaterial)
    addBox(group, [OPENING_SIZE, 0.2, 0.06], [0, 0, index * 1.1], barMaterial)
  }

  return {
    group,
    bounds: new THREE.Box3().setFromCenterAndSize(
      center,
      new THREE.Vector3(OPENING_SIZE - 0.2, 0.5, OPENING_SIZE - 0.2),
    ),
  }
}

function mergeStaticWorldMeshes(group: THREE.Group) {
  group.updateMatrixWorld(true)
  const geometriesByMaterial = new Map<
    THREE.Material,
    Array<THREE.BufferGeometry>
  >()
  const sourceMeshes: Array<THREE.Mesh> = []

  group.traverse((object) => {
    if (!(object instanceof THREE.Mesh)) return
    if (Array.isArray(object.material)) return
    const geometry = object.geometry.clone().applyMatrix4(object.matrixWorld)
    const geometries = geometriesByMaterial.get(object.material) ?? []
    geometries.push(geometry)
    geometriesByMaterial.set(object.material, geometries)
    sourceMeshes.push(object)
  })

  sourceMeshes.forEach((mesh) => {
    mesh.removeFromParent()
    mesh.geometry.dispose()
  })
  geometriesByMaterial.forEach((geometries, material) => {
    const mergedGeometry = mergeGeometries(geometries, false)
    geometries.forEach((geometry) => geometry.dispose())
    if (!mergedGeometry) return
    const mesh = new THREE.Mesh(mergedGeometry, material)
    mesh.name = 'Merged labyrinth structure'
    group.add(mesh)
  })
}

export function createLevelWorld(scene: THREE.Scene): LevelWorld {
  const group = new THREE.Group()
  group.name = 'Stack Trace labyrinth'
  scene.add(group)

  const roomMap = new Map<RoomId, RoomSpec>(
    rooms.map((room) => [room.id, room]),
  )
  const graph = new Map<RoomId, Array<RoomId>>()
  rooms.forEach((room) => graph.set(room.id, []))
  connections.forEach(([from, to]) => {
    graph.get(from)?.push(to)
    graph.get(to)?.push(from)
  })

  const materials = new Map<RoomTheme, RoomMaterials>()
  Object.entries(themeColors).forEach(([theme, colors]) => {
    materials.set(theme as RoomTheme, {
      chamber: new THREE.MeshStandardMaterial({
        color: colors.chamber,
        emissive: colors.chamber,
        emissiveIntensity: 0.72,
        metalness: 0.42,
        roughness: 0.78,
        side: THREE.DoubleSide,
      }),
      tunnel: new THREE.MeshStandardMaterial({
        color: colors.wall,
        emissive: colors.wall,
        emissiveIntensity: 0.48,
        metalness: 0.5,
        roughness: 0.74,
        side: THREE.BackSide,
      }),
      line: new THREE.LineBasicMaterial({
        color: colors.accent,
        transparent: true,
        opacity: 0.55,
        toneMapped: false,
      }),
    })
  })

  rooms.forEach((room) => {
    const connectedRooms = (graph.get(room.id) ?? [])
      .map((roomId) => roomMap.get(roomId))
      .filter((connectedRoom): connectedRoom is RoomSpec => !!connectedRoom)
    group.add(createRoom(room, connectedRooms, materials))
  })

  connections.forEach(([fromId, toId]) => {
    const from = roomMap.get(fromId)
    const to = roomMap.get(toId)
    if (!from || !to) return
    const targetMaterials = materials.get(to.theme)
    if (!targetMaterials) return
    group.add(
      createCorridor(from, to, targetMaterials.tunnel, targetMaterials.line),
    )
  })

  mergeStaticWorldMeshes(group)

  const volumes: LevelWorld['volumes'] = rooms.map((room) => {
    const center = vector(room.center)
    const halfSize = new THREE.Vector3(1, 1, 1).multiplyScalar(
      JUNCTION_SIZE / 2 - WALL_THICKNESS,
    )
    return {
      kind: 'box',
      bounds: new THREE.Box3(
        center.clone().sub(halfSize),
        center.add(halfSize),
      ),
    }
  })
  connections.forEach(([fromId, toId]) => {
    const from = roomMap.get(fromId)
    const to = roomMap.get(toId)
    if (!from || !to) return
    const axis = corridorAxis(from, to)
    const axisIndex = axis === 'x' ? 0 : axis === 'y' ? 1 : 2
    volumes.push({
      kind: 'tube',
      axis,
      center: vector(from.center),
      min: Math.min(from.center[axisIndex], to.center[axisIndex]),
      max: Math.max(from.center[axisIndex], to.center[axisIndex]),
      radius: TUNNEL_RADIUS - WALL_THICKNESS / 2,
    })
  })

  const dataRoom = roomMap.get('data')
  const deployRoom = roomMap.get('deploy')
  if (!dataRoom || !deployRoom) {
    throw new Error('Stack Trace level is missing its deployment connection')
  }
  const door = createDoor(dataRoom, deployRoom)
  group.add(door.group)

  return { group, rooms: roomMap, graph, volumes, door }
}

// Official Lucide `bug` icon paths, rendered to a canvas texture so the icon
// stays crisp and camera-facing inside the WebGL scene.
const lucideBugPaths = [
  'M12 20v-9',
  'M14 7a4 4 0 0 1 4 4v3a6 6 0 0 1-12 0v-3a4 4 0 0 1 4-4z',
  'M14.12 3.88 16 2',
  'M21 21a4 4 0 0 0-3.81-4',
  'M21 5a4 4 0 0 1-3.55 3.97',
  'M22 13h-4',
  'M3 21a4 4 0 0 1 3.81-4',
  'M3 5a4 4 0 0 0 3.55 3.97',
  'M6 13H2',
  'm8 2 1.88 1.88',
  'M9 7.13V6a3 3 0 1 1 6 0v1.13',
] as const

function createLucideBugSprite(color: string, size = 2.7) {
  const canvas = document.createElement('canvas')
  canvas.width = 128
  canvas.height = 128
  const context = canvas.getContext('2d')
  if (!context) throw new Error('Stack Trace could not render bug icons')

  context.fillStyle = 'rgb(5 6 8 / 88%)'
  context.beginPath()
  context.arc(64, 64, 57, 0, Math.PI * 2)
  context.fill()
  context.strokeStyle = color
  context.globalAlpha = 0.38
  context.lineWidth = 2
  context.stroke()

  context.globalAlpha = 1
  context.strokeStyle = color
  context.lineWidth = 2
  context.lineCap = 'round'
  context.lineJoin = 'round'
  context.shadowColor = color
  context.shadowBlur = 3
  context.translate(16, 16)
  context.scale(4, 4)
  lucideBugPaths.forEach((path) => context.stroke(new Path2D(path)))

  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.generateMipmaps = false
  texture.minFilter = THREE.LinearFilter
  texture.magFilter = THREE.LinearFilter
  const material = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    depthWrite: false,
    toneMapped: false,
  })
  const sprite = new THREE.Sprite(material)
  sprite.scale.set(size, size, 1)
  return sprite
}

export function createBugVisual(color = '#ff694a') {
  const group = new THREE.Group()
  const icon = createLucideBugSprite(color)
  group.add(icon)
  return { group, icon }
}

export function createFaultVisual(color: string) {
  const group = new THREE.Group()
  const coreMaterial = new THREE.MeshStandardMaterial({
    color: '#130a0a',
    emissive: color,
    emissiveIntensity: 1.15,
    metalness: 0.35,
    roughness: 0.3,
    flatShading: true,
  })
  const wireMaterial = new THREE.MeshBasicMaterial({
    color,
    wireframe: true,
    transparent: true,
    opacity: 0.8,
    toneMapped: false,
  })
  const core = new THREE.Mesh(
    new THREE.DodecahedronGeometry(0.9, 0),
    coreMaterial,
  )
  const shell = new THREE.Mesh(
    new THREE.IcosahedronGeometry(1.35, 1),
    wireMaterial,
  )
  group.add(core, shell)

  const spikeGeometry = new THREE.ConeGeometry(0.12, 0.75, 5)
  const directions = [
    new THREE.Vector3(1, 0, 0),
    new THREE.Vector3(-1, 0, 0),
    new THREE.Vector3(0, 1, 0),
    new THREE.Vector3(0, -1, 0),
    new THREE.Vector3(0, 0, 1),
    new THREE.Vector3(0, 0, -1),
  ]
  directions.forEach((direction) => {
    const spike = new THREE.Mesh(spikeGeometry, wireMaterial)
    spike.position.copy(direction).multiplyScalar(1.35)
    spike.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction)
    group.add(spike)
  })

  return { group, core, shell }
}

export function createRootVisual() {
  const group = new THREE.Group()
  const shellMaterial = new THREE.MeshBasicMaterial({
    color: '#8da4ff',
    wireframe: true,
    transparent: true,
    opacity: 0.72,
    toneMapped: false,
  })
  const icon = createLucideBugSprite('#ff694a', 5.2)
  group.add(icon)

  const rings = [0, 1].map((index) => {
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(3 + index * 0.34, 0.045, 6, 40),
      shellMaterial,
    )
    ring.rotation.set(index * 0.65, index * 0.4, index * 0.8)
    group.add(ring)
    return ring
  })
  return { group, icon, rings }
}
