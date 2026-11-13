import { createElement } from 'react'
import { createRoot } from 'react-dom/client'
import * as THREE from 'three'
import type { LucideIcon } from 'lucide-react'
import type { SheetIcon } from './sheets'

const SIZE = 1024

/**
 * An image, decoded and ready to draw. Safari fires load on an SVG before
 * it can paint it, so a draw right after load leaves the canvas empty:
 * decode() waits until it can.
 */
function loadImage(src: string) {
  return new Promise<HTMLImageElement | null>((resolve) => {
    const image = new Image()
    image.onload = () => {
      void image
        .decode()
        .catch(() => undefined)
        .then(() => resolve(image))
    }
    image.onerror = () => resolve(null)
    image.src = src
  })
}

function svgUrl(markup: string) {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(markup)}`
}

/**
 * An SVG file at the size it is drawn. Safari draws an SVG image at its own
 * width and height and scales the pixels, so a 32px icon on a 700px face
 * would blur. With the size in the markup, it draws sharp.
 */
async function loadSvgAt(src: string, size: number) {
  try {
    const markup = await (await fetch(src)).text()
    const sized = markup.replace(/<svg\b([^>]*)>/, (_, attributes: string) => {
      const rest = attributes
        .replace(/\swidth="[^"]*"/, '')
        .replace(/\sheight="[^"]*"/, '')
      return `<svg width="${size}" height="${size}"${rest}>`
    })
    return await loadImage(svgUrl(sized))
  } catch {
    return loadImage(src)
  }
}

/**
 * A Lucide icon as SVG markup, drawn by React into a detached node. It runs
 * from an effect, where React cannot render at once: wait for the commit.
 */
async function glyphMarkup(glyph: LucideIcon, color: string, size: number) {
  const node = document.createElement('div')
  const root = createRoot(node)
  root.render(
    createElement(glyph, {
      size,
      color,
      strokeWidth: 1.25,
    }),
  )
  for (let i = 0; i < 20 && !node.firstElementChild; i++) {
    await new Promise((resolve) => setTimeout(resolve, 0))
  }
  // An SVG image needs its namespace. Safari writes it into the markup
  // already, and a second one makes the SVG invalid, so it draws nothing.
  const raw = node.innerHTML
  const markup = /^<svg[^>]*\sxmlns=/.test(raw)
    ? raw
    : raw.replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" ')
  root.unmount()
  return markup
}

function cssColor(name: string, fallback: string) {
  const value = getComputedStyle(document.documentElement)
    .getPropertyValue(name)
    .trim()
  return value || fallback
}

/**
 * A CSS color as rgb(), read back from a pixel. An SVG in an image may not
 * know oklch() in every browser; rgb() it always knows.
 */
function rgbOf(color: string) {
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = 1
  const context = canvas.getContext('2d', { willReadFrequently: true })
  if (!context) return color
  context.fillStyle = color
  context.fillRect(0, 0, 1, 1)
  const [r, g, b] = context.getImageData(0, 0, 1, 1).data
  return `rgb(${r}, ${g}, ${b})`
}

/**
 * The texture of a face of an icon cube. Every face is a dark tile with the
 * edge and the line color of the HUD, so the cube is solid from every side.
 * A project shows its app icon on it; a page shows a glyph. A cover image
 * (a still of a game) fills the face.
 */
export async function drawIcon(icon: SheetIcon) {
  const canvas = document.createElement('canvas')
  canvas.width = SIZE
  canvas.height = SIZE
  const context = canvas.getContext('2d')!
  const hud = cssColor('--hud', '#e0501f')

  // A dark tile, a little warmer at the top, as if lit by the sky.
  const fill = context.createLinearGradient(0, 0, 0, SIZE)
  fill.addColorStop(0, cssColor('--sky-haze', '#2a1a12'))
  fill.addColorStop(1, cssColor('--ground', '#0d0b0a'))
  context.fillStyle = fill
  context.fillRect(0, 0, SIZE, SIZE)

  if (icon.type === 'image') {
    const inset = icon.cover ? 0 : SIZE * 0.16
    const side = SIZE - inset * 2
    const image = icon.src.endsWith('.svg')
      ? await loadSvgAt(icon.src, side)
      : await loadImage(icon.src)
    if (image) {
      if (icon.cover) {
        const scale = Math.max(SIZE / image.width, SIZE / image.height)
        const w = image.width * scale
        const h = image.height * scale
        context.drawImage(image, (SIZE - w) / 2, (SIZE - h) / 2, w, h)
      } else {
        context.drawImage(image, inset, inset, side, side)
      }
    }
  } else if (icon.type === 'glyph') {
    const inset = SIZE * 0.22
    const side = SIZE - inset * 2
    // The stroke width is in the units of the icon's 24px grid, so a
    // larger size keeps the same weight.
    const image = await loadImage(
      svgUrl(await glyphMarkup(icon.glyph, rgbOf(hud), side)),
    )
    if (image) context.drawImage(image, inset, inset, side, side)
  }

  context.strokeStyle = hud
  context.lineWidth = 6
  context.strokeRect(3, 3, SIZE - 6, SIZE - 6)

  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.anisotropy = 8
  return texture
}
