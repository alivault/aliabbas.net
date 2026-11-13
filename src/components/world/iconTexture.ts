import { createElement } from 'react'
import { createRoot } from 'react-dom/client'
import * as THREE from 'three'
import type { LucideIcon } from 'lucide-react'
import type { SheetIcon } from './sheets'

const SIZE = 1024

function loadImage(src: string) {
  return new Promise<HTMLImageElement | null>((resolve) => {
    const image = new Image()
    image.decoding = 'async'
    image.onload = () => resolve(image)
    image.onerror = () => resolve(null)
    image.src = src
  })
}

/**
 * A Lucide icon as SVG markup, drawn by React into a detached node. It runs
 * from an effect, where React cannot render at once: wait for the commit.
 */
async function glyphMarkup(glyph: LucideIcon, color: string) {
  const node = document.createElement('div')
  const root = createRoot(node)
  root.render(
    createElement(glyph, {
      size: 24,
      color,
      strokeWidth: 1.25,
    }),
  )
  for (let i = 0; i < 20 && !node.firstElementChild; i++) {
    await new Promise((resolve) => setTimeout(resolve, 0))
  }
  const markup = node.innerHTML.replace(
    '<svg ',
    '<svg xmlns="http://www.w3.org/2000/svg" ',
  )
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
    const image = await loadImage(icon.src)
    if (image) {
      if (icon.cover) {
        const scale = Math.max(SIZE / image.width, SIZE / image.height)
        const w = image.width * scale
        const h = image.height * scale
        context.drawImage(image, (SIZE - w) / 2, (SIZE - h) / 2, w, h)
      } else {
        const inset = SIZE * 0.16
        context.drawImage(
          image,
          inset,
          inset,
          SIZE - inset * 2,
          SIZE - inset * 2,
        )
      }
    }
  } else if (icon.type === 'glyph') {
    const image = await loadImage(
      `data:image/svg+xml;charset=utf-8,${encodeURIComponent(await glyphMarkup(icon.glyph, hud))}`,
    )
    if (image) {
      const inset = SIZE * 0.22
      context.drawImage(image, inset, inset, SIZE - inset * 2, SIZE - inset * 2)
    }
  }

  context.strokeStyle = hud
  context.lineWidth = 6
  context.strokeRect(3, 3, SIZE - 6, SIZE - 6)

  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.anisotropy = 8
  return texture
}
