import { useRef, useState } from 'react'
import { ArrowDown } from 'lucide-react'
import { AnimatePresence, motion, useScroll, useTransform } from 'motion/react'
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
  'launch-ready',
  'end-to-end',
] as const

export function HomeHero() {
  const heroRef = useRef<HTMLElement>(null)
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
      <div className="relative z-10 mx-auto flex w-full max-w-[1600px] flex-col px-5 pt-9 pb-7 sm:px-8 sm:pt-14 lg:px-12 lg:pt-16">
        <div className="flex items-center justify-between font-mono text-[9px] tracking-[0.2em] text-white/45 uppercase sm:text-[10px]">
          <span>Full-stack product engineer</span>
          <span className="hidden sm:block">
            Design-led · Production-minded
          </span>
          <span>US / Remote</span>
        </div>

        <motion.div className="mt-auto lg:grid lg:grid-cols-[minmax(0,1fr)_clamp(260px,25vw,410px)] lg:items-center lg:gap-8">
          <h1 className="mx-auto max-w-[960px] text-center text-[clamp(2.75rem,5vw,5.5rem)] leading-[0.8] font-extrabold tracking-[-0.02em] uppercase lg:mx-0 lg:text-left">
            <motion.span
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              className="block"
            >
              I design and build
            </motion.span>
            <motion.span
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                delay: 0.08,
                duration: 0.8,
                ease: [0.22, 1, 0.36, 1],
              }}
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
            <motion.span
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                delay: 0.16,
                duration: 0.8,
                ease: [0.22, 1, 0.36, 1],
              }}
              className="block"
            >
              digital products.
            </motion.span>
          </h1>
          <ParticleModel heroRef={heroRef} onPlaneHover={setHoveredPlane} />
        </motion.div>

        <div className="mt-auto grid gap-8 border-t border-white/15 pt-5 sm:grid-cols-[1fr_auto] sm:items-end lg:grid-cols-[1fr_1fr_auto]">
          <p className="hidden max-w-xs font-mono text-[9px] leading-5 tracking-[0.14em] text-white/35 uppercase lg:block">
            Strategy / UX / Visual systems / Frontend / APIs / Data / Delivery
          </p>
          <p className="mx-auto max-w-lg text-center text-sm leading-6 text-white/60 sm:text-base sm:leading-7 lg:mx-0 lg:text-left">
            I turn ambitious ideas into polished, production-ready
            software—shaping the UX, building the interface, connecting the
            systems, and carrying it through delivery.
          </p>
          <a
            href="#work"
            className="mx-auto flex size-14 items-center justify-center rounded-full border border-white/25 transition-colors hover:bg-[#d9ff43] hover:text-[#10100f] sm:mx-0"
            aria-label="See selected work"
          >
            <ArrowDown className="size-5" />
          </a>
        </div>
      </div>
    </section>
  )
}
