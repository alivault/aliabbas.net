import { useEffect, useState } from 'react'
import { cn } from '~/lib/utils'

/**
 * The surface behind the top corners of the HUD on a page: the same blur,
 * fill and edge as the header of the old site. It shows when the page
 * scrolls, so text that scrolls up goes under it, not through the HUD.
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
        'border-foreground/10 bg-background/80 h-header pointer-events-none absolute inset-x-0 top-0 border-b backdrop-blur-[12px] backdrop-saturate-[1.8] transition-opacity duration-300',
        scrolled ? 'opacity-100' : 'opacity-0',
      )}
    />
  )
}
