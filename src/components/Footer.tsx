import { Link } from '@tanstack/react-router'
import { ArrowUpRight } from 'lucide-react'
import Logo from './Logo'
import ScrollReveal from './ScrollReveal'

export default function Footer() {
  return (
    <footer className="overflow-hidden bg-[#10100f] text-[#f1efe8]">
      <div className="mx-auto max-w-[1600px] px-5 py-16 sm:px-8 sm:py-24 lg:px-12 lg:py-28">
        <ScrollReveal className="grid gap-10 border-b border-white/15 pb-16 lg:grid-cols-[1fr_auto] lg:items-end lg:pb-24">
          <div>
            <p className="font-mono text-[10px] tracking-[0.2em] text-[#d9ff43] uppercase">
              Have an ambitious brief?
            </p>
            <p className="font-display mt-5 max-w-5xl text-[clamp(3.5rem,8.5vw,9rem)] leading-[0.82] tracking-[-0.055em]">
              Let’s make it
              <br />
              <em className="text-[#d9ff43]">unmissable.</em>
            </p>
          </div>
          <Link
            to="/contact"
            className="group flex size-28 shrink-0 items-center justify-center rounded-full bg-[#d9ff43] text-[#10100f] transition-transform duration-500 hover:scale-105 hover:rotate-6 sm:size-36"
            aria-label="Contact Ali"
          >
            <ArrowUpRight className="size-9 transition-transform duration-500 group-hover:translate-x-1 group-hover:-translate-y-1 sm:size-11" />
          </Link>
        </ScrollReveal>
        <ScrollReveal
          delay={0.08}
          className="flex flex-col gap-8 pt-8 text-xs text-white/45 min-[685px]:grid min-[685px]:grid-cols-[1fr_auto_1fr] min-[685px]:items-center"
        >
          <Link
            to="/"
            className="flex items-center gap-3 text-white min-[685px]:justify-self-start"
          >
            <Logo className="h-6 w-7 text-[#d9ff43]" />
            <span className="font-semibold">Ali Abbas</span>
          </Link>
          <div className="flex flex-wrap gap-x-6 gap-y-3 min-[685px]:justify-self-center">
            <Link to="/capabilities" className="hover:text-white">
              Capabilities
            </Link>
            <Link to="/experience" className="hover:text-white">
              Experience
            </Link>
            <Link to="/notes" className="hover:text-white">
              Notes
            </Link>
            <Link to="/chat" className="hover:text-white">
              Ask AI
            </Link>
            <a
              href="https://github.com/alivault"
              target="_blank"
              rel="noreferrer"
              className="hover:text-white"
            >
              GitHub ↗
            </a>
          </div>
          <span className="min-[685px]:justify-self-end">
            Designed & engineered with intent.
          </span>
        </ScrollReveal>
      </div>
    </footer>
  )
}
