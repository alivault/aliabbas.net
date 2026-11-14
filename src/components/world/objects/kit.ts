import * as THREE from 'three'
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js'

/**
 * The parts that every icon object is made of: graphite bodies and parts
 * that glow in the HUD color. The kit keeps each material and geometry it
 * makes, so the icon can fog, dim, fade and dispose all of them.
 */
export class Kit {
  readonly materials: Array<THREE.Material> = []
  /** The materials that glow: they get brighter on hover. */
  readonly glows: Array<THREE.MeshStandardMaterial> = []
  private readonly geometries: Array<THREE.BufferGeometry> = []
  private readonly textures: Array<THREE.Texture> = []

  constructor(readonly accent: string) {}

  private keep<T extends THREE.Material>(material: T) {
    // The opacity of the material when the icon is fully shown: the icon
    // fades from it (glass stays as clear as it is).
    material.userData.opacity = material.opacity
    this.materials.push(material)
    return material
  }

  /** A matte graphite body. `shade` lightens it (0 is the darkest). */
  graphite(shade = 0, options: THREE.MeshStandardMaterialParameters = {}) {
    const color = new THREE.Color('#3f3b37').lerp(
      new THREE.Color('#9a928a'),
      shade,
    )
    return this.keep(
      new THREE.MeshStandardMaterial({
        color,
        roughness: 0.62,
        metalness: 0.12,
        // Only a trace of light of its own: the studio lights it, and an
        // even glow on every face would make it flat.
        emissive: new THREE.Color('#070605'),
        ...options,
      }),
    )
  }

  /** A part that glows in the HUD color. */
  glow(strength = 1) {
    const material = this.keep(
      new THREE.MeshStandardMaterial({
        color: '#000000',
        emissive: new THREE.Color(this.accent),
        emissiveIntensity: strength,
        roughness: 0.4,
      }),
    )
    material.userData.glow = strength
    this.glows.push(material)
    return material
  }

  /**
   * A solid part in the HUD color: lit, so its faces shade, with some
   * glow of its own. Like a glow, it gets brighter on hover.
   */
  paint(strength = 0.35) {
    const material = this.keep(
      new THREE.MeshStandardMaterial({
        color: new THREE.Color(this.accent),
        emissive: new THREE.Color(this.accent),
        emissiveIntensity: strength,
        roughness: 0.55,
        flatShading: true,
      }),
    )
    material.userData.glow = strength
    this.glows.push(material)
    return material
  }

  /** Dark, clear glass. */
  glass() {
    return this.keep(
      new THREE.MeshStandardMaterial({
        color: '#a49d95',
        roughness: 0.12,
        metalness: 0,
        transparent: true,
        opacity: 0.26,
        depthWrite: false,
        side: THREE.DoubleSide,
      }),
    )
  }

  /** A material with an image on it (a logo, ruled lines). */
  image(texture: THREE.Texture | null, light = 0.75) {
    if (texture) this.textures.push(texture)
    return this.keep(
      new THREE.MeshStandardMaterial({
        color: '#ffffff',
        map: texture,
        emissive: new THREE.Color(light, light, light),
        emissiveMap: texture,
        roughness: 0.7,
      }),
    )
  }

  /** Keeps a texture that arrives later, to dispose with the icon. */
  texture(texture: THREE.Texture) {
    this.textures.push(texture)
    return texture
  }

  geometry<T extends THREE.BufferGeometry>(geometry: T) {
    this.geometries.push(geometry)
    return geometry
  }

  /**
   * A part of the object. It does not take the pointer: the icon has one
   * box for that, so a pointer that moves over the parts stays on it.
   */
  mesh(
    geometry: THREE.BufferGeometry,
    material: THREE.Material | Array<THREE.Material>,
  ) {
    const mesh = new THREE.Mesh(this.geometry(geometry), material)
    mesh.raycast = () => {}
    // It takes the key shadow; it casts one only on its page (WorldIcon).
    mesh.receiveShadow = true
    return mesh
  }

  box(
    width: number,
    height: number,
    depth: number,
    material: THREE.Material,
    radius = 0,
  ) {
    return this.mesh(
      radius > 0
        ? new RoundedBoxGeometry(width, height, depth, 3, radius)
        : new THREE.BoxGeometry(width, height, depth),
      material,
    )
  }

  /** A round rod from a to b. */
  rod(
    a: THREE.Vector3,
    b: THREE.Vector3,
    radius: number,
    material: THREE.Material,
  ) {
    const length = a.distanceTo(b)
    const mesh = this.mesh(
      new THREE.CylinderGeometry(radius, radius, length, 12),
      material,
    )
    mesh.position.copy(a).add(b).multiplyScalar(0.5)
    mesh.quaternion.setFromUnitVectors(
      new THREE.Vector3(0, 1, 0),
      b.clone().sub(a).normalize(),
    )
    return mesh
  }

  dispose() {
    for (const item of [
      ...this.materials,
      ...this.geometries,
      ...this.textures,
    ]) {
      item.dispose()
    }
  }
}

/** Eases a value toward a target, at the same rate at any frame rate. */
export const ease = (from: number, to: number, rate: number, delta: number) =>
  THREE.MathUtils.damp(from, to, rate, delta)
