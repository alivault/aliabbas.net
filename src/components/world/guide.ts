/**
 * The guides back to the pages, for a visitor who walked away from them:
 * arrows at the edge of the screen toward the nearest icons, and a "lost"
 * state when every icon is far. The canvas measures (GuideProbe) and the
 * HUD draws (GuideArrows); this module joins the two without React renders.
 */

/** Past this distance to every icon, the visitor is lost, in meters. */
export const LOST_DISTANCE = 40

/** An icon this far is in the fog: on screen, it does not count as seen. */
const SEEN_DISTANCE = 60

/** How many arrows show at most. */
const ARROWS = 3

export type GuideArrow = {
  id: string
  title: string
  /** Radians, clockwise from ahead: 0 ahead, PI/2 right, PI behind. */
  angle: number
  /** 1 for the nearest icon, less for the next ones. */
  strength: number
}

export type GuideTarget = {
  id: string
  title: string
  /** The distance on the ground, in meters. */
  distance: number
  /** The icon in camera space: x to the right, z toward the camera. */
  viewX: number
  viewZ: number
  onScreen: boolean
}

/**
 * The arrows for this view: none while an icon is in sight, else one to
 * each of the nearest icons.
 */
export function guideArrows(targets: ReadonlyArray<GuideTarget>) {
  const seen = targets.some(
    (target) => target.onScreen && target.distance < SEEN_DISTANCE,
  )
  if (seen) return []
  return [...targets]
    .sort((a, b) => a.distance - b.distance)
    .slice(0, ARROWS)
    .map((target, rank): GuideArrow => ({
      id: target.id,
      title: target.title,
      angle: Math.atan2(target.viewX, -target.viewZ),
      strength: rank === 0 ? 1 : 0.55,
    }))
}

export function isLost(targets: ReadonlyArray<GuideTarget>) {
  return targets.every((target) => target.distance > LOST_DISTANCE)
}

let current: Array<GuideArrow> = []
const listeners = new Set<(arrows: Array<GuideArrow>) => void>()

export function publishGuide(arrows: Array<GuideArrow>) {
  if (!arrows.length && !current.length) return
  current = arrows
  for (const listener of listeners) listener(arrows)
}

export function onGuide(listener: (arrows: Array<GuideArrow>) => void) {
  listeners.add(listener)
  listener(current)
  return () => {
    listeners.delete(listener)
  }
}
