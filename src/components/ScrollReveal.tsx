import { motion, useReducedMotion } from 'motion/react'
import type { ReactNode } from 'react'

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

export default function ScrollReveal({
  as = 'div',
  children,
  className,
  delay = 0,
  amount = 0.15,
  trigger = 'viewport',
}: ScrollRevealProps) {
  const reduceMotion = useReducedMotion()
  const Component = revealElements[as]

  return (
    <Component
      initial={reduceMotion ? false : { opacity: 0, y: 24 }}
      animate={trigger === 'mount' ? { opacity: 1, y: 0 } : undefined}
      whileInView={trigger === 'viewport' ? { opacity: 1, y: 0 } : undefined}
      viewport={{ once: true, amount }}
      transition={{
        delay,
        duration: reduceMotion ? 0 : 0.7,
        ease: [0.22, 1, 0.36, 1],
      }}
      className={className}
    >
      {children}
    </Component>
  )
}
