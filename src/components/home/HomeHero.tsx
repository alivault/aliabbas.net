import { useRef, useState } from 'react'
import { ArrowDown } from 'lucide-react'
import {
  AnimatePresence,
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
} from 'motion/react'
import type { Variants } from 'motion/react'
import HeroTracers from './HeroTracers'
import ParticleModel from './ParticleModel'

const productDescriptors = [
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
  const heroRef = useRef<HTMLElement>(null)
  const reduceMotion = useReducedMotion()
  const [hoveredPlane, setHoveredPlane] = useState<number | null>(null)
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start'],
  })
  const orbY = useTransform(scrollYProgress, [0, 1], [0, 240])
  const productDescriptor =
    hoveredPlane === null
      ? 'full-stack'
      : (productDescriptors[hoveredPlane] ?? 'full-stack')

  return (
    <section
      ref={heroRef}
      className="site-noise relative flex flex-1 overflow-hidden bg-[#10100f] pt-[72px] text-[#f1efe8]"
    >
      <div className="hero-grid absolute inset-0" />
      <HeroTracers />
      <motion.div
        style={{ y: orbY }}
        className="absolute top-[12%] right-[-20%] size-[70vw] rounded-full bg-[#335cff] opacity-35 blur-[100px] sm:right-[-30%] sm:size-[60vw]"
      />
      <motion.div
        initial={reduceMotion ? false : 'hidden'}
        animate="visible"
        variants={introContainerVariants}
        className="relative z-10 mx-auto flex w-full max-w-[1600px] flex-col px-5 pt-9 pb-7 sm:px-8 sm:pt-14 lg:px-12 lg:pt-16"
      >
        <motion.div
          variants={introItemVariants}
          className="flex items-center justify-between font-mono text-[9px] tracking-[0.2em] text-white/45 uppercase sm:text-[10px]"
        >
          <span>Full-stack product engineer</span>
          <span className="hidden sm:block">
            Design-led · Production-minded
          </span>
          <span>US / Remote</span>
        </motion.div>

        <div className="mt-9 sm:mt-auto lg:grid lg:grid-cols-[minmax(0,1fr)_clamp(260px,25vw,410px)] lg:items-center lg:gap-8">
          <motion.h1
            variants={titleVariants}
            className="mx-auto max-w-[960px] text-center text-[clamp(1.65rem,8.25vw,2.75rem)] leading-[0.8] font-extrabold tracking-[-0.02em] uppercase sm:text-[clamp(2.75rem,5vw,5.5rem)] lg:mx-0 lg:text-left"
          >
            <TitleLine
              text="I design and build"
              className="block whitespace-nowrap"
            />
            <motion.span
              variants={titleWordVariants}
              className="font-display block font-normal text-[#d9ff43] normal-case italic lg:pl-[9vw]"
            >
              <AnimatePresence mode="wait" initial={false}>
                <motion.span
                  key={productDescriptor}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.18 }}
                  className="block"
                >
                  {productDescriptor}
                </motion.span>
              </AnimatePresence>
            </motion.span>
            <TitleLine
              text="digital products."
              className="block whitespace-nowrap"
            />
          </motion.h1>
          <motion.div variants={introItemVariants}>
            <ParticleModel heroRef={heroRef} onPlaneHover={setHoveredPlane} />
          </motion.div>
        </div>

        <div className="mt-auto grid gap-8 border-t border-white/15 pt-5 sm:grid-cols-[1fr_auto] sm:items-end lg:grid-cols-[1fr_1fr_auto]">
          <motion.p
            variants={introItemVariants}
            className="hidden max-w-xs font-mono text-[9px] leading-5 tracking-[0.14em] text-white/35 uppercase lg:block"
          >
            Strategy / UX / Visual systems / Frontend / APIs / Data / Delivery
          </motion.p>
          <motion.p
            variants={introItemVariants}
            className="mx-auto max-w-lg text-center text-sm leading-6 text-white/60 sm:text-base sm:leading-7 lg:mx-0 lg:text-left"
          >
            I turn ambitious ideas into polished, production-ready
            software—shaping the UX, building the interface, connecting the
            systems, and carrying it through delivery.
          </motion.p>
          <motion.a
            variants={introItemVariants}
            href="#work"
            className="mx-auto flex size-14 items-center justify-center rounded-full border border-white/25 transition-colors hover:bg-[#d9ff43] hover:text-[#10100f] sm:mx-0"
            aria-label="See selected work"
          >
            <ArrowDown className="size-5" />
          </motion.a>
        </div>
      </motion.div>
    </section>
  )
}
