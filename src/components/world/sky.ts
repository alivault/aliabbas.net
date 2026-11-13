import * as THREE from 'three'

/**
 * The sky, and the fog that fades the ground into it. Both use one function,
 * `skyColor`, so far ground meets the horizon with no seam. The colors are
 * sRGB: three.js mixes fog after its color space conversion.
 */

/** Where the low sun is: the warm side of the sky. */
export const SUN_DIRECTION = new THREE.Vector3(-1, 0.18, -0.35).normalize()

export const SKY_GLSL = /* glsl */ `
  const vec3 SKY_WARM = vec3(0.74, 0.47, 0.25);
  const vec3 SKY_COOL = vec3(0.34, 0.29, 0.25);
  const vec3 SKY_SUN = vec3(${SUN_DIRECTION.x.toFixed(4)}, 0.0, ${SUN_DIRECTION.z.toFixed(4)});

  vec3 skyColor(vec3 d) {
    vec2 flat2 = normalize(d.xz + 1e-5);
    float warm = smoothstep(-0.6, 0.9, dot(flat2, normalize(SKY_SUN.xz)));
    vec3 sky = mix(SKY_COOL, SKY_WARM, warm);
    // A little lighter overhead.
    sky *= 1.0 + 0.08 * smoothstep(0.1, 0.8, d.y);
    // The haze at the horizon is dark, as in a dusk with dust in the air.
    vec3 haze = sky * 0.32;
    vec3 col = mix(haze, sky, smoothstep(-0.01, 0.1, d.y));
    // Under the horizon: almost black.
    col = mix(col, vec3(0.035, 0.03, 0.028), smoothstep(-0.02, -0.2, d.y));
    return col;
  }
`

/**
 * Uniforms that every world material shares. uDim (0 to 1) darkens the sky
 * and the ground while a page is open, so only its icon stays lit.
 */
export const WORLD_UNIFORMS = { uDim: { value: 0 } }

/** The color of the world in the dark, toward a direction. */
export const DIM_GLSL = /* glsl */ `
  uniform float uDim;
  vec3 dimmed(vec3 col, vec3 d) {
    return mix(col, skyColor(d) * 0.14, uDim);
  }
`

/** Fog density per meter. */
export const FOG_DENSITY = 0.011

/**
 * Replaces the flat fog of a built-in material with fog in the color of the
 * sky behind each point.
 */
export function withSkyFog<T extends THREE.Material>(
  material: T,
  /** The dim of this material: the shared one, or its own. */
  dim: { value: number } = WORLD_UNIFORMS.uDim,
  /** 1 takes the fog away: the icon in focus is seen as it is, also far. */
  clear: { value: number } = { value: 0 },
): T {
  material.onBeforeCompile = (shader) => {
    shader.uniforms.skyFogDensity = { value: FOG_DENSITY }
    shader.uniforms.uDim = dim
    shader.uniforms.uClear = clear
    shader.vertexShader = shader.vertexShader
      .replace(
        '#include <common>',
        '#include <common>\nvarying vec3 vSkyWorld;',
      )
      .replace(
        '#include <project_vertex>',
        '#include <project_vertex>\nvSkyWorld = (modelMatrix * vec4(transformed, 1.0)).xyz;',
      )
    shader.fragmentShader = shader.fragmentShader
      .replace(
        '#include <common>',
        `#include <common>\nvarying vec3 vSkyWorld;\nuniform float skyFogDensity;\nuniform float uClear;\n${SKY_GLSL}\n${DIM_GLSL}`,
      )
      .replace(
        '#include <fog_fragment>',
        `{
          vec3 toPoint = vSkyWorld - cameraPosition;
          float dist = length(toPoint);
          float fog = (1.0 - exp(-skyFogDensity * skyFogDensity * dist * dist)) * (1.0 - uClear);
          gl_FragColor.rgb = mix(gl_FragColor.rgb, skyColor(toPoint / dist), fog);
          gl_FragColor.rgb = dimmed(gl_FragColor.rgb, toPoint / dist);
        }`,
      )
  }
  return material
}
