/**
 * A move to a clicked point is a dash: much faster than a run, and it slows
 * down near the end (CLICK_EASE per second of the distance that is left).
 */
export const CLICK_WALK = 40
export const CLICK_EASE = 4

/**
 * How long a dash over `distance` meters takes to look done, and where in
 * it the camera is fastest (a part of the duration). It runs at CLICK_WALK
 * until 10 m are left (CLICK_WALK / CLICK_EASE), then slows; it looks done
 * with half a meter left. The camera needs about 0.15 s to reach speed.
 */
export function dashTiming(distance: number) {
  const slow = CLICK_WALK / CLICK_EASE
  const lag = 0.15
  const cruise = Math.max(0, distance - slow) / CLICK_WALK
  const ease =
    Math.log(Math.max(1, Math.min(distance, slow) / 0.5)) / CLICK_EASE
  const duration = Math.max(0.35, lag + cruise + ease)
  return { duration, peak: Math.min(0.5, (lag + cruise) / duration) }
}

/** The space between the square and the edges of the view, in radians. */
const VIEW_MARGIN = 0.06

/**
 * How far from the middle of a square on the ground the camera must stand
 * to see all of it, also when a corner of the square points to the camera:
 * the near corner above the bottom of the view, and the side corners
 * inside its sides. The corners are half a diagonal from the middle.
 */
export function standOff({
  size,
  drop,
  pitch,
  halfHeight,
  halfWidth,
}: {
  /** The side of the square, in meters. */
  size: number
  /** How far the eye is over the square, in meters. */
  drop: number
  /** Up from level, in radians. */
  pitch: number
  /** Half the view, up and down and across, in radians. */
  halfHeight: number
  halfWidth: number
}) {
  const corner = (size * Math.SQRT2) / 2
  // The bottom of the view, down from level. A view that looks up sees
  // the ground only far away: no nearer than 0.1 rad down.
  const bottom = Math.max(0.1, halfHeight - pitch - VIEW_MARGIN)
  const below = corner + Math.max(0.5, drop) / Math.tan(bottom)
  const across = corner / Math.tan(Math.max(0.1, halfWidth - VIEW_MARGIN))
  return Math.max(below, across)
}
