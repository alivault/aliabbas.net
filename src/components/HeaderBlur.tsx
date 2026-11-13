import { useEffect, useState } from 'react'
import { cn } from '~/lib/utils'

/**
 * The surface behind the top corners of the HUD on a page: a blur, the
 * same as the sticky section nav. It shows when the page scrolls, so text
 * that scrolls up goes under it, not through the HUD. It has no edge: the
 * section nav, when stuck under it, has the edge.
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
      data-header-blur
      className={cn(
        'bg-background/70 h-header pointer-events-none absolute inset-x-0 top-0 backdrop-blur-[20px] backdrop-saturate-[1.8] transition-opacity duration-300 lg:h-20',
        scrolled ? 'opacity-100' : 'opacity-0',
      )}
    />
  )
}
