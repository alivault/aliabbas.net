// Page transition: the current page scales down and fades out, and the next
// page slides in from the bottom. The CSS lives in src/styles/globals.css.

export const PAGE_TRANSITION_TYPE = 'page'

/**
 * Returns the view transition types for a navigation.
 * Returns `false` to skip the transition (same page or reduced motion).
 */
export function pageTransitionTypes({
  fromLocation,
  pathChanged,
  toLocation,
}: {
  fromLocation?: { pathname: string }
  pathChanged: boolean
  toLocation: { pathname: string }
}): Array<string> | false {
  if (!pathChanged) return false
  // Chat and the claim checker are two modes of one page. Their layout
  // animates the switch (see src/routes/_assistant.tsx).
  if (
    fromLocation &&
    isAssistantPath(fromLocation.pathname) &&
    isAssistantPath(toLocation.pathname)
  ) {
    return false
  }
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return false
  }
  return [PAGE_TRANSITION_TYPE]
}

function isAssistantPath(pathname: string) {
  return pathname === '/chat' || pathname.startsWith('/check')
}

type ActiveViewTransition = { finished: Promise<void> }

/** Returns the running view transition, if any. */
export function getActiveViewTransition(): ActiveViewTransition | null {
  if (typeof document === 'undefined') return null
  const doc = document as Document & {
    activeViewTransition?: ActiveViewTransition | null
  }
  return doc.activeViewTransition ?? null
}
