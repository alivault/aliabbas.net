import { useEffect, useRef, useState } from 'react'
import { ArrowDown } from 'lucide-react'
import { motion, useReducedMotion } from 'motion/react'
import type { Variants } from 'motion/react'
import ConnectedGlobe from './ConnectedGlobe'

const productDescriptors = [
  'full-stack',
  'thoughtful',
  'intuitive',
  'accessible',
  'performant',
  'scalable',
  'resilient',
  'polished',
  'secure',
  'cohesive',
] as const

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

const introContainerVariants: Variants = {
  hidden: {},
  visible: {
    transition: {
      delayChildren: 0.12,
      staggerChildren: 0.09,
    },
  },
}

const introItemVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 18,
    filter: 'blur(12px)',
  },
  visible: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: {
      duration: 0.7,
      ease: [0.22, 1, 0.36, 1],
    },
  },
}

const titleVariants: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.5,
    },
  },
}

const titleLineVariants: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.025,
    },
  },
}

const titleCharacterVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 14,
    filter: 'blur(10px)',
  },
  visible: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: {
      duration: 0.55,
      ease: [0.22, 1, 0.36, 1],
    },
  },
}

const titleWordVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 14,
    filter: 'blur(10px)',
  },
  visible: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: {
      duration: 0.55,
      ease: [0.22, 1, 0.36, 1],
    },
  },
}

function TitleCharacters({ text }: { text: string }) {
  return Array.from(text).map((character, index) => (
    <motion.span
      key={`${character}-${index}`}
      variants={titleCharacterVariants}
      className="inline-block"
      aria-hidden="true"
    >
      {character === ' ' ? '\u00a0' : character}
    </motion.span>
  ))
}

function TitleLine({ text, className }: { text: string; className: string }) {
  return (
    <motion.span
      variants={titleLineVariants}
      className={className}
      aria-label={text}
    >
      <TitleCharacters text={text} />
    </motion.span>
  )
}

export function HomeHero() {
  const reduceMotion = useReducedMotion()
  const [descriptorIndex, setDescriptorIndex] = useState(0)
  const [displayDescriptor, setDisplayDescriptor] = useState<string>(
    productDescriptors[0],
  )
  const [isScrambling, setIsScrambling] = useState(false)
  const scrambleIntervalRef = useRef<number | null>(null)

  useEffect(
    () => () => {
      if (scrambleIntervalRef.current !== null) {
        window.clearInterval(scrambleIntervalRef.current)
      }
    },
    [],
  )

  const changeDescriptor = () => {
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
  }

  return (
    <section className="site-noise relative flex flex-1 overflow-hidden bg-[#050607] pt-[72px] text-[#f1efe8]">
      <ConnectedGlobe />
      <motion.div
        initial={reduceMotion ? false : 'hidden'}
        animate="visible"
        variants={introContainerVariants}
        className="pointer-events-none relative z-10 mx-auto flex w-full max-w-[1600px] flex-col px-5 pt-9 pb-7 sm:px-8 sm:pt-14 lg:px-12 lg:pt-16"
      >
        <div className="flex flex-1 items-center justify-center text-center sm:mt-auto sm:flex-none lg:justify-start lg:text-left">
          <motion.h1
            variants={titleVariants}
            className="w-fit max-w-full text-[clamp(1.65rem,8.25vw,2.75rem)] leading-[1.08] font-extrabold tracking-[-0.02em] sm:text-[clamp(2.75rem,5vw,5.5rem)]"
          >
            <TitleLine
              text="I design and build"
              className="block whitespace-nowrap"
            />
            <motion.button
              type="button"
              variants={titleWordVariants}
              onClick={changeDescriptor}
              whileHover={reduceMotion ? undefined : { scale: 1.015 }}
              whileTap={reduceMotion ? undefined : { scale: 0.985 }}
              className="font-display pointer-events-auto inline-block cursor-pointer border-0 bg-transparent p-0 text-center font-normal text-[#d9ff43] normal-case italic outline-none focus-visible:ring-2 focus-visible:ring-[#d9ff43]/70 lg:text-left"
              aria-label={`Change descriptor. Current descriptor: ${productDescriptors[descriptorIndex]}`}
            >
              <motion.span
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
              className="-mt-[0.08em] block whitespace-nowrap"
            />
          </motion.h1>
        </div>

        <div className="flex justify-center pt-5 sm:mt-auto sm:justify-end">
          <motion.a
            variants={introItemVariants}
            href="#work"
            className="pointer-events-auto mx-auto flex size-14 items-center justify-center rounded-full border border-white/25 transition-colors hover:bg-[#d9ff43] hover:text-[#10100f] sm:mx-0"
            aria-label="See selected work"
          >
            <ArrowDown className="size-5" />
          </motion.a>
        </div>
      </motion.div>
    </section>
  )
}
