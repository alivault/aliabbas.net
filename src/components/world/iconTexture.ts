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
 * The texture of an icon in the world. A project shows its app icon on a
 * clear square. A page shows a glyph on a dark tile with the edge and the
 * line color of the HUD.
 */
export async function drawIcon(icon: SheetIcon) {
  const canvas = document.createElement('canvas')
  canvas.width = SIZE
  canvas.height = SIZE
  const context = canvas.getContext('2d')!

  if (icon.type === 'image') {
    const image = await loadImage(icon.src)
    if (image) {
      if (icon.cover) {
        const scale = Math.max(SIZE / image.width, SIZE / image.height)
        const w = image.width * scale
        const h = image.height * scale
        context.drawImage(image, (SIZE - w) / 2, (SIZE - h) / 2, w, h)
      } else {
        context.drawImage(image, 0, 0, SIZE, SIZE)
      }
    }
  } else {
    const hud = cssColor('--hud', '#e0501f')
    // A dark tile, a little warmer at the top, as if lit by the sky.
    const fill = context.createLinearGradient(0, 0, 0, SIZE)
    fill.addColorStop(0, cssColor('--sky-haze', '#2a1a12'))
    fill.addColorStop(1, cssColor('--ground', '#0d0b0a'))
    context.fillStyle = fill
    context.fillRect(0, 0, SIZE, SIZE)
    context.strokeStyle = hud
    context.lineWidth = 6
    context.strokeRect(3, 3, SIZE - 6, SIZE - 6)
    const image = await loadImage(
      `data:image/svg+xml;charset=utf-8,${encodeURIComponent(await glyphMarkup(icon.glyph, hud))}`,
    )
    if (image) {
      const inset = SIZE * 0.22
      context.drawImage(image, inset, inset, SIZE - inset * 2, SIZE - inset * 2)
    }
  }

  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.anisotropy = 8
  return texture
}
