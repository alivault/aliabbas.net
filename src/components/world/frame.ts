/**
 * On a wide screen, a page, its icon and its panels stay in a frame of at
 * most FRAME_MAX pixels in the middle of the screen, so they do not spread
 * to the edges of an ultrawide display. The world still fills the screen.
 * The CSS variable --frame-inset (globals.css) is the same space.
 */
export const FRAME_MAX = 1920

/** The space on each side of the frame, in CSS pixels. */
export function frameInset(width: number) {
  return Math.max(0, (width - FRAME_MAX) / 2)
}

/**
 * Where a share of the frame's width is on the screen, from -1 (left edge)
 * to 1 (right edge). `at` is from 0 (the frame's left) to 1 (its right).
 */
export function frameScreenX(width: number, at: number) {
  const inset = frameInset(width)
  const x = inset + at * (width - 2 * inset)
  return (2 * x) / width - 1
}
