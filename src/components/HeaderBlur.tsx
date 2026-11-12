import { useEffect, useState } from 'react'
import { cn } from '~/lib/utils'

/**
 * The surface behind the HUD at the top of a page in the old layout: the
 * same blur as the sticky section nav. It shows when the page scrolls, so
 * text that scrolls up goes under it, not through the HUD. It has no edge:
 * the section nav, when stuck under it, has the edge.
 */
export default function HeaderBlur() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 0)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <div
      aria-hidden="true"
      className={cn(
        'bg-background/85 h-header pointer-events-none fixed inset-x-0 top-0 z-50 backdrop-blur-[12px] backdrop-saturate-[1.8] transition-opacity duration-300',
        scrolled ? 'opacity-100' : 'opacity-0',
      )}
    />
  )
}
