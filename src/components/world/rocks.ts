import * as THREE from 'three'
import { heightAt, poolAt } from './noise'
import { SHEETS } from './sheets'

/**
 * Rocks on the ground: one in some cells of a grid, from a hash of the
 * cell, so a place always has the same rocks. None near a page icon, near
 * the start, or in a pool.
 */

/** Meters per cell of the grid. */
const CELL = 11
/** The chance that a cell has a rock, and that the rock is a boulder. */
const CHANCE = 0.32
const BOULDER = 0.06
/** No rock this near (in meters) to an icon, or to the start. */
const CLEAR_ICON = 7
const CLEAR_START = 9

function hash(x: number, z: number, seed: number): number {
  let h =
    Math.imul(x | 0, 374761393) +
    Math.imul(z | 0, 668265263) +
    Math.imul(seed, 2147483647)
  h = Math.imul(h ^ (h >>> 13), 1274126177)
  return ((h ^ (h >>> 16)) >>> 0) / 4294967295
}

export type Rock = {
  x: number
  y: number
  z: number
  /** Size on each axis, in meters. */
  scale: [number, number, number]
  /** Turn about each axis, in radians. */
  turn: [number, number, number]
}

/** The rocks in a square of ground, from (x0, z0), `size` meters wide. */
export function rocksIn(x0: number, z0: number, size: number): Array<Rock> {
  const rocks: Array<Rock> = []
  const first = Math.ceil(x0 / CELL)
  const last = Math.ceil((x0 + size) / CELL)
  const firstZ = Math.ceil(z0 / CELL)
  const lastZ = Math.ceil((z0 + size) / CELL)
  for (let j = firstZ; j < lastZ; j++) {
    for (let i = first; i < last; i++) {
      if (hash(i, j, 1) > CHANCE) continue
      const x = (i + hash(i, j, 2)) * CELL
      const z = (j + hash(i, j, 3)) * CELL
      if (x < x0 || x >= x0 + size || z < z0 || z >= z0 + size) continue
      if (Math.hypot(x, z - 6) < CLEAR_START) continue
      if (SHEETS.some((s) => Math.hypot(s.x - x, s.z - z) < CLEAR_ICON))
        continue
      if (poolAt(x, z) > 0.2) continue
      const big = hash(i, j, 4) < BOULDER
      const base = big ? 1.8 + hash(i, j, 5) * 1.6 : 0.25 + hash(i, j, 5) * 0.9
      const scale: [number, number, number] = [
        base * (0.8 + hash(i, j, 6) * 0.6),
        base * (0.5 + hash(i, j, 7) * 0.4),
        base * (0.8 + hash(i, j, 8) * 0.6),
      ]
      rocks.push({
        x,
        // Partly in the ground, so the rock sits, not rests on a point.
        y: heightAt(x, z) - scale[1] * 0.35,
        z,
        scale,
        turn: [
          (hash(i, j, 9) - 0.5) * 0.5,
          hash(i, j, 10) * Math.PI * 2,
          (hash(i, j, 11) - 0.5) * 0.5,
        ],
      })
    }
  }
  return rocks
}

/**
 * The shape of a rock: a ball of flat faces, its corners pushed in and
 * out, so it reads as broken stone.
 */
export function rockGeometry() {
  const geometry = new THREE.IcosahedronGeometry(1, 1)
  const position = geometry.getAttribute('position')
  const point = new THREE.Vector3()
  for (let i = 0; i < position.count; i++) {
    point.fromBufferAttribute(position, i)
    // The same corner in each face that shares it moves the same way.
    const key = (v: number) => Math.round(v * 1000)
    const bump =
      0.75 + hash(key(point.x), key(point.z), key(point.y) + 12) * 0.45
    point.multiplyScalar(bump)
    // A flatter bottom.
    if (point.y < 0) point.y *= 0.6
    position.setXYZ(i, point.x, point.y, point.z)
  }
  geometry.computeVertexNormals()
  return geometry
}
