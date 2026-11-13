import { useEffect } from 'react'
import {
  animate,
  motion,
  useMotionValue,
  useReducedMotion,
  useTransform,
} from 'motion/react'
import { EASE_OUT } from '~/lib/design/motion'

/** Seconds for the bar to reach a finished part. */
const STEP = 0.6
/** Seconds for the slow creep toward the next part, while it waits. */
const CREEP = 12
/** How far the bar creeps into the next part before that part is done. */
const CREEP_SHARE = 0.8

/**
 * The progress of a check: a bar that never stands still while work goes
 * on. A finished part moves it to its step with an ease; then it creeps on
 * slowly into the next part, and slows down as it nears it, so a long wait
 * still moves. A band of light sweeps along the filled part while it works.
 * With reduced motion, it shows the finished parts only.
 */
export default function CheckProgress({
  done,
  total,
  splitting,
}: {
  /** Parts graded. */
  done: number
  /** Parts in all; 0 while the claim is split. */
  total: number
  splitting: boolean
}) {
  const reduceMotion = useReducedMotion()
  const progress = useMotionValue(0)
  const clip = useTransform(
    progress,
    (value) => `inset(0 ${(1 - value) * 100}% 0 0)`,
  )

  // While the claim is split, the first tenth of the bar stands for it.
  const SPLIT = 0.1
  const step = splitting ? 0 : SPLIT + ((1 - SPLIT) * done) / Math.max(total, 1)
  const next = splitting
    ? SPLIT
    : SPLIT + ((1 - SPLIT) * (done + CREEP_SHARE)) / Math.max(total, 1)

  useEffect(() => {
    if (reduceMotion) {
      progress.set(step)
      return
    }
    let creep: ReturnType<typeof animate> | undefined
    const toStep = animate(progress, Math.max(step, progress.get()), {
      duration: STEP,
      ease: EASE_OUT,
    })
    void toStep.then(() => {
      creep = animate(progress, next, { duration: CREEP, ease: 'easeOut' })
    })
    return () => {
      toStep.stop()
      creep?.stop()
    }
  }, [step, next, reduceMotion, progress])

  return (
    <div
      role="progressbar"
      aria-label="Check progress"
      aria-valuemin={0}
      aria-valuemax={Math.max(total, 1)}
      aria-valuenow={done}
      aria-valuetext={
        splitting ? 'Splitting the claim' : `${done} of ${total} parts graded`
      }
      className="bg-hud/15 relative h-0.5 overflow-hidden"
    >
      <motion.div
        className="bg-hud absolute inset-0 overflow-hidden"
        style={{ clipPath: clip }}
      >
        {reduceMotion ? null : (
          <motion.div
            aria-hidden="true"
            className="via-foreground/80 absolute inset-y-0 w-1/4 bg-gradient-to-r from-transparent to-transparent"
            initial={{ left: '-25%' }}
            animate={{ left: '100%' }}
            transition={{ duration: 1.6, ease: 'linear', repeat: Infinity }}
          />
        )}
      </motion.div>
    </div>
  )
}
