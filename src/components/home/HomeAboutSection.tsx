import { Link } from '@tanstack/react-router'
import { MoveRight } from 'lucide-react'
import { motion } from 'motion/react'
import type { SanityExperience } from '~/lib/sanity'
import Logo from '../Logo'

export default function HomeAboutSection({
  currentRole,
}: {
  currentRole?: SanityExperience
}) {
  return (
    <section className="overflow-hidden bg-[#335cff] text-white">
      <div className="mx-auto grid max-w-[1600px] lg:grid-cols-2">
        <div className="relative min-h-[520px] overflow-hidden border-white/20 p-5 sm:p-8 lg:min-h-[760px] lg:border-r lg:p-12">
          <div className="absolute -right-[25%] -bottom-[15%] size-[80%] rounded-full border-[60px] border-[#d9ff43] opacity-90 sm:border-[90px]" />
          <div className="absolute top-[18%] left-[16%] size-40 rounded-full bg-[#ff694a] blur-[1px] sm:size-64" />
          <motion.div
            whileInView={{ rotate: 8, y: -12 }}
            viewport={{ once: true }}
            transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
            className="absolute inset-[20%] flex items-center justify-center border border-white/30 bg-white/10 backdrop-blur-xl"
          >
            <Logo className="h-auto w-[58%] text-[#d9ff43]" />
          </motion.div>
          <p className="relative font-mono text-[9px] tracking-[0.18em] text-white/55 uppercase">
            Design engineer · Builder · Collaborator
          </p>
        </div>
        <div className="flex flex-col justify-between px-5 py-16 sm:px-8 sm:py-20 lg:p-12 lg:py-16">
          <div>
            <p className="font-mono text-[10px] tracking-[0.2em] text-[#d9ff43] uppercase">
              About Ali
            </p>
            <h2 className="font-display mt-7 text-[clamp(3.5rem,7vw,7rem)] leading-[0.79] tracking-[-0.055em]">
              I don’t hand designs over to engineering.
              <em className="block text-[#d9ff43]">I am the engineering.</em>
            </h2>
            <p className="mt-9 max-w-xl text-base leading-8 text-white/65">
              That overlap means fewer gaps between intent and implementation,
              faster iteration, and products that keep their character all the
              way to production. I’m equally at home refining a visual system,
              shaping component architecture, or connecting the services behind
              it.
            </p>
          </div>
          <div className="mt-16 border-t border-white/25">
            <div className="grid grid-cols-[120px_1fr] border-b border-white/25 py-5 text-sm">
              <span className="text-white/40">Currently</span>
              <span className="font-semibold">
                {currentRole
                  ? `${currentRole.title} · ${currentRole.company}`
                  : 'Front-end Developer · Super Studios'}
              </span>
            </div>
            <div className="grid grid-cols-[120px_1fr] border-b border-white/25 py-5 text-sm">
              <span className="text-white/40">Focus</span>
              <span className="font-semibold">
                Product engineering · Creative frontend
              </span>
            </div>
            <Link
              to="/experience"
              className="group flex items-center justify-between pt-7 text-xs font-bold uppercase"
            >
              View full experience
              <MoveRight className="size-5 transition-transform group-hover:translate-x-2" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
