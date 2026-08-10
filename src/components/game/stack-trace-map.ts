import * as THREE from 'three'
import {
  connections,
  enemySpecs,
  exitPosition,
  faultSpecs,
  rooms,
} from './stack-trace-world'
import type { RoomId } from './stack-trace-world'

const CHAMBER_SIZE = 10
const TUNNEL_RADIUS = 3
const MAP_TUNNEL_SEGMENTS = 16

type MapRoom = {
  lines: THREE.LineSegments
  material: THREE.LineBasicMaterial
}

type MapTunnel = {
  id: number
  lines: THREE.LineSegments
  material: THREE.LineBasicMaterial
}

export type StackTraceAutomap = {
  scene: THREE.Scene
  camera: THREE.PerspectiveCamera
  rooms: Map<RoomId, MapRoom>
  tunnels: Array<MapTunnel>
  player: THREE.LineSegments
  enemies: Array<THREE.LineSegments>
  faults: Array<THREE.LineSegments>
  rootEnemy: THREE.LineSegments
  exit: THREE.LineLoop
}

function roomCenter(roomId: RoomId) {
  const room = rooms.find((candidate) => candidate.id === roomId)
  if (!room) return new THREE.Vector3()
  return new THREE.Vector3(...room.center)
}

function createRoomLines() {
  const sourceGeometry = new THREE.BoxGeometry(
    CHAMBER_SIZE,
    CHAMBER_SIZE,
    CHAMBER_SIZE,
  )
  const geometry = new THREE.EdgesGeometry(sourceGeometry)
  sourceGeometry.dispose()
  const material = new THREE.LineBasicMaterial({
    color: '#f1efe8',
    transparent: true,
    opacity: 0.34,
    depthWrite: false,
    toneMapped: false,
  })
  return {
    lines: new THREE.LineSegments(geometry, material),
    material,
  }
}

function createTunnelLines(from: RoomId, to: RoomId) {
  const start = roomCenter(from)
  const end = roomCenter(to)
  const direction = end.clone().sub(start)
  const length = Math.max(direction.length() - CHAMBER_SIZE, 0.1)
  const geometry = new THREE.CylinderGeometry(
    TUNNEL_RADIUS,
    TUNNEL_RADIUS,
    length,
    MAP_TUNNEL_SEGMENTS,
    1,
    true,
  )
  const edges = new THREE.EdgesGeometry(geometry, 1)
  geometry.dispose()
  const material = new THREE.LineBasicMaterial({
    color: '#f1efe8',
    transparent: true,
    opacity: 0.22,
    depthWrite: false,
    toneMapped: false,
  })
  const lines = new THREE.LineSegments(edges, material)
  lines.position.copy(start).add(end).multiplyScalar(0.5)
  lines.quaternion.setFromUnitVectors(
    new THREE.Vector3(0, 1, 0),
    direction.normalize(),
  )
  lines.visible = false
  return { lines, material }
}

function createPlayerMarker() {
  const positions: Array<number> = []
  const profile: Array<THREE.Vector3> = []
  const profileSegments = 12
  const profileRadius = 0.9
  const profileCenterY = -0.38
  const rearZ = 0.75
  const nose = new THREE.Vector3(0, profileCenterY, -1.7)

  for (let index = 0; index <= profileSegments; index += 1) {
    const angle = Math.PI - (Math.PI * index) / profileSegments
    profile.push(
      new THREE.Vector3(
        Math.cos(angle) * profileRadius,
        profileCenterY + Math.sin(angle) * profileRadius,
        rearZ,
      ),
    )
  }

  const addSegment = (start: THREE.Vector3, end: THREE.Vector3) => {
    positions.push(start.x, start.y, start.z, end.x, end.y, end.z)
  }

  profile.forEach((point, index) => {
    addSegment(point, profile[(index + 1) % profile.length] ?? point)
  })
  ;[0, 3, 6, 9, 12].forEach((index) => {
    const point = profile[index]
    if (point) addSegment(point, nose)
  })

  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute(
    'position',
    new THREE.Float32BufferAttribute(positions, 3),
  )
  const material = new THREE.LineBasicMaterial({
    color: '#d9ff43',
    depthTest: false,
    depthWrite: false,
    toneMapped: false,
  })
  const player = new THREE.LineSegments(geometry, material)
  player.renderOrder = 10
  return player
}

