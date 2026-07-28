import { useRef } from 'react'
import { CodeXml, SplinePointer } from 'lucide-react'
import { motion, useReducedMotion } from 'motion/react'
import Logo from '../Logo'

function AboutDecorations() {
  return (
    <>
      <motion.div
        initial={{ rotate: -18, x: -24, y: 20 }}
        whileInView={{ rotate: -8, x: 0, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
        className="absolute top-[9%] left-[4%] z-0 size-[46%] text-[#ff694a]"
      >
        <SplinePointer
          aria-hidden="true"
          strokeWidth={1}
          className="size-full"
        />
      </motion.div>
      <motion.div
        initial={{ rotate: 16, x: 30, y: 24 }}
        whileInView={{ rotate: 6, x: 0, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
        className="absolute right-[-7%] bottom-[3%] z-0 size-[54%] text-[#d9ff43]"
      >
        <CodeXml aria-hidden="true" strokeWidth={1} className="size-full" />
      </motion.div>
    </>
  )
}

function DraggableLogo() {
  const constraintsRef = useRef<HTMLDivElement>(null)
  const reduceMotion = useReducedMotion()

  return (
    <div
      ref={constraintsRef}
      className="pointer-events-none absolute inset-0 z-20 grid place-items-center"
    >
      <motion.div
        drag={!reduceMotion}
        dragConstraints={constraintsRef}
        dragElastic={0.08}
        dragMomentum={false}
        initial={reduceMotion ? undefined : { opacity: 0, scale: 0.94 }}
        whileInView={reduceMotion ? undefined : { opacity: 1, scale: 1 }}
        whileDrag={{ cursor: 'grabbing', scale: 1.03 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className="pointer-events-auto relative aspect-square w-[48%] max-w-[360px] cursor-grab touch-none rounded-full border border-white/30 bg-[#496aff]/35 shadow-[0_18px_38px_rgb(7_20_83_/_18%)] backdrop-blur-md sm:w-[44%]"
        aria-label="Draggable logo"
      >
        <Logo className="pointer-events-none absolute top-1/2 left-1/2 h-auto w-[50%] -translate-x-1/2 -translate-y-1/2 text-[#d9ff43]" />
      </motion.div>
    </div>
  )
}

export default function AboutVisual() {
  return (
    <div className="relative min-h-[520px] overflow-hidden border-white/20 p-5 sm:p-8 lg:min-h-[760px] lg:border-r lg:p-12">
      <AboutDecorations />
      <DraggableLogo />
      <p className="relative z-30 font-mono text-[9px] tracking-[0.18em] text-white/55 uppercase">
        Design engineer · Builder · Collaborator
      </p>
    </div>
  )
}
