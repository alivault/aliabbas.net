import { motion } from 'motion/react'
import type { ReactNode } from 'react'

interface PageAnimationProps {
  children: ReactNode
}

export default function PageAnimation({ children }: PageAnimationProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  )
}
