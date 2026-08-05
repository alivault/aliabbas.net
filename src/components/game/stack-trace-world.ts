import * as THREE from 'three'

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
  volumes: Array<THREE.Box3>
  door: LevelDoor
  ambientNodes: Array<{ mesh: THREE.Mesh; phase: number }>
}

const OPENING_SIZE = 6
const WALL_THICKNESS = 0.24

const themeColors = {
  surface: { wall: '#121522', accent: '#f1efe8' },
  interface: { wall: '#111a39', accent: '#335cff' },
  application: { wall: '#172016', accent: '#d9ff43' },
  data: { wall: '#291716', accent: '#ff694a' },
  deploy: { wall: '#171426', accent: '#8da4ff' },
} as const satisfies Record<RoomTheme, { wall: string; accent: string }>

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
    position: [-24, 0, -31],
  },
  {
    id: 'state-fault',
    roomId: 'state-fault',
    frame: '/app/state',
    label: 'State fault',
    position: [24, -24, -31],
  },
  {
    id: 'session-fault',
    roomId: 'data-fault',
    frame: '/data/session',
    label: 'Session fault',
    position: [-24, -24, -59],
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
    position: [4, -45, -51],
  },
] as const satisfies ReadonlyArray<EnemySpec>

export const startPosition = new THREE.Vector3(0, 0, 5)
export const exitPosition = new THREE.Vector3(0, 0, 6)
export const rootPosition = new THREE.Vector3(0, -48, -61)

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

function createRoom(
  room: RoomSpec,
  roomConnections: Array<RoomSpec>,
  materials: Map<
    RoomTheme,
    { wall: THREE.Material; accent: THREE.Material; line: THREE.Material }
  >,
  ambientNodes: LevelWorld['ambientNodes'],
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

  addXWall(group, room, -1, exits.has('x-'), roomMaterials.wall)
  addXWall(group, room, 1, exits.has('x+'), roomMaterials.wall)
  addYWall(group, room, -1, exits.has('y-'), roomMaterials.wall)
  addYWall(group, room, 1, exits.has('y+'), roomMaterials.wall)
  addZWall(group, room, -1, exits.has('z-'), roomMaterials.wall)
  addZWall(group, room, 1, exits.has('z+'), roomMaterials.wall)

  const outlineSource = new THREE.BoxGeometry(
    room.size[0] - 0.1,
    room.size[1] - 0.1,
    room.size[2] - 0.1,
  )
  const outlineGeometry = new THREE.EdgesGeometry(outlineSource)
  outlineSource.dispose()
  const outline = new THREE.LineSegments(outlineGeometry, roomMaterials.line)
  group.add(outline)

  const nodeMaterial = new THREE.MeshBasicMaterial({
    color: themeColors[room.theme].accent,
    toneMapped: false,
  })
  const nodeGeometry = new THREE.OctahedronGeometry(0.12, 0)
  const corners = [
    [-1, -1, -1],
    [1, -1, -1],
    [-1, 1, -1],
    [1, 1, -1],
    [-1, -1, 1],
    [1, -1, 1],
    [-1, 1, 1],
    [1, 1, 1],
  ] as const
  corners.forEach((corner, index) => {
    const node = new THREE.Mesh(nodeGeometry, nodeMaterial)
    node.position.set(
      corner[0] * (room.size[0] / 2 - 0.35),
      corner[1] * (room.size[1] / 2 - 0.35),
      corner[2] * (room.size[2] / 2 - 0.35),
    )
    group.add(node)
    ambientNodes.push({ mesh: node, phase: index * 0.7 + room.center[2] })
  })

  return group
}

function corridorAxis(from: RoomSpec, to: RoomSpec): 'x' | 'y' | 'z' {
  if (from.center[0] !== to.center[0]) return 'x'
  if (from.center[1] !== to.center[1]) return 'y'
  return 'z'
}

