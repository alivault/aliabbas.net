import { useState } from 'react'
import type { ReactNode } from 'react'
import { motion, useReducedMotion } from 'motion/react'

interface PageAnimationProps {
  children: ReactNode
}

// The page transition already moves the page, so skip the fade-up then.
function isViewTransitionActive() {
  if (typeof document === 'undefined') return false
  const doc = document as Document & { activeViewTransition?: unknown }
  return doc.activeViewTransition != null
}

export default function PageAnimation({ children }: PageAnimationProps) {
  const reduceMotion = useReducedMotion()
  const [skipEntrance] = useState(isViewTransitionActive)

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
