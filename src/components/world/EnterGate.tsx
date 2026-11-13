import { Fragment, useEffect, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { DURATIONS, EASE_IN } from '~/lib/design/motion'
import { play, savedChoice, setSound } from '~/lib/sound'
import { cn } from '~/lib/utils'
import { setWorld, useWorld } from './store'

/** A stable ref: it focuses the element once, when it mounts. */
const focusOnMount = (element: HTMLElement | null) =>
  element?.focus({ preventScroll: true })

const link =
  'hud-fill decoration-hud/50 underline underline-offset-[0.35em] decoration-1'

type Part = { text: string; slug?: 'pico' | 'whimcall' }

/** The intro, in parts: a part with a slug links to its case study. */
const INTRO: Array<Part> = [
  {
    text: 'Ali Abbas is a senior frontend and design engineer. He builds interactive and streaming interfaces, after fifteen years in brand and product design. His recent work includes ',
  },
  { text: 'Pico', slug: 'pico' },
  { text: ', a workspace for AI coding agents, and ' },
  { text: 'Whimcall', slug: 'whimcall' },
  {
    text: ', video calls from a link. He lives and works in the Los Angeles area.',
  },
]
const LENGTH = INTRO.reduce((sum, part) => sum + part.text.length, 0)

/** Milliseconds before the next letter: a short pause after punctuation. */
function delayAfter(character: string) {
  if (character === '.') return 260
  if (character === ',') return 110
  return 8 + Math.random() * 10
}

/**
 * The intro, typed in letter by letter as in a terminal, with a block
 * cursor after the last letter. The whole text is on the page from the
 * start, so the layout does not move and screen readers read all of it:
 * the letters not yet typed are transparent. A click on the text ends the
 * typing. With reduced motion, the text shows at once.
 */
function TypedIntro({ onEnter }: { onEnter: () => void }) {
  const reduceMotion = useReducedMotion()
  const [typed, setTyped] = useState(0)
  const done = reduceMotion || typed >= LENGTH
  const characters = INTRO.map((part) => part.text).join('')

  useEffect(() => {
    if (done) return
    const timer = window.setTimeout(
      () => setTyped((count) => count + 1),
      typed === 0 ? 500 : delayAfter(characters[typed - 1]),
    )
    return () => window.clearTimeout(timer)
  }, [typed, done, characters])

  let index = 0
  const letters = (text: string) =>
    Array.from(text, (character) => {
      const at = index++
      // The cursor sits on the next letter to type, and after the last
      // letter at the end. It is out of the flow of the text (absolute in
      // its letter): a box in the flow, even with no width, is a place
      // where a line can break, so lines broke in the middle of a word
      // while the cursor was in it, and the text jumped.
      const cursor = done
        ? at === LENGTH - 1 && <Cursor after blink={!reduceMotion} />
        : at === typed && <Cursor />
      return (
        <span
          key={at}
          className={cn(
            cursor && 'relative',
            !done && at >= typed && 'text-transparent',
          )}
        >
          {character}
          {cursor || null}
        </span>
      )
    })

  return (
    <p
      id="gate-intro"
      onPointerDown={() => setTyped(LENGTH)}
      className="max-w-[72rem] text-sm leading-[2.1] text-balance sm:text-xl lg:text-2xl"
    >
      {INTRO.map((part) =>
        part.slug ? (
          <Link
            key={part.slug}
            to="/work/$slug"
            params={{ slug: part.slug }}
            onClick={onEnter}
            // The link draws the line under its letters: the line shows
            // when the first letter is typed.
            className={cn(
              link,
              !done && typed <= index && 'decoration-transparent',
            )}
          >
            {letters(part.text)}
          </Link>
        ) : (
          <Fragment key={part.text}>{letters(part.text)}</Fragment>
        ),
      )}
    </p>
  )
}

/**
 * A block cursor, as tall as a capital letter, over its letter (or after
 * it). It is absolute, so it takes no room in the text.
 */
function Cursor({
  after = false,
  blink = false,
}: {
  after?: boolean
  blink?: boolean
}) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'bg-hud absolute bottom-[0.32em] h-[1em] w-[0.6em]',
        after ? 'left-full' : 'left-[0.1em]',
        blink && 'animate-cursor-blink',
      )}
    />
  )
}

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
          tabIndex={-1}
          exit={{ opacity: 0 }}
          transition={{ duration: DURATIONS.page, ease: EASE_IN }}
          className="font-hud text-hud bg-ground/85 fixed inset-0 z-40 flex flex-col items-center justify-center-safe gap-10 overflow-y-auto px-6 py-16 text-center tracking-[0.28em] uppercase backdrop-blur-sm outline-none sm:gap-12 sm:px-16 sm:tracking-[0.42em] [&_:is(button,a)]:uppercase"
        >
          <h1 id="gate-title" className="sr-only">
            Ali Abbas
          </h1>
          <TypedIntro onEnter={enter} />
          {/* Enter has the focus at once, so Enter or Space goes in. */}
          <button
            ref={focusOnMount}
            type="button"
            data-sound="hover"
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
