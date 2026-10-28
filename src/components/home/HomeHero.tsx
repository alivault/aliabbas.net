import { useCallback, useEffect, useRef, useState } from 'react'
import type { CSSProperties } from 'react'
import { ArrowDown, Pause, Play } from 'lucide-react'
import { motion, useReducedMotion } from 'motion/react'
import PageHeading from '~/components/PageHeading'
import ConnectedGlobe from './ConnectedGlobe'

const productDescriptors = [
  'interactive',
  'streaming',
  'accessible',
  'performant',
  'resilient',
  'intuitive',
  'polished',
  'cohesive',
] as const

const AUTOPLAY_MS = 4000

const scrambleCharacters = Array.from(
  'abcdefghijklmnopqrstuvwxyz0123456789∆⟐⌬⎔⏣◈◇◆░▒▓╳⌁∿λΩΣΨϟ',
)

function scrambleWord(word: string, revealedCharacters: number) {
  return Array.from(word, (character, index) => {
    if (index < revealedCharacters || character === '-') return character
    return (
      scrambleCharacters[
        Math.floor(Math.random() * scrambleCharacters.length)
      ] ?? character
    )
  }).join('')
}

// The intro is CSS (.enter-blur in globals.css), so the server-rendered
// heading paints at once and does not wait for hydration. Delays in ms.
const INTRO_START = 120
const LINE_STAGGER = 500
const CHARACTER_STAGGER = 25
const ARROW_DELAY = 210

function enterDelay(ms: number) {
  return { '--enter-delay': `${ms}ms` } as CSSProperties
}

function TitleCharacters({ text, delay }: { text: string; delay: number }) {
  return Array.from(text).map((character, index) => (
    <span
      key={`${character}-${index}`}
      className="enter-blur inline-block"
      style={enterDelay(delay + index * CHARACTER_STAGGER)}
      aria-hidden="true"
    >
      {character === ' ' ? '\u00a0' : character}
    </span>
  ))
}

// Screen readers do not reliably read aria-label on a plain span, so the
// line has real, visually hidden text. The animated letters are hidden.
function TitleLine({
  className,
  delay,
  text,
}: {
  className: string
  delay: number
  text: string
}) {
  return (
    <span className={className}>
      <span className="sr-only">{text}</span>
      <TitleCharacters text={text} delay={delay} />
    </span>
  )
}

