import { Link } from '@tanstack/react-router'
import { ArrowUpRight } from 'lucide-react'
import Logo from './Logo'
import ScrollReveal from './ScrollReveal'

export default function Footer() {
  return (
    <footer className="bg-background text-foreground overflow-hidden">
      <div className="mx-auto max-w-[1600px] px-5 py-16 sm:px-8 sm:py-24 lg:px-12 lg:py-28">
        <ScrollReveal className="border-foreground/15 grid gap-10 border-b pb-16 lg:grid-cols-[1fr_auto] lg:items-end lg:pb-24">
          <div>
            <p className="text-brand font-mono text-[10px] tracking-[0.2em] uppercase">
              Have an ambitious brief?
            </p>
            <p className="font-display mt-5 max-w-5xl text-[clamp(3rem,6.5vw,6rem)] leading-[0.8] tracking-[-0.055em]">
              Let’s make it
              <br />
              <em className="text-brand">unmissable.</em>
            </p>
          </div>
          <Link
            to="/contact"
            className="group bg-brand text-brand-foreground flex size-24 shrink-0 items-center justify-center rounded-full transition-transform duration-500 hover:scale-105 hover:rotate-6 sm:size-30"
            aria-label="Contact Ali"
          >
            <ArrowUpRight className="size-8 transition-transform duration-500 group-hover:translate-x-1 group-hover:-translate-y-1 sm:size-9" />
          </Link>
        </ScrollReveal>
        <ScrollReveal
          delay={0.08}
          className="text-foreground/45 flex flex-col gap-8 pt-8 text-xs min-[685px]:grid min-[685px]:grid-cols-[1fr_auto_1fr] min-[685px]:items-center"
        >
          <Link
            to="/"
            className="text-foreground flex items-center gap-3 min-[685px]:justify-self-start"
          >
            <Logo className="text-foreground h-6 w-7" />
            <span className="font-semibold">Ali Abbas</span>
          </Link>
          <div className="flex flex-wrap gap-x-6 gap-y-3 min-[685px]:justify-self-center">
            <Link to="/skillset" className="hover:text-foreground">
              Skillset
            </Link>
            <Link to="/experience" className="hover:text-foreground">
              Experience
            </Link>
            <Link to="/notes" className="hover:text-foreground">
              Notes
            </Link>
            <Link to="/chat" className="hover:text-foreground">
              Ask AI
            </Link>
            <Link to="/privacy" className="hover:text-foreground">
              Privacy
            </Link>
            <a
              href="https://github.com/alivault"
              target="_blank"
              rel="noreferrer"
              className="hover:text-foreground"
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
