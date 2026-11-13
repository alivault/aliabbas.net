import { useEffect, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { AnimatePresence, motion } from 'motion/react'
import { DURATIONS, EASE_IN } from '~/lib/design/motion'
import { play, savedChoice, setSound } from '~/lib/sound'
import { setWorld, useWorld } from './store'

/** A stable ref: it focuses the element once, when it mounts. */
const focusOnMount = (element: HTMLElement | null) =>
  element?.focus({ preventScroll: true })

const link =
  'hud-fill decoration-hud/50 underline underline-offset-[0.35em] decoration-1'

/**
 * Each visit to the world starts here: who Ali is, in a few lines, and one
 * Enter. Browsers start audio only after a gesture, and Enter is that
 * gesture: the music starts, unless the visitor turned the sound off on an
 * earlier visit. A link in the text enters too, and opens its page.
 */
export default function EnterGate({ active }: { active: boolean }) {
  const entered = useWorld((s) => s.entered)
  // Before hydration, show nothing: the server does not know if the world
  // can draw.
  const [hydrated, setHydrated] = useState(false)
  useEffect(() => setHydrated(true), [])

  // A visitor who chose sound before, and opens a page first (no gate
  // there): the first click or key starts it again.
  useEffect(() => {
    if (savedChoice() !== true) return
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

  const enter = () => {
    const withSound = savedChoice() !== false
    setSound(withSound)
    if (withSound) play('portal-in')
    setWorld({ entered: true })
  }

  const show = active && hydrated && !entered

  return (
    <AnimatePresence>
      {show ? (
        <motion.div
          key="gate"
          data-hud
          role="dialog"
          aria-modal="true"
          aria-labelledby="gate-title"
          aria-describedby="gate-intro"
          // The dialog takes the focus, not a control: a control with focus
          // at load shows as chosen. Tab goes to the first link.
          tabIndex={-1}
          ref={focusOnMount}
          exit={{ opacity: 0 }}
          transition={{ duration: DURATIONS.page, ease: EASE_IN }}
          className="font-hud text-hud bg-ground/85 fixed inset-0 z-40 flex flex-col items-center justify-center-safe gap-10 overflow-y-auto px-6 py-16 text-center tracking-[0.28em] uppercase backdrop-blur-sm outline-none sm:gap-12 sm:px-16 sm:tracking-[0.42em] [&_:is(button,a)]:uppercase"
        >
          <h1 id="gate-title" className="sr-only">
            Ali Abbas
          </h1>
          <p
            id="gate-intro"
            className="max-w-[72rem] text-sm leading-[2.1] text-balance sm:text-xl lg:text-2xl"
          >
            Ali Abbas is a senior frontend and design engineer. He builds
            interactive and streaming interfaces, after fifteen years in brand
            and product design. His recent work includes{' '}
            <Link
              to="/work/$slug"
              params={{ slug: 'pico' }}
              onClick={enter}
              className={link}
            >
              Pico
            </Link>
            , a workspace for AI coding agents, and{' '}
            <Link
              to="/work/$slug"
              params={{ slug: 'whimcall' }}
              onClick={enter}
              className={link}
            >
              Whimcall
            </Link>
            , video calls from a link. He lives and works in the Los Angeles
            area.
          </p>
          <button
            type="button"
            data-sound="none"
            className="hud-fill text-base"
            onClick={enter}
          >
            Enter
          </button>
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}
