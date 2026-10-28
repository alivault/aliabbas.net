import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { scrollToSection } from '~/lib/scroll-to-section'
import { cn } from 'cn'

export type SectionNavItem = {
  id: string
  label: string
  /** Shown before the label, for example "1." */
  number?: string
}

/** The fixed site header is 72px high. */
const HEADER_HEIGHT = 72

/**
 * A row of links to the sections of a page. On wide screens it sticks
 * under the site header and fills the link of the section in view. On
 * phones it stays in the flow, because a wrapped sticky row would take a
 * quarter of the screen. Sections need `lg:scroll-mt-40`, so a jump does
 * not hide their heading under the row.
 */
export default function SectionNav({
  className,
  items,
  label,
  trailing,
}: {
  className?: string
  items: ReadonlyArray<SectionNavItem>
  /** The accessible name of the navigation. */
  label: string
  /** Content at the end of the row, such as a page setting. */
  trailing?: ReactNode
}) {
  const sentinelRef = useRef<HTMLDivElement>(null)
  const barRef = useRef<HTMLDivElement>(null)
  const [stuck, setStuck] = useState(false)
  const [activeId, setActiveId] = useState<string | null>(null)

  // The row is stuck when the point just above it has scrolled under the
  // header.
  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry) return
        setStuck(
          !entry.isIntersecting && entry.boundingClientRect.top < HEADER_HEIGHT,
        )
      },
      { rootMargin: `-${HEADER_HEIGHT + 1}px 0px 0px 0px` },
    )
    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [])

  // The section in view is the last one whose top has passed the bottom of
  // the row. Measured on scroll, once per frame.
  useEffect(() => {
    let frame = 0
    const measure = () => {
      frame = 0
      const barBottom = barRef.current?.getBoundingClientRect().bottom ?? 0
      const line = Math.max(barBottom, HEADER_HEIGHT) + 32
      let current: string | null = null
      for (const item of items) {
        const element = document.getElementById(item.id)
        if (element && element.getBoundingClientRect().top <= line)
          current = item.id
      }
      // At the end of the page, the last section counts, even if it is too
      // short to reach the line.
      const atEnd =
        window.innerHeight + window.scrollY >=
        document.documentElement.scrollHeight - 2
      if (atEnd && current) {
        const last = items.at(-1)
        const lastElement = last && document.getElementById(last.id)
        if (
          lastElement &&
          lastElement.getBoundingClientRect().top < window.innerHeight
        )
          current = last.id
      }
      setActiveId(current)
    }
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(measure)
    }
    measure()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      if (frame) cancelAnimationFrame(frame)
    }
  }, [items])

  return (
    <>
      <div ref={sentinelRef} aria-hidden="true" />
      <div
        ref={barRef}
        data-stuck={stuck || undefined}
        className={cn(
          'z-40 -mx-5 px-5 py-3 transition-[background-color,border-color,box-shadow] duration-300 sm:-mx-8 sm:px-8 lg:sticky lg:top-[72px] lg:-mx-12 lg:px-12',
          'border-b border-transparent',
          'lg:data-stuck:border-foreground/10 lg:data-stuck:bg-background/85 lg:data-stuck:backdrop-blur-[12px] lg:data-stuck:backdrop-saturate-[1.8]',
          className,
        )}
      >
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <nav aria-label={label}>
            <ol className="flex flex-wrap gap-2">
              {items.map((item) => {
                const active = item.id === activeId
                return (
                  <li key={item.id}>
                    <a
                      href={`#${item.id}`}
                      onClick={scrollToSection}
                      aria-current={active ? 'location' : undefined}
                      className={cn(
                        'focus-visible:ring-brand/70 inline-flex rounded-full px-4 py-2 text-sm font-medium transition-colors outline-none focus-visible:ring-2',
                        active
                          ? 'bg-foreground text-background'
                          : 'bg-foreground/5 hover:bg-foreground/10',
                      )}
                    >
                      {item.number && (
                        <span
                          className={cn(
                            'mr-1.5 tabular-nums',
                            active
                              ? 'text-background/60'
                              : 'text-foreground/45',
                          )}
                        >
                          {item.number}
                        </span>
                      )}
                      {item.label}
                    </a>
                  </li>
                )
              })}
            </ol>
          </nav>
          {trailing}
        </div>
      </div>
    </>
  )
}