function createEnemyMarker(radius: number, kind: 'enemy' | 'fault' = 'enemy') {
  const sourceGeometry =
    kind === 'fault'
      ? new THREE.IcosahedronGeometry(radius, 0)
      : new THREE.OctahedronGeometry(radius, 0)
  const geometry = new THREE.EdgesGeometry(sourceGeometry)
  sourceGeometry.dispose()
  const material = new THREE.LineBasicMaterial({
    color: '#ff694a',
    depthTest: false,
    depthWrite: false,
    toneMapped: false,
  })
  const marker = new THREE.LineSegments(geometry, material)
  marker.renderOrder = 9
  marker.visible = false
  return marker
}

function createExitMarker() {
  const points = Array.from({ length: 64 }, (_, index) => {
    const angle = (index / 64) * Math.PI * 2
    return new THREE.Vector3(Math.cos(angle) * 2.2, Math.sin(angle) * 2.2, 0)
  })
  const geometry = new THREE.BufferGeometry().setFromPoints(points)
  const material = new THREE.LineBasicMaterial({
    color: '#d9ff43',
    depthTest: false,
    depthWrite: false,
    toneMapped: false,
  })
  const marker = new THREE.LineLoop(geometry, material)
  marker.position.copy(exitPosition)
  marker.renderOrder = 10
  marker.visible = false
  return marker
}

export function createStackTraceAutomap(): StackTraceAutomap {
  const scene = new THREE.Scene()
  scene.background = new THREE.Color('#020304')
  const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 400)
  const mapRooms = new Map<RoomId, MapRoom>()

  rooms.forEach((room) => {
    const mapRoom = createRoomLines()
    mapRoom.lines.position.set(room.center[0], room.center[1], room.center[2])
    mapRoom.lines.visible = false
    scene.add(mapRoom.lines)
    mapRooms.set(room.id, mapRoom)
  })

  const tunnels = connections.map(([from, to], id) => {
    const { lines, material } = createTunnelLines(from, to)
    scene.add(lines)
    return { id, lines, material }
  })

  const player = createPlayerMarker()
  scene.add(player)
  const enemies = enemySpecs.map(() => {
    const marker = createEnemyMarker(0.72)
    scene.add(marker)
    return marker
  })
  const faults = faultSpecs.map(() => {
    const marker = createEnemyMarker(0.9, 'fault')
    scene.add(marker)
    return marker
  })
  const rootEnemy = createEnemyMarker(1.15)
  scene.add(rootEnemy)
  const exit = createExitMarker()
  scene.add(exit)

  return {
    scene,
    camera,
    rooms: mapRooms,
    tunnels,
    player,
    enemies,
    faults,
    rootEnemy,
    exit,
  }
}

export function updateStackTraceAutomap(
  automap: StackTraceAutomap,
  discoveredRooms: ReadonlySet<RoomId>,
  discoveredTunnels: ReadonlySet<number>,
  playerPosition: THREE.Vector3,
  playerQuaternion: THREE.Quaternion,
) {
  automap.rooms.forEach(({ lines, material }, roomId) => {
    const discovered = discoveredRooms.has(roomId)
    lines.visible = true
    material.color.set(discovered ? '#f1efe8' : '#335cff')
    material.opacity = discovered ? 0.34 : 0.58
  })
  automap.tunnels.forEach(({ id, lines, material }) => {
    const discovered = discoveredTunnels.has(id)
    lines.visible = true
    material.color.set(discovered ? '#f1efe8' : '#335cff')
    material.opacity = discovered ? 0.22 : 0.46
  })
  automap.player.position.copy(playerPosition)
  automap.player.quaternion.copy(playerQuaternion)
}

export function disposeStackTraceAutomap(automap: StackTraceAutomap) {
  const materials = new Set<THREE.Material>()
  const geometries = new Set<THREE.BufferGeometry>()
  automap.scene.traverse((object) => {
    if (!(object instanceof THREE.Line)) return
    geometries.add(object.geometry)
    const objectMaterials = Array.isArray(object.material)
      ? object.material
      : [object.material]
    objectMaterials.forEach((material) => materials.add(material))
  })
  geometries.forEach((geometry) => geometry.dispose())
  materials.forEach((material) => material.dispose())
}
