import { motion, useReducedMotion } from 'motion/react'
import type { ReactNode } from 'react'

interface PageAnimationProps {
  children: ReactNode
}

export default function PageAnimation({ children }: PageAnimationProps) {
  const reduceMotion = useReducedMotion()

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: reduceMotion ? 0 : 0.55,
        ease: [0.22, 1, 0.36, 1],
      }}
    >
      {children}
    </motion.div>
  )
}