function createCorridor(
  from: RoomSpec,
  to: RoomSpec,
  material: THREE.Material,
  accent: THREE.Material,
) {
  const group = new THREE.Group()
  const fromCenter = vector(from.center)
  const toCenter = vector(to.center)
  const axis = corridorAxis(from, to)
  const axisIndex = axis === 'x' ? 0 : axis === 'y' ? 1 : 2
  const fromHalf = from.size[axisIndex] / 2
  const toHalf = to.size[axisIndex] / 2
  const direction = Math.sign(to.center[axisIndex] - from.center[axisIndex])
  const start = from.center[axisIndex] + direction * fromHalf
  const end = to.center[axisIndex] - direction * toHalf
  const length = Math.abs(end - start) + WALL_THICKNESS
  const midpoint = fromCenter.clone().add(toCenter).multiplyScalar(0.5)
  midpoint.setComponent(axisIndex, (start + end) / 2)
  group.position.copy(midpoint)

  if (axis === 'z') {
    addBox(
      group,
      [WALL_THICKNESS, OPENING_SIZE, length],
      [-OPENING_SIZE / 2, 0, 0],
      material,
    )
    addBox(
      group,
      [WALL_THICKNESS, OPENING_SIZE, length],
      [OPENING_SIZE / 2, 0, 0],
      material,
    )
    addBox(
      group,
      [OPENING_SIZE, WALL_THICKNESS, length],
      [0, -OPENING_SIZE / 2, 0],
      material,
    )
    addBox(
      group,
      [OPENING_SIZE, WALL_THICKNESS, length],
      [0, OPENING_SIZE / 2, 0],
      material,
    )
  } else if (axis === 'x') {
    addBox(
      group,
      [length, OPENING_SIZE, WALL_THICKNESS],
      [0, 0, -OPENING_SIZE / 2],
      material,
    )
    addBox(
      group,
      [length, OPENING_SIZE, WALL_THICKNESS],
      [0, 0, OPENING_SIZE / 2],
      material,
    )
    addBox(
      group,
      [length, WALL_THICKNESS, OPENING_SIZE],
      [0, -OPENING_SIZE / 2, 0],
      material,
    )
    addBox(
      group,
      [length, WALL_THICKNESS, OPENING_SIZE],
      [0, OPENING_SIZE / 2, 0],
      material,
    )
  } else {
    addBox(
      group,
      [WALL_THICKNESS, length, OPENING_SIZE],
      [-OPENING_SIZE / 2, 0, 0],
      material,
    )
    addBox(
      group,
      [WALL_THICKNESS, length, OPENING_SIZE],
      [OPENING_SIZE / 2, 0, 0],
      material,
    )
    addBox(
      group,
      [OPENING_SIZE, length, WALL_THICKNESS],
      [0, 0, -OPENING_SIZE / 2],
      material,
    )
    addBox(
      group,
      [OPENING_SIZE, length, WALL_THICKNESS],
      [0, 0, OPENING_SIZE / 2],
      material,
    )
  }

  const frameCount = Math.max(1, Math.floor(length / 3.5))
  for (let index = 0; index <= frameCount; index += 1) {
    const offset = -length / 2 + (index / frameCount) * length
    const beam = 0.12
    if (axis === 'z') {
      addBox(
        group,
        [beam, OPENING_SIZE + 0.2, beam],
        [-OPENING_SIZE / 2 + beam / 2, 0, offset],
        accent,
      )
      addBox(
        group,
        [beam, OPENING_SIZE + 0.2, beam],
        [OPENING_SIZE / 2 - beam / 2, 0, offset],
        accent,
      )
      addBox(
        group,
        [OPENING_SIZE, beam, beam],
        [0, -OPENING_SIZE / 2 + beam / 2, offset],
        accent,
      )
      addBox(
        group,
        [OPENING_SIZE, beam, beam],
        [0, OPENING_SIZE / 2 - beam / 2, offset],
        accent,
      )
    } else if (axis === 'x') {
      addBox(
        group,
        [beam, OPENING_SIZE + 0.2, beam],
        [offset, 0, -OPENING_SIZE / 2 + beam / 2],
        accent,
      )
      addBox(
        group,
        [beam, OPENING_SIZE + 0.2, beam],
        [offset, 0, OPENING_SIZE / 2 - beam / 2],
        accent,
      )
      addBox(
        group,
        [beam, beam, OPENING_SIZE],
        [offset, -OPENING_SIZE / 2 + beam / 2, 0],
        accent,
      )
      addBox(
        group,
        [beam, beam, OPENING_SIZE],
        [offset, OPENING_SIZE / 2 - beam / 2, 0],
        accent,
      )
    } else {
      addBox(
        group,
        [beam, beam, OPENING_SIZE + 0.2],
        [-OPENING_SIZE / 2 + beam / 2, offset, 0],
        accent,
      )
      addBox(
        group,
        [beam, beam, OPENING_SIZE + 0.2],
        [OPENING_SIZE / 2 - beam / 2, offset, 0],
        accent,
      )
      addBox(
        group,
        [OPENING_SIZE, beam, beam],
        [0, offset, -OPENING_SIZE / 2 + beam / 2],
        accent,
      )
      addBox(
        group,
        [OPENING_SIZE, beam, beam],
        [0, offset, OPENING_SIZE / 2 - beam / 2],
        accent,
      )
    }
  }

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

  const materials = new Map<
    RoomTheme,
    {
      wall: THREE.Material
      accent: THREE.Material
      line: THREE.Material
    }
  >()
  Object.entries(themeColors).forEach(([theme, colors]) => {
    materials.set(theme as RoomTheme, {
      wall: new THREE.MeshStandardMaterial({
        color: colors.wall,
        emissive: colors.wall,
        emissiveIntensity: 0.35,
        metalness: 0.55,
        roughness: 0.72,
      }),
      accent: new THREE.MeshBasicMaterial({
        color: colors.accent,
        transparent: true,
        opacity: 0.48,
        toneMapped: false,
      }),
      line: new THREE.LineBasicMaterial({
        color: colors.accent,
        transparent: true,
        opacity: 0.55,
        toneMapped: false,
      }),
    })
  })

  const ambientNodes: LevelWorld['ambientNodes'] = []
  rooms.forEach((room) => {
    const connectedRooms = (graph.get(room.id) ?? [])
      .map((roomId) => roomMap.get(roomId))
      .filter((connectedRoom): connectedRoom is RoomSpec => !!connectedRoom)
    group.add(createRoom(room, connectedRooms, materials, ambientNodes))
  })

  connections.forEach(([fromId, toId]) => {
    const from = roomMap.get(fromId)
    const to = roomMap.get(toId)
    if (!from || !to) return
    const targetMaterials = materials.get(to.theme)
    if (!targetMaterials) return
    group.add(
      createCorridor(from, to, targetMaterials.wall, targetMaterials.accent),
    )
  })

  const volumes = rooms.map((room) => {
    const center = vector(room.center)
    const halfSize = vector(room.size).multiplyScalar(0.5)
    return new THREE.Box3(center.clone().sub(halfSize), center.add(halfSize))
  })
  connections.forEach(([fromId, toId]) => {
    const from = roomMap.get(fromId)
    const to = roomMap.get(toId)
    if (!from || !to) return
    const axis = corridorAxis(from, to)
    const min = vector(from.center)
    const max = vector(from.center)
    const target = vector(to.center)
    min.min(target)
    max.max(target)
    const crossHalf = OPENING_SIZE / 2 - WALL_THICKNESS
    if (axis !== 'x') {
      min.x = from.center[0] - crossHalf
      max.x = from.center[0] + crossHalf
    }
    if (axis !== 'y') {
      min.y = from.center[1] - crossHalf
      max.y = from.center[1] + crossHalf
    }
    if (axis !== 'z') {
      min.z = from.center[2] - crossHalf
      max.z = from.center[2] + crossHalf
    }
    volumes.push(new THREE.Box3(min, max))
  })

  const dataRoom = roomMap.get('data')
  const deployRoom = roomMap.get('deploy')
  if (!dataRoom || !deployRoom) {
    throw new Error('Stack Trace level is missing its deployment connection')
  }
  const door = createDoor(dataRoom, deployRoom)
  group.add(door.group)

  return { group, rooms: roomMap, graph, volumes, door, ambientNodes }
}

