import * as THREE from 'three'
import type { SheetSpec } from './sheets'

const WIDTH = 900
const HEIGHT = 1200

function loadImage(src: string) {
  return new Promise<HTMLImageElement | null>((resolve) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = () => resolve(null)
    image.src = src
  })
}

function wrap(
  context: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
): Array<string> {
  const lines: Array<string> = []
  let line = ''
  for (const word of text.split(' ')) {
    const next = line ? `${line} ${word}` : word
    if (context.measureText(next).width > maxWidth && line) {
      lines.push(line)
      line = word
    } else {
      line = next
    }
  }
  if (line) lines.push(line)
  return lines
}

/** The page colors, so the sheet looks like the page it opens. */
function pageColors() {
  const style = getComputedStyle(document.documentElement)
  const read = (name: string, fallback: string) =>
    style.getPropertyValue(name).trim() || fallback
  return {
    paper: read('--background', '#f1efe8'),
    ink: read('--foreground', '#1a1916'),
    muted: read('--fg-muted', '#6b6a66'),
    line: read('--border', '#d6d3cb'),
  }
}

/**
 * Draws a sheet as a small poster of its page: the title, the summary and a
 * picture. The paper is the page background, so the zoom into a sheet ends
 * on the same color as the page.
 */
export async function drawSheet(sheet: SheetSpec) {
  const canvas = document.createElement('canvas')
  canvas.width = WIDTH
  canvas.height = HEIGHT
  const context = canvas.getContext('2d')!
  const colors = pageColors()
  await document.fonts.load('600 80px "DM Sans Variable"').catch(() => {})
  await document.fonts.load('400 22px "Michroma"').catch(() => {})

  context.fillStyle = colors.paper
  context.fillRect(0, 0, WIDTH, HEIGHT)

  const pad = 72
  context.fillStyle = colors.muted
  context.font = '400 22px Michroma, sans-serif'
  context.letterSpacing = '6px'
  context.fillText(sheet.kind.toUpperCase(), pad, pad + 20)
  context.textAlign = 'right'
  context.fillText(sheet.to, WIDTH - pad, pad + 20)
  context.textAlign = 'left'
  context.letterSpacing = '0px'

  context.fillStyle = colors.ink
  context.font = '600 96px "DM Sans Variable", sans-serif'
  let y = pad + 170
  for (const line of wrap(context, sheet.title, WIDTH - pad * 2)) {
    context.fillText(line, pad, y)
    y += 100
  }

  context.fillStyle = colors.muted
  context.font = '400 34px "DM Sans Variable", sans-serif'
  y += 10
  for (const line of wrap(context, sheet.summary, WIDTH - pad * 2)) {
    context.fillText(line, pad, y)
    y += 46
  }

  const image = sheet.image ? await loadImage(sheet.image) : null
  const top = y + 40
  const boxHeight = HEIGHT - top - pad
  if (image) {
    const boxWidth = WIDTH - pad * 2
    const scale = Math.max(boxWidth / image.width, boxHeight / image.height)
    const w = image.width * scale
    const h = image.height * scale
    context.save()
    context.beginPath()
    context.roundRect(pad, top, boxWidth, boxHeight, 16)
    context.clip()
    context.drawImage(image, pad + (boxWidth - w) / 2, top, w, h)
    context.restore()
  } else {
    // Lines of "text", so a page with no picture still reads as a page.
    context.fillStyle = colors.line
    for (let row = 0; top + row * 34 < HEIGHT - pad; row++) {
      const short = row % 5 === 4
      const width =
        (WIDTH - pad * 2) * (short ? 0.55 : 0.85 + ((row * 37) % 15) / 100)
      context.fillRect(
        pad,
        top + row * 34,
        Math.min(width, WIDTH - pad * 2),
        12,
      )
    }
  }

  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.anisotropy = 8
  return texture
}
