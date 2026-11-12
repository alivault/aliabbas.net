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

/** Fog density per meter. */
export const FOG_DENSITY = 0.011

/**
 * Replaces the flat fog of a built-in material with fog in the color of the
 * sky behind each point.
 */
export function withSkyFog<T extends THREE.Material>(material: T): T {
  material.onBeforeCompile = (shader) => {
    shader.uniforms.skyFogDensity = { value: FOG_DENSITY }
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
        `#include <common>\nvarying vec3 vSkyWorld;\nuniform float skyFogDensity;\n${SKY_GLSL}`,
      )
      .replace(
        '#include <fog_fragment>',
        `{
          vec3 toPoint = vSkyWorld - cameraPosition;
          float dist = length(toPoint);
          float fog = 1.0 - exp(-skyFogDensity * skyFogDensity * dist * dist);
          gl_FragColor.rgb = mix(gl_FragColor.rgb, skyColor(toPoint / dist), fog);
        }`,
      )
  }
  return material
}
