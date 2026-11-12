import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { DURATIONS, EASE_IN } from '~/lib/design/motion'
import { play, savedChoice, setSound } from '~/lib/sound'
import { setWorld, useWorld } from './store'

/**
 * The first visit starts here: a choice to enter with sound or in silence.
 * Browsers start audio only after a gesture, and this is that gesture. Later
 * visits skip the gate. With sound on, the first click or key starts it.
 */
export default function EnterGate({ active }: { active: boolean }) {
  const entered = useWorld((s) => s.entered)
  const [choice, setChoice] = useState<boolean | null | undefined>(undefined)

  useEffect(() => {
    const saved = savedChoice()
    setChoice(saved)
    if (saved === null) return
    setWorld({ entered: true })
    if (!saved) return
    const start = () => {
      setSound(true)
      remove()
    }
    const remove = () => {
      window.removeEventListener('pointerdown', start)
      window.removeEventListener('keydown', start)
    }
    window.addEventListener('pointerdown', start)
    window.addEventListener('keydown', start)
    return remove
  }, [])

  const enter = (withSound: boolean) => {
    setSound(withSound)
    if (withSound) play('portal-in')
    setWorld({ entered: true })
  }

  // Before hydration the choice is unknown: show nothing.
  const show = active && choice === null && !entered

  return (
    <AnimatePresence>
      {show ? (
        <motion.div
          key="gate"
          data-hud
          role="dialog"
          aria-modal="true"
          aria-labelledby="gate-title"
          exit={{ opacity: 0 }}
          transition={{ duration: DURATIONS.page, ease: EASE_IN }}
          className="font-hud text-hud bg-ground/70 fixed inset-0 z-40 flex flex-col items-center justify-center gap-16 text-sm tracking-[0.42em] uppercase backdrop-blur-sm [&_:is(button,a,input)]:uppercase"
        >
          <h1 id="gate-title" className="text-lg">
            Ali Abbas
          </h1>
          <div className="flex flex-col items-center gap-6 sm:flex-row sm:gap-16">
            <button
              type="button"
              autoFocus
              data-sound="none"
              className="focus-visible:outline-hud hover:opacity-70 focus-visible:outline-1 focus-visible:outline-offset-8"
              onClick={() => enter(true)}
            >
              Enter with sound
            </button>
            <button
              type="button"
              data-sound="none"
              className="focus-visible:outline-hud hover:opacity-70 focus-visible:outline-1 focus-visible:outline-offset-8"
              onClick={() => enter(false)}
            >
              Enter in silence
            </button>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}
