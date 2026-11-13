/**
 * Where the icon of a full-width page (the lab) rests: a square before its
 * title, in the top left. The page leaves the square empty, and the camera
 * puts the cube in it. The numbers match the layout of the lab page
 * (src/routes/lab.tsx): its padding, its width and the site header.
 */
export const ICON_SLOT_SIZE = 64

/** The --header-height of the site, in CSS pixels. */
const HEADER = 60
const MAX_WIDTH = 1440

/** The middle of the square and its side, in CSS pixels of the screen. */
export function iconSlot(width: number, height: number) {
  const pad = width >= 640 ? 64 : 24
  const left = Math.max(0, (width - MAX_WIDTH) / 2) + pad
  const top = HEADER + height * 0.14
  return {
    x: left + ICON_SLOT_SIZE / 2,
    y: top + ICON_SLOT_SIZE / 2,
    size: ICON_SLOT_SIZE,
  }
}
