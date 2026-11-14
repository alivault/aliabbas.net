import * as THREE from 'three'

/**
 * The light of the icon objects: a photo studio around the camera, as an
 * environment map. A large key softbox at the upper left of the view, a
 * weak cool fill at the right, and a warm rim behind, in the color of the
 * sky, on a dark warm room. Each face of an object then has its own light
 * (a bright side, a dark side, a lit edge) and soft highlights, from any
 * angle: the map turns with the camera (followCamera).
 *
 * Only the object materials use it; the ground and the cubes keep the
 * light of the scene.
 */
const environments = new WeakMap<THREE.WebGLRenderer, THREE.Texture>()

/** Where the key light is, in the frame of the camera. */
const KEY = new THREE.Vector3(-0.8, 0.9, 1)

/**
 * The shadow of the key light: soft shadows of the object of the open
 * page on itself (a lid on its case, a bar of the P on its stem). It is a
 * light with no strength of its own, so it lights nothing; the objects
 * read its shadow map and take away that much of the studio light. Only
 * the object of the open page casts, so the map is small to draw.
 */
export const keyShadow = (() => {
  const light = new THREE.DirectionalLight('#ffffff', 0)
  light.castShadow = true
  light.shadow.mapSize.set(1024, 1024)
  const camera = light.shadow.camera
  camera.left = camera.bottom = -1.3
  camera.right = camera.top = 1.3
  camera.near = 0.5
  camera.far = 12
  camera.updateProjectionMatrix()
  light.shadow.bias = -0.0004
  light.shadow.normalBias = 0.015
  light.shadow.radius = 5
  return light
})()

/** Puts the key shadow on an object, from the key light of the view. */
export function aimKeyShadow(at: THREE.Vector3, camera: THREE.Camera) {
  const direction = KEY.clone().normalize().applyQuaternion(camera.quaternion)
  keyShadow.position.copy(at).addScaledVector(direction, 6)
  keyShadow.target.position.copy(at)
  keyShadow.target.updateMatrixWorld()
}

/** How much of the studio light a part in full shadow loses. */
const SHADOW = 0.6

/** The exposure of the tone mapping of the objects. */
const EXPOSURE = 0.9

/**
 * ACES filmic tone mapping (as three.js has it), for the lit parts of the
 * objects only: highlights roll off in place of clipping, and the mid
 * tones get more contrast. The renderer has none (the canvas is flat), as
 * the sky, the ground and the HUD color are matched to the screen as is.
 */
const TONE_GLSL = /* glsl */ `
  vec3 studioFit( vec3 v ) {
    vec3 a = v * ( v + 0.0245786 ) - 0.000090537;
    vec3 b = v * ( 0.983729 * v + 0.4329510 ) + 0.238081;
    return a / b;
  }
  vec3 studioTone( vec3 color ) {
    const mat3 inputMatrix = mat3(
      vec3( 0.59719, 0.07600, 0.02840 ),
      vec3( 0.35458, 0.90834, 0.13383 ),
      vec3( 0.04823, 0.01566, 0.83777 )
    );
    const mat3 outputMatrix = mat3(
      vec3( 1.60475, -0.10208, -0.00327 ),
      vec3( -0.53108, 1.10813, -0.07276 ),
      vec3( -0.07367, -0.00605, 1.07602 )
    );
    color *= ${EXPOSURE.toFixed(2)} / 0.6;
    color = inputMatrix * color;
    color = studioFit( color );
    color = outputMatrix * color;
    return clamp( color, 0.0, 1.0 );
  }
`

