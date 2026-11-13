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
