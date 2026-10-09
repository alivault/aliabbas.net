import { useState } from 'react'
import type { ReactNode } from 'react'
import { getActiveViewTransition } from '~/lib/page-transition'
import { motion, useReducedMotion } from 'motion/react'

interface PageAnimationProps {
  children: ReactNode
}

export default function PageAnimation({ children }: PageAnimationProps) {
  const reduceMotion = useReducedMotion()
  // The page transition already moves the page, so skip the fade-up then.
  const [skipEntrance] = useState(() => getActiveViewTransition() != null)

  return (
    <motion.div
      initial={reduceMotion || skipEntrance ? false : { opacity: 0, y: 10 }}
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
