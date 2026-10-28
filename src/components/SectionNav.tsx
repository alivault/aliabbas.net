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
  const barRef = useRef<HTMLDivElement>(null)
  const [stuck, setStuck] = useState(false)
  const [activeId, setActiveId] = useState<string | null>(null)

  // Measured on scroll, on resize and on a theme change, once per frame.
  // The row is stuck when it sits at the header line and the page has
  // scrolled. The section in view is the last one whose top has passed the
  // bottom of the row.
  useEffect(() => {
    let frame = 0
    const measure = () => {
      frame = 0
      const bar = barRef.current?.getBoundingClientRect()
      setStuck(
        window.innerWidth >= 1024 &&
          bar != null &&
          Math.round(bar.top) <= HEADER_HEIGHT &&
          window.scrollY > 0,
      )
      const barBottom = bar?.bottom ?? 0
      const line = Math.max(barBottom, HEADER_HEIGHT) + 80
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
    const scheme = window.matchMedia('(prefers-color-scheme: dark)')
    measure()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    scheme.addEventListener('change', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      scheme.removeEventListener('change', onScroll)
      if (frame) cancelAnimationFrame(frame)
    }
  }, [items])

  return (
    <>
      <div
        ref={barRef}
        data-stuck={stuck || undefined}
        className={cn(
          'group/bar relative z-40 -mx-5 px-5 py-3 sm:-mx-8 sm:px-8 lg:sticky lg:top-[72px] lg:-mx-12 lg:px-12',
          className,
        )}
      >
        {/* The surface only fades its opacity. Its colors never animate, so
            a theme switch cannot catch them in a transition. */}
        <div
          aria-hidden="true"
          className="border-foreground/10 bg-background/85 pointer-events-none absolute inset-0 -z-10 border-b opacity-0 backdrop-blur-[12px] backdrop-saturate-[1.8] transition-opacity duration-300 lg:group-data-stuck/bar:opacity-100"
        />
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