export function HomeHero() {
  const reduceMotion = useReducedMotion()
  const [descriptorIndex, setDescriptorIndex] = useState(0)
  const [displayDescriptor, setDisplayDescriptor] = useState<string>(
    productDescriptors[0],
  )
  const [isScrambling, setIsScrambling] = useState(false)
  // The word changes by itself. WCAG 2.2.2 needs a way to pause that, so the
  // visitor can pause it, and it also pauses on hover and focus, while the
  // tab is hidden, and when the visitor prefers reduced motion.
  const [paused, setPaused] = useState(false)
  const [interacting, setInteracting] = useState(false)
  const [pageHidden, setPageHidden] = useState(false)
  const autoplay = !paused && !interacting && !pageHidden && !reduceMotion
  const scrambleIntervalRef = useRef<number | null>(null)

  useEffect(
    () => () => {
      if (scrambleIntervalRef.current !== null) {
        window.clearInterval(scrambleIntervalRef.current)
      }
    },
    [],
  )

  const changeDescriptor = useCallback(() => {
    if (isScrambling) return

    const nextIndex = (descriptorIndex + 1) % productDescriptors.length
    const nextDescriptor = productDescriptors[nextIndex]
    setDescriptorIndex(nextIndex)

    if (reduceMotion) {
      setDisplayDescriptor(nextDescriptor)
      return
    }

    const totalFrames = 14
    let frame = 0
    setIsScrambling(true)
    setDisplayDescriptor(scrambleWord(nextDescriptor, 0))
    scrambleIntervalRef.current = window.setInterval(() => {
      frame += 1
      const revealedCharacters = Math.floor(
        (frame / totalFrames) * nextDescriptor.length,
      )
      setDisplayDescriptor(
        frame >= totalFrames
          ? nextDescriptor
          : scrambleWord(nextDescriptor, revealedCharacters),
      )

      if (frame >= totalFrames) {
        if (scrambleIntervalRef.current !== null) {
          window.clearInterval(scrambleIntervalRef.current)
          scrambleIntervalRef.current = null
        }
        setIsScrambling(false)
      }
    }, 38)
  }, [descriptorIndex, isScrambling, reduceMotion])

  useEffect(() => {
    const update = () => setPageHidden(document.hidden)
    update()
    document.addEventListener('visibilitychange', update)
    return () => document.removeEventListener('visibilitychange', update)
  }, [])

  useEffect(() => {
    if (!autoplay) return
    const autoplayInterval = window.setInterval(changeDescriptor, AUTOPLAY_MS)
    return () => window.clearInterval(autoplayInterval)
  }, [autoplay, changeDescriptor])

  const currentDescriptor = productDescriptors[descriptorIndex]

  return (
    <section className="site-noise bg-background text-foreground relative flex flex-1 overflow-hidden pt-[72px]">
      <ConnectedGlobe />
      <div className="pointer-events-none relative z-10 mx-auto flex w-full max-w-[1600px] flex-col px-5 pt-9 pb-7 sm:px-8 sm:pt-14 lg:px-12 lg:pt-16">
        <div className="flex flex-1 items-center justify-center text-center sm:mt-auto sm:flex-none lg:justify-start lg:text-left">
          <PageHeading size="hero" className="w-fit max-w-full">
            <TitleLine
              text="I design and build"
              delay={INTRO_START}
              className="block whitespace-nowrap"
            />
            <motion.button
              type="button"
              style={enterDelay(INTRO_START + LINE_STAGGER)}
              onClick={changeDescriptor}
              onPointerEnter={() => setInteracting(true)}
              onPointerLeave={() => setInteracting(false)}
              onFocus={() => setInteracting(true)}
              onBlur={() => setInteracting(false)}
              whileHover={reduceMotion ? undefined : { scale: 1.015 }}
              whileTap={reduceMotion ? undefined : { scale: 0.985 }}
              className="enter-blur text-brand focus-visible:ring-brand/70 pointer-events-auto inline-block cursor-pointer border-0 bg-transparent p-0 text-center normal-case outline-none focus-visible:ring-2 lg:text-left"
              // The name is only the word, so the heading reads as one
              // sentence. The title tells what a press does.
              aria-label={currentDescriptor}
              title="Show the next word"
            >
              <motion.span
                aria-hidden="true"
                className="block"
                animate={
                  isScrambling
                    ? {
                        opacity: [1, 0.65, 1],
                        filter: ['blur(0px)', 'blur(2px)', 'blur(0px)'],
                      }
                    : { opacity: 1, filter: 'blur(0px)' }
                }
                transition={{ duration: 0.5, ease: 'easeOut' }}
              >
                {displayDescriptor}
              </motion.span>
            </motion.button>
            <TitleLine
              text="digital products."
              delay={INTRO_START + LINE_STAGGER * 2}
              className="block whitespace-nowrap"
            />
          </PageHeading>
        </div>

        <div className="relative flex justify-center pt-5 sm:mt-auto">
          {!reduceMotion && (
            <button
              type="button"
              style={enterDelay(ARROW_DELAY)}
              onClick={() => setPaused((value) => !value)}
              aria-pressed={paused}
              aria-label="Pause the changing word"
              title={
                paused ? 'Play the changing word' : 'Pause the changing word'
              }
              className="enter-blur border-foreground/20 text-foreground/55 hover:text-foreground focus-visible:ring-brand/70 pointer-events-auto absolute bottom-2 left-0 flex size-10 items-center justify-center rounded-full border outline-none focus-visible:ring-2"
            >
              {paused ? (
                <Play aria-hidden="true" className="size-4" />
              ) : (
                <Pause aria-hidden="true" className="size-4" />
              )}
            </button>
          )}
          <a
            href="#stack-marquee"
            style={enterDelay(ARROW_DELAY)}
            className="enter-blur border-foreground/25 hover:bg-brand hover:text-brand-foreground pointer-events-auto mx-auto flex size-14 items-center justify-center rounded-full border transition-colors"
            aria-label="View technology stack"
          >
            <ArrowDown className="size-5" />
          </a>
        </div>
      </div>
    </section>
  )
}