/** The studio, in the frame of the camera: it looks along -z, up is +y. */
function studioScene() {
  const scene = new THREE.Scene()
  scene.background = new THREE.Color(0.012, 0.009, 0.007)
  const panel = (
    direction: THREE.Vector3,
    width: number,
    height: number,
    color: THREE.Color,
  ) => {
    const mesh = new THREE.Mesh(
      new THREE.PlaneGeometry(width, height),
      new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide }),
    )
    mesh.position.copy(direction.normalize().multiplyScalar(5))
    mesh.lookAt(0, 0, 0)
    scene.add(mesh)
  }
  // Key: large and bright, up and to the left, in front.
  panel(KEY.clone(), 4, 4, new THREE.Color(7, 6.5, 5.9))
  // Fill: small and dim, to the right, a little cool.
  panel(new THREE.Vector3(1, 0.05, 0.55), 3, 2.4, new THREE.Color(0.9, 1, 1.1))
  // Rim: behind and above, warm as the sky, for a bright edge.
  panel(
    new THREE.Vector3(0.35, 0.55, -1),
    6,
    2,
    new THREE.Color(0.74, 0.47, 0.25).multiplyScalar(6),
  )
  // The floor bounces a little warm light up.
  panel(
    new THREE.Vector3(0, -1, 0.2),
    10,
    10,
    new THREE.Color(0.09, 0.06, 0.04),
  )
  return scene
}

export function studioEnvironment(renderer: THREE.WebGLRenderer) {
  let texture = environments.get(renderer)
  if (!texture) {
    const generator = new THREE.PMREMGenerator(renderer)
    const scene = studioScene()
    texture = generator.fromScene(scene, 0.04).texture
    generator.dispose()
    scene.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        object.geometry.dispose()
        ;(object.material as THREE.Material).dispose()
      }
    })
    environments.set(renderer, texture)
  }
  return texture
}

/** How much of the hemisphere light of the scene an object takes. */
const HEMISPHERE = 0.3

/**
 * Lights a material with the studio: the map, and less of the flat
 * hemisphere light of the scene (it gives every upright face the same
 * light, which made the objects flat). Call after withSkyFog: it keeps
 * that change to the shader.
 */
export function withStudio(
  material: THREE.Material,
  environment: THREE.Texture,
) {
  if (!(material instanceof THREE.MeshStandardMaterial)) return material
  material.envMap = environment
  material.envMapIntensity = 1
  const before = material.onBeforeCompile.bind(material)
  material.onBeforeCompile = (shader, renderer) => {
    before(shader, renderer)
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <lights_fragment_begin>',
      THREE.ShaderChunk.lights_fragment_begin.replace(
        'irradiance += getHemisphereLightIrradiance( hemisphereLights[ i ], geometryNormal );',
        `irradiance += ${HEMISPHERE.toFixed(2)} * getHemisphereLightIrradiance( hemisphereLights[ i ], geometryNormal );`,
      ),
    )
    // The key shadow (the first light with a shadow) takes away part of
    // the studio light.
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <aomap_fragment>',
      `#include <aomap_fragment>
      #if defined( USE_SHADOWMAP ) && NUM_DIR_LIGHT_SHADOWS > 0
      {
        DirectionalLightShadow keyShadow = directionalLightShadows[ 0 ];
        float lit = receiveShadow ? getShadow( directionalShadowMap[ 0 ], keyShadow.shadowMapSize, keyShadow.shadowIntensity, keyShadow.shadowBias, keyShadow.shadowRadius, vDirectionalShadowCoord[ 0 ] ) : 1.0;
        float keep = mix( ${(1 - SHADOW).toFixed(2)}, 1.0, lit );
        reflectedLight.indirectDiffuse *= keep;
        reflectedLight.indirectSpecular *= keep;
      }
      #endif`,
    )
  }
  // The tone mapping, before the fog (the fog is in screen colors). The
  // parts that glow keep the HUD color as it is.
  const toned = material.userData.glow === undefined
  if (toned) {
    const prior = material.onBeforeCompile.bind(material)
    material.onBeforeCompile = (shader, renderer) => {
      prior(shader, renderer)
      shader.fragmentShader = shader.fragmentShader
        .replace('#include <common>', `#include <common>\n${TONE_GLSL}`)
        .replace(
          '#include <tonemapping_fragment>',
          'gl_FragColor.rgb = studioTone( gl_FragColor.rgb );',
        )
    }
  }
  material.customProgramCacheKey = () => (toned ? 'studio-toned' : 'studio')
  material.needsUpdate = true
  return material
}

/** Turns the studio with the camera, so the key light stays at the upper
    left of the view. */
export function followCamera(
  materials: Array<THREE.Material>,
  camera: THREE.Camera,
) {
  for (const material of materials) {
    if (material instanceof THREE.MeshStandardMaterial) {
      material.envMapRotation.setFromQuaternion(camera.quaternion)
    }
  }
}
