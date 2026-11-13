import { memo } from 'react'
import type { CSSProperties } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import { cn } from '~/lib/utils'

/**
 * Text with a band of light that sweeps across it, for a state that waits
 * ("Thinking"). After the Shimmer of shadcn's AI Elements: the text is a
 * clip of two backgrounds, a flat base color and a narrow light band, and
 * the band moves from right to left. The band is wider for longer text.
 * With reduced motion, the text is still, in the base color.
 */
function Shimmer({
  children,
  className,
  duration = 2,
  spread = 4,
}: {
  children: string
  className?: string
  /** Seconds for one sweep. */
  duration?: number
  /** Half the width of the band, in pixels for each letter. */
  spread?: number
}) {
  const reduceMotion = useReducedMotion()
  if (reduceMotion) return <span className={className}>{children}</span>
  return (
    <motion.span
      initial={{ backgroundPosition: '100% center' }}
      animate={{ backgroundPosition: '0% center' }}
      transition={{ duration, ease: 'linear', repeat: Infinity }}
      className={cn(
        'inline-block bg-clip-text [background-repeat:no-repeat,padding-box] [background-size:250%_100%,auto]',
        className,
        // Last, so a color in className does not hide the clip.
        'text-transparent',
      )}
      style={
        {
          '--spread': `${children.length * spread}px`,
          backgroundImage:
            'linear-gradient(90deg, #0000 calc(50% - var(--spread)), var(--color-foreground), #0000 calc(50% + var(--spread))), linear-gradient(var(--color-hud), var(--color-hud))',
        } as CSSProperties
      }
    >
      {children}
    </motion.span>
  )
}

export default memo(Shimmer)
