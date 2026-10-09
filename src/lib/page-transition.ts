// Page transition: the current page scales down and fades out, and the next
// page slides in from the bottom. The CSS lives in src/styles/globals.css.

export const PAGE_TRANSITION_TYPE = 'page'

/**
 * Returns the view transition types for a navigation.
 * Returns `false` to skip the transition (same page or reduced motion).
 */
export function pageTransitionTypes({
  pathChanged,
}: {
  pathChanged: boolean
}): Array<string> | false {
  if (!pathChanged) return false
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return false
  }
  return [PAGE_TRANSITION_TYPE]
}
