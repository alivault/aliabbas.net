import { useState } from 'react'
import type { ReactNode } from 'react'
import { getActiveViewTransition } from '~/lib/page-transition'

/**
 * The page fades up on load. The animation is CSS, so the server-rendered
 * page paints at once (animate-enter-up). A page transition
 * already moves the page, so the entrance is skipped then.
 */
export default function PageAnimation({ children }: { children: ReactNode }) {
  const [skipEntrance] = useState(() => getActiveViewTransition() != null)
  return (
    <div className={skipEntrance ? undefined : 'animate-enter-up'}>
      {children}
    </div>
  )
}
