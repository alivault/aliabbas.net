import { useEffect, useRef, useState } from 'react'
import { CodeXml, SplinePointer } from 'lucide-react'
import { motion, useReducedMotion } from 'motion/react'
import Logo from '../Logo'
import { DURATIONS, EASE_OUT } from '~/lib/design/motion'

function AboutDecorations() {
  return (
    <>
      <motion.div
        initial={{ rotate: -18, x: -24, y: 20 }}
        whileInView={{ rotate: -8, x: 0, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: DURATIONS.showcase, ease: EASE_OUT }}
        className="text-brand absolute top-[9%] left-[4%] z-0 size-[46%]"
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
        transition={{ duration: DURATIONS.showcase, ease: EASE_OUT }}
        className="text-brand absolute right-[-7%] bottom-[3%] z-0 size-[54%]"
      >
        <CodeXml aria-hidden="true" strokeWidth={1} className="size-full" />
      </motion.div>
    </>
  )
}

function DraggableLogo() {
  const constraintsRef = useRef<HTMLDivElement>(null)
  const logoRef = useRef<HTMLDivElement>(null)
  const reduceMotion = useReducedMotion()
  const [dragConstraints, setDragConstraints] = useState({
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  })

  useEffect(() => {
    const container = constraintsRef.current
    const logo = logoRef.current
    if (!container || !logo) return

    const measureConstraints = () => {
      const horizontal = Math.max(
        0,
        (container.clientWidth - logo.offsetWidth) / 2,
      )
      const vertical = Math.max(
        0,
        (container.clientHeight - logo.offsetHeight) / 2,
      )

      setDragConstraints({
        top: -vertical,
        right: horizontal,
        bottom: vertical,
        left: -horizontal,
      })
    }

    measureConstraints()

    // Ref-based Motion constraints remeasure on every window resize. Mobile
    // Safari emits resize events while its browser chrome collapses on scroll,
    // which makes Motion reposition the logo. Observe the actual elements so
    // constraints only change when their layout size changes instead.
    const resizeObserver = new ResizeObserver(measureConstraints)
    resizeObserver.observe(container)
    resizeObserver.observe(logo)

    return () => resizeObserver.disconnect()
  }, [])

  return (
    <div
      ref={constraintsRef}
      className="pointer-events-none absolute inset-0 z-20 grid place-items-center"
    >
      <motion.div
        ref={logoRef}
        // Props that change the HTML do not depend on the reduced-motion
        // hook, which is null on the server. Dragging is the visitor's own
        // motion, so it stays on; only the entrance becomes instant.
        drag
        dragConstraints={dragConstraints}
        dragElastic={0.08}
        dragMomentum={false}
        initial={{ opacity: 0, scale: 0.94 }}
        whileInView={{ opacity: 1, scale: 1 }}
        whileDrag={{ cursor: 'grabbing', scale: 1.03 }}
        viewport={{ once: true }}
        transition={{
          duration: reduceMotion ? 0 : DURATIONS.reveal,
          ease: EASE_OUT,
        }}
        className="border-foreground/30 pointer-events-auto relative aspect-square w-[48%] max-w-[360px] cursor-grab touch-none rounded-full border shadow-[0_18px_38px_rgb(0_0_0_/_18%)] backdrop-blur-md sm:w-[44%]"
        aria-label="Draggable logo"
      >
        <Logo className="text-foreground pointer-events-none absolute top-1/2 left-1/2 h-auto w-[50%] -translate-x-1/2 -translate-y-1/2" />
      </motion.div>
    </div>
  )
}

export default function AboutVisual() {
  return (
    <div className="relative min-h-[520px] overflow-hidden p-5 sm:p-8 lg:min-h-[760px] lg:p-12">
      <span
        aria-hidden="true"
        className="bg-foreground/20 pointer-events-none absolute inset-y-0 right-0 hidden w-px [mask-image:linear-gradient(to_bottom,transparent,black_18%,black_82%,transparent)] lg:block"
      />
      <AboutDecorations />
      <DraggableLogo />
    </div>
  )
}
