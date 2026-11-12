let fast: boolean | undefined

/** Renderers that draw WebGL on the CPU. */
const SOFTWARE = /swiftshader|llvmpipe|softpipe|software|basic render/i

/**
 * True when WebGL runs on a GPU. Without one (a blocked GPU, or a machine
 * with no GPU), the browser draws WebGL in software, and an animation keeps
 * the main thread busy. Then the page shows still frames or CSS instead.
 */
export function hasFastWebGL(): boolean {
  if (fast !== undefined) return fast
  const canvas = document.createElement('canvas')
  // Refused when the browser falls back to software for a blocked GPU.
  const gl = canvas.getContext('webgl', { failIfMajorPerformanceCaveat: true })
  if (!gl) return (fast = false)
  // Headless and GPU-less browsers use software as their normal renderer,
  // so the option above does not refuse it. Its name shows it.
  const info = gl.getExtension('WEBGL_debug_renderer_info')
  const renderer = String(
    gl.getParameter(info ? info.UNMASKED_RENDERER_WEBGL : gl.RENDERER),
  )
  fast = !SOFTWARE.test(renderer)
  gl.getExtension('WEBGL_lose_context')?.loseContext()
  return fast
}
