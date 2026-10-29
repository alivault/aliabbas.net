/**
 * Motion tokens. Every Motion transition on the site uses one of these, so
 * the same kind of change moves the same way on every page. The root sets
 * `MotionConfig reducedMotion="user"`: with reduced motion on, transforms
 * stop and only opacity changes.
 */

/** Springs, by what they move. */
export const SPRINGS = {
  /** Panels and cards that move or resize: the evidence panel, a docked card. */
  layout: { type: 'spring', stiffness: 380, damping: 36 },
  /** Items that enter a list, and indicators that slide: sources, claim parts, the mode pill. */
  settle: { type: 'spring', stiffness: 420, damping: 34 },
  /** Small marks that appear: citation chips and counts. A short overshoot. */
  pop: { type: 'spring', stiffness: 540, damping: 27 },
  /** Decorative pieces on the home page that bloom in. A visible bounce. */
  bloom: { type: 'spring', stiffness: 220, damping: 18 },
  /** Decorative pieces that answer the pointer. A quick bounce. */
  hover: { type: 'spring', stiffness: 320, damping: 18 },
} as const

/** For things that enter: fast at the start, a soft stop. */
export const EASE_OUT = [0.22, 1, 0.36, 1] as const

/** For things that leave: a slow start, then fast. */
export const EASE_IN = [0.64, 0, 0.78, 0] as const

/** Durations in seconds, for timed changes. */
export const DURATIONS = {
  /** A message or panel that enters. */
  enter: 0.28,
  /** Something that leaves. Exits are shorter than entries. */
  exit: 0.2,
  /** A full view that replaces another. */
  page: 0.55,
  /** Content that comes into view as the page scrolls, and the mobile menu. */
  reveal: 0.7,
  /** Large decorative pieces on the home page. */
  showcase: 1.1,
} as const

export type SpringName = keyof typeof SPRINGS