export function createBugVisual(color = '#ff694a') {
  const group = new THREE.Group()
  const coreMaterial = new THREE.MeshStandardMaterial({
    color: '#140807',
    emissive: color,
    emissiveIntensity: 1.4,
    metalness: 0.4,
    roughness: 0.35,
    flatShading: true,
  })
  const lineMaterial = new THREE.MeshBasicMaterial({
    color,
    wireframe: true,
    transparent: true,
    opacity: 0.9,
    toneMapped: false,
  })
  const core = new THREE.Mesh(
    new THREE.IcosahedronGeometry(0.58, 0),
    coreMaterial,
  )
  group.add(core)

  const rings = [0, 1, 2].map((index) => {
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(0.82, 0.035, 5, 24),
      lineMaterial,
    )
    ring.rotation.set(index * 0.8, index * 1.1, index * 0.4)
    group.add(ring)
    return ring
  })

  const wingGeometry = new THREE.TetrahedronGeometry(0.32, 0)
  ;[-1, 1].forEach((sign) => {
    const wing = new THREE.Mesh(wingGeometry, lineMaterial)
    wing.position.x = sign * 0.92
    wing.scale.set(1.6, 0.45, 0.8)
    group.add(wing)
  })

  return { group, core, rings }
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
  const coreMaterial = new THREE.MeshStandardMaterial({
    color: '#0c0718',
    emissive: '#8da4ff',
    emissiveIntensity: 1.8,
    metalness: 0.65,
    roughness: 0.18,
    flatShading: true,
  })
  const shellMaterial = new THREE.MeshBasicMaterial({
    color: '#ff694a',
    wireframe: true,
    transparent: true,
    opacity: 0.85,
    toneMapped: false,
  })
  const core = new THREE.Mesh(
    new THREE.OctahedronGeometry(1.45, 1),
    coreMaterial,
  )
  const shell = new THREE.Mesh(
    new THREE.DodecahedronGeometry(2.25, 0),
    shellMaterial,
  )
  group.add(core, shell)

  const rings = [0, 1, 2].map((index) => {
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(2.65, 0.055, 6, 36),
      shellMaterial,
    )
    ring.rotation.set(index * 0.9, index * 0.65, index * 0.45)
    group.add(ring)
    return ring
  })
  return { group, core, shell, rings }
}
