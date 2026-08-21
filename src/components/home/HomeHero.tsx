import { ArrowDown } from 'lucide-react'
import { motion, useReducedMotion } from 'motion/react'
import type { Variants } from 'motion/react'
import ConnectedGlobe from './ConnectedGlobe'

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

  return (
    <section className="site-noise relative flex flex-1 overflow-hidden bg-[#050607] pt-[72px] text-[#f1efe8]">
      <ConnectedGlobe />
      <motion.div
        initial={reduceMotion ? false : 'hidden'}
        animate="visible"
        variants={introContainerVariants}
        className="pointer-events-none relative z-10 mx-auto flex w-full max-w-[1600px] flex-col px-5 pt-9 pb-7 sm:px-8 sm:pt-14 lg:px-12 lg:pt-16"
      >
        <div className="flex flex-1 items-center sm:mt-auto sm:flex-none">
          <motion.h1
            variants={titleVariants}
            className="mx-auto w-full max-w-[960px] text-center text-[clamp(1.65rem,8.25vw,2.75rem)] leading-[0.8] font-extrabold tracking-[-0.02em] sm:text-[clamp(2.75rem,5vw,5.5rem)] lg:mx-0 lg:text-left"
          >
            <TitleLine
              text="I design and build"
              className="block whitespace-nowrap"
            />
            <motion.span
              variants={titleWordVariants}
              className="font-display block font-normal text-[#d9ff43] normal-case italic lg:pl-[9vw]"
            >
              full-stack
            </motion.span>
            <TitleLine
              text="digital products."
              className="block whitespace-nowrap"
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
