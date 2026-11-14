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
  const vec3 SUN_AT = vec3(${SUN_DIRECTION.x.toFixed(4)}, ${SUN_DIRECTION.y.toFixed(4)}, ${SUN_DIRECTION.z.toFixed(4)});
  const vec3 SUN_LIGHT = vec3(1.0, 0.74, 0.46);

  vec3 skyColor(vec3 d) {
    vec2 flat2 = normalize(d.xz + 1e-5);
    float warm = smoothstep(-0.6, 0.9, dot(flat2, normalize(SKY_SUN.xz)));
    vec3 sky = mix(SKY_COOL, SKY_WARM, warm);
    // Dusk: darker and cooler overhead.
    float up = smoothstep(0.08, 0.9, d.y);
    sky = mix(sky, sky * vec3(0.6, 0.64, 0.76), up * 0.8);
    // A bright band along the horizon, strongest toward the sun.
    float band = exp(-max(d.y, 0.0) * 9.0);
    sky += SKY_WARM * band * (0.05 + 0.2 * warm);
    // The wide glow of the low sun; it lights the haze and the fog toward
    // it too.
    float toSun = max(dot(d, SUN_AT), 0.0);
    sky += SUN_LIGHT * pow(toSun, 6.0) * 0.2;
    // A soft haze at the horizon, as in a dusk with dust in the air. It is
    // only a little darker than the sky, so far ground fades into light,
    // not into black.
    vec3 haze = sky * 0.78;
    vec3 col = mix(haze, sky, smoothstep(-0.01, 0.1, d.y));
    // Under the horizon: almost black.
    col = mix(col, vec3(0.035, 0.03, 0.028), smoothstep(-0.02, -0.2, d.y));
    return col;
  }

  // The color of the fog toward a direction: the haze of the horizon, also
  // toward the ground, where the sky itself is almost black.
  vec3 fogColor(vec3 d) {
    return skyColor(normalize(vec3(d.x, max(d.y, 0.0), d.z) + 1e-5));
  }
`

/**
 * Uniforms that every world material shares. uDim (0 to 1) darkens the sky
 * and the ground while a page is open, so only its icon stays lit.
 */
export const WORLD_UNIFORMS = { uDim: { value: 0 } }

/**
 * The sun itself: a soft disk low over the horizon, and its corona. Only
 * the sky dome draws it, not the fog: the ground must not show a sun.
 */
export const SUN_GLSL = /* glsl */ `
  vec3 sunDisk(vec3 d) {
    float s = max(dot(d, SUN_AT), 0.0);
    float disk = smoothstep(0.99955, 0.99978, s);
    vec3 corona = SUN_LIGHT * (pow(s, 600.0) * 0.45 + pow(s, 80.0) * 0.12);
    return SUN_LIGHT * disk * 0.9 + corona;
  }
`

/** The color of the world in the dark, toward a direction. */
export const DIM_GLSL = /* glsl */ `
  uniform float uDim;
  vec3 dimmed(vec3 col, vec3 d) {
    return mix(col, skyColor(d) * 0.14, uDim);
  }
`

/** Fog density per meter: at 60 m, the fog hides about two thirds. */
export const FOG_DENSITY = 0.016

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
          gl_FragColor.rgb = mix(gl_FragColor.rgb, fogColor(toPoint / dist), fog);
          gl_FragColor.rgb = dimmed(gl_FragColor.rgb, toPoint / dist);
        }`,
      )
  }
  return material
}
