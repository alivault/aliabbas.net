import { useMemo, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import type { ThreeEvent } from '@react-three/fiber'
import { heightAt, poolAt, rockAt } from './noise'
import { withSkyFog } from './sky'

/** Chunk size in meters, and quads per side. */
const CHUNK = 96
const SEGMENTS = 48
/** Chunks on each side of the camera chunk. */
const RADIUS = 2

const ROCK = new THREE.Color('#7a7875')
const ROCK_DARK = new THREE.Color('#4a4846')
// Pools are a darker, smoother rock, not holes of black.
const POOL = new THREE.Color('#2e2c2a')

/** Meters per repeat of the grain texture. */
const GRAIN_SCALE = 18

/** Value noise that repeats every `period` cells, so the texture tiles. */
function tiledNoise(x: number, y: number, period: number) {
  const cell = (i: number, j: number) => {
    const a = ((i % period) + period) % period
    const b = ((j % period) + period) % period
    let h = Math.imul(a, 374761393) + Math.imul(b, 668265263)
    h = Math.imul(h ^ (h >>> 13), 1274126177)
    return ((h ^ (h >>> 16)) >>> 0) / 4294967295
  }
  const xi = Math.floor(x)
  const yi = Math.floor(y)
  const u = (x - xi) * (x - xi) * (3 - 2 * (x - xi))
  const v = (y - yi) * (y - yi) * (3 - 2 * (y - yi))
  const a = cell(xi, yi)
  const b = cell(xi + 1, yi)
  const c = cell(xi, yi + 1)
  const d = cell(xi + 1, yi + 1)
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v
}

/**
 * Grain for the rock, in gray around 0.8, so it shapes the vertex colors
 * without making them much darker. Blotches, cracks of a meter, and fine
 * speckle.
 */
function grainTexture() {
  const size = 512
  const data = new Uint8Array(size * size * 4)
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let n = 0
      let amp = 0.5
      for (let octave = 0; octave < 5; octave++) {
        const period = 4 << octave
        n +=
          (tiledNoise((x / size) * period, (y / size) * period, period) - 0.5) *
          amp
        amp *= 0.55
      }
      const value = 200 + n * 260 + (Math.random() - 0.5) * 30
      const i = (y * size + x) * 4
      data[i] = data[i + 1] = data[i + 2] = Math.max(0, Math.min(255, value))
      data[i + 3] = 255
    }
  }
  const texture = new THREE.DataTexture(data, size, size)
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping
  texture.magFilter = THREE.LinearFilter
  texture.minFilter = THREE.LinearMipmapLinearFilter
  texture.generateMipmaps = true
  texture.anisotropy = 8
  texture.needsUpdate = true
  return texture
}

function buildChunk(cx: number, cz: number) {
  const geometry = new THREE.BufferGeometry()
  const side = SEGMENTS + 1
  const positions = new Float32Array(side * side * 3)
  const normals = new Float32Array(side * side * 3)
  const colors = new Float32Array(side * side * 3)
  const uvs = new Float32Array(side * side * 2)
  const step = CHUNK / SEGMENTS
  const color = new THREE.Color()
  const e = 0.5
  for (let iz = 0; iz < side; iz++) {
    for (let ix = 0; ix < side; ix++) {
      const x = cx * CHUNK + ix * step
      const z = cz * CHUNK + iz * step
      const i = (iz * side + ix) * 3
      positions[i] = x
      positions[i + 1] = heightAt(x, z)
      positions[i + 2] = z
      const u = (iz * side + ix) * 2
      uvs[u] = x / GRAIN_SCALE
      uvs[u + 1] = z / GRAIN_SCALE
      // The normal from the height function itself, so chunk edges match.
      const nx = heightAt(x - e, z) - heightAt(x + e, z)
      const nz = heightAt(x, z - e) - heightAt(x, z + e)
      const length = Math.hypot(nx, 2 * e, nz)
      normals[i] = nx / length
      normals[i + 1] = (2 * e) / length
      normals[i + 2] = nz / length
      color.copy(ROCK_DARK).lerp(ROCK, rockAt(x, z))
      color.lerp(POOL, poolAt(x, z))
      colors[i] = color.r
      colors[i + 1] = color.g
      colors[i + 2] = color.b
    }
  }
  const index: Array<number> = []
  for (let iz = 0; iz < SEGMENTS; iz++) {
    for (let ix = 0; ix < SEGMENTS; ix++) {
      const a = iz * side + ix
      const b = a + 1
      const c = a + side
      const d = c + 1
      index.push(a, c, b, b, c, d)
    }
  }
  geometry.setIndex(index)
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  geometry.setAttribute('normal', new THREE.BufferAttribute(normals, 3))
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))
  geometry.setAttribute('uv', new THREE.BufferAttribute(uvs, 2))
  geometry.computeBoundingSphere()
  return geometry
}

