import { Link } from '@tanstack/react-router'
import { ArrowUpRight } from 'lucide-react'
import Logo from './Logo'
import ScrollReveal from './ScrollReveal'
import SectionHeading from './SectionHeading'

export default function Footer() {
  return (
    <footer className="bg-background text-foreground overflow-hidden">
      <div className="py-section mx-auto max-w-[1600px] px-5 sm:px-8 lg:px-12">
        <ScrollReveal className="border-foreground/15 gap-section-content pb-section-content grid border-b lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <p className="text-brand font-mono text-[10px] uppercase">
              Have an ambitious brief?
            </p>
            <SectionHeading className="mt-5 max-w-5xl">
              Let’s make it
              <br />
              <em className="text-brand">unmissable.</em>
            </SectionHeading>
          </div>
          <Link
            to="/contact"
            className="group bg-primary text-primary-foreground hover:bg-primary/80 flex size-24 shrink-0 items-center justify-center rounded-full transition-[background-color,transform] duration-500 hover:scale-105 hover:rotate-6 sm:size-30"
            aria-label="Contact Ali"
          >
            <ArrowUpRight className="size-8 transition-transform duration-500 group-hover:translate-x-1 group-hover:-translate-y-1 sm:size-9" />
          </Link>
        </ScrollReveal>
        <ScrollReveal
          delay={0.08}
          className="text-foreground/45 pt-section-content flex flex-col gap-8 text-xs min-[685px]:grid min-[685px]:grid-cols-[1fr_auto_1fr] min-[685px]:items-center"
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
