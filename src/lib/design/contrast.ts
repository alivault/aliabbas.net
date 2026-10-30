/**
 * Contrast of the color tokens, for tests and the design page. APCA
 * (Lc) measures how readable text is, also on dark backgrounds, where WCAG 2
 * ratios rate light gray text too well.
 */

type Rgb = [number, number, number]

/** `oklch(L C H)` with L from 0 to 1, as in globals.css, to sRGB 0–1. */
export function oklchToSrgb(value: string): Rgb {
  const match = value.match(/oklch\(\s*([\d.]+)(%?)\s+([\d.]+)\s+([\d.]+)\s*\)/)
  if (!match) throw new Error(`Not an oklch() color: ${value}`)
  const l = Number(match[1]) / (match[2] ? 100 : 1)
  const c = Number(match[3])
  const h = (Number(match[4]) * Math.PI) / 180
  const a = c * Math.cos(h)
  const b = c * Math.sin(h)

  const l_ = (l + 0.3963377774 * a + 0.2158037573 * b) ** 3
  const m_ = (l - 0.1055613458 * a - 0.0638541728 * b) ** 3
  const s_ = (l - 0.0894841775 * a - 1.291485548 * b) ** 3
  const linear: Rgb = [
    4.0767416621 * l_ - 3.3077115913 * m_ + 0.2309699292 * s_,
    -1.2684380046 * l_ + 2.6097574011 * m_ - 0.3413193965 * s_,
    -0.0041960863 * l_ - 0.7034186147 * m_ + 1.707614701 * s_,
  ]
  return linear.map((channel) => {
    const v = Math.min(1, Math.max(0, channel))
    return v <= 0.0031308 ? 12.92 * v : 1.055 * v ** (1 / 2.4) - 0.055
  }) as Rgb
}

function screenLuminance([r, g, b]: Rgb) {
  const y = 0.2126729 * r ** 2.4 + 0.7151522 * g ** 2.4 + 0.072175 * b ** 2.4
  return y < 0.022 ? y + (0.022 - y) ** 1.414 : y
}

/**
 * APCA lightness contrast (Lc), as a positive number. Body text needs about
 * 75, secondary text about 60, large headings about 45.
 */
export function apcaContrast(text: string, background: string) {
  const t = screenLuminance(oklchToSrgb(text))
  const b = screenLuminance(oklchToSrgb(background))
  const sapc =
    b > t ? (b ** 0.56 - t ** 0.57) * 1.14 : (b ** 0.65 - t ** 0.62) * 1.14
  if (Math.abs(sapc) < 0.1) return 0
  return Math.round((Math.abs(sapc) - 0.027) * 100)
}
