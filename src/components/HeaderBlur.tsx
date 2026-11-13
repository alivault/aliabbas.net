import { useEffect, useState } from 'react'
import { cn } from '~/lib/utils'

/**
 * The surface behind the top corners of the HUD on a page: the blur and
 * edge of the header of the old site, with a light fill (20%), so the
 * world shows through. It shows when the page scrolls, so text that
 * scrolls up goes under it, not through the HUD. Over another scroller,
 * such as the index, that scroller says when to show it (`scrolledOver`).
 */
export default function HeaderBlur({
  scrolledOver,
}: {
  scrolledOver?: boolean
}) {
  const [pageScrolled, setScrolled] = useState(false)
  const scrolled = scrolledOver ?? pageScrolled

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
        'border-foreground/10 bg-background/20 h-header pointer-events-none absolute inset-x-0 top-0 border-b backdrop-blur-[12px] backdrop-saturate-[1.8] transition-opacity duration-300',
        scrolled ? 'opacity-100' : 'opacity-0',
      )}
    />
  )
}