/**
 * Ground that never ends: a grid of chunks around the camera. When the
 * camera crosses into a new chunk, the grid moves with it. Built chunks stay
 * in a cache, so walking back costs nothing.
 */
export default function Terrain({
  onPoint,
  onPick,
}: {
  onPoint: (point: THREE.Vector3 | null) => void
  onPick: (point: THREE.Vector3) => void
}) {
  const cache = useRef(new Map<string, THREE.BufferGeometry>())
  const [center, setCenter] = useState<[number, number]>([0, 0])
  const material = useMemo(
    () =>
      withSkyFog(
        new THREE.MeshLambertMaterial({
          vertexColors: true,
          map: grainTexture(),
        }),
      ),
    [],
  )

  useFrame(({ camera }) => {
    const cx = Math.floor(camera.position.x / CHUNK)
    const cz = Math.floor(camera.position.z / CHUNK)
    if (cx !== center[0] || cz !== center[1]) setCenter([cx, cz])
  })

  const chunks: Array<{ key: string; geometry: THREE.BufferGeometry }> = []
  for (let dz = -RADIUS; dz <= RADIUS; dz++) {
    for (let dx = -RADIUS; dx <= RADIUS; dx++) {
      const cx = center[0] + dx
      const cz = center[1] + dz
      const key = `${cx},${cz}`
      let geometry = cache.current.get(key)
      if (!geometry) {
        geometry = buildChunk(cx, cz)
        cache.current.set(key, geometry)
      }
      chunks.push({ key, geometry })
    }
  }
  // Keep the cache small: drop chunks far from the camera.
  if (cache.current.size > 64) {
    for (const [key, geometry] of cache.current) {
      const [cx, cz] = key.split(',').map(Number)
      if (
        Math.abs(cx - center[0]) > RADIUS + 2 ||
        Math.abs(cz - center[1]) > RADIUS + 2
      ) {
        geometry.dispose()
        cache.current.delete(key)
      }
    }
  }

  // The ray can cross more than one chunk: a near hill, then the ground
  // behind it. Each chunk gets the event, nearest first, so only the first
  // may act; without this, the far one won and the walk went past the hill.
  const move = (event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation()
    onPoint(event.point)
  }
  const click = (event: ThreeEvent<MouseEvent>) => {
    event.stopPropagation()
    // A drag to look around is not a click on the ground.
    if (event.delta > 6) return
    onPick(event.point)
  }

  // A press on the ground stops here too. Else an icon behind a hill got
  // the press, took the pointer for a spin, and the click went to it
  // through the hill: the page opened.
  const press = (event: ThreeEvent<PointerEvent>) => event.stopPropagation()

  return (
    <group
      onPointerDown={press}
      onPointerMove={move}
      onPointerOut={() => onPoint(null)}
      onClick={click}
    >
      {chunks.map(({ key, geometry }) => (
        <mesh key={key} geometry={geometry} material={material} />
      ))}
    </group>
  )
}
