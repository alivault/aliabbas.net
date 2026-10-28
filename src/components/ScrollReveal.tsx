import { useLayoutEffect, useRef, useState } from 'react'
import type { CSSProperties, ReactNode } from 'react'
import { motion, useAnimationControls, useInView } from 'motion/react'
import { cn } from '~/lib/utils'

const revealElements = {
  article: motion.article,
  div: motion.div,
  footer: motion.footer,
  header: motion.header,
  li: motion.li,
  section: motion.section,
} as const

type RevealElement = keyof typeof revealElements

type ScrollRevealProps = {
  as?: RevealElement
  children: ReactNode
  className?: string
  delay?: number
  amount?: number
  trigger?: 'mount' | 'viewport'
}

const HIDDEN = { opacity: 0, y: 24 }

// useLayoutEffect warns on the server; this runs only in the browser.
const useBrowserLayoutEffect =
  typeof window === 'undefined' ? () => undefined : useLayoutEffect

/**
 * Fades content up. The server sends it visible, with a CSS entrance, so
 * content in the first screen paints without JavaScript. In the browser,
 * content below the fold is hidden before the first paint and fades up when
 * it scrolls into view. The visitor never sees it hidden, because it is off
 * screen when that happens.
 */
export default function ScrollReveal({
  as = 'div',
  children,
  className,
  delay = 0,
  amount = 0.15,
  trigger = 'viewport',
}: ScrollRevealProps) {
  const Component = revealElements[as]
  const ref = useRef<HTMLElement>(null)
  const controls = useAnimationControls()
  const [waiting, setWaiting] = useState(false)
  const inView = useInView(ref, { once: true, amount })

  useBrowserLayoutEffect(() => {
    const element = ref.current
    if (!element || trigger === 'mount') return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    if (element.getBoundingClientRect().top < window.innerHeight) return
    // A CSS animation wins over inline styles, so remove it first.
    element.style.animation = 'none'
    controls.set(HIDDEN)
    setWaiting(true)
  }, [])

  useBrowserLayoutEffect(() => {
    if (!waiting || !inView) return
    void controls.start({
      opacity: 1,
      y: 0,
      transition: { delay, duration: 0.7, ease: [0.22, 1, 0.36, 1] },
    })
  }, [waiting, inView])

  return (
    <Component
      ref={ref as never}
      initial={false}
      animate={controls}
      className={cn('enter-up', className)}
      style={
        {
          '--enter-delay': `${Math.round(delay * 1000)}ms`,
          '--enter-distance': '24px',
          '--enter-duration': '700ms',
        } as CSSProperties
      }
    >
      {children}
    </Component>
  )
}
