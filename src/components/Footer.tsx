import { Link } from '@tanstack/react-router'
import { ArrowUpRight } from 'lucide-react'
import Logo from './Logo'
import MonoLabel from './MonoLabel'
import ScrollReveal from './ScrollReveal'
import SectionHeading from './SectionHeading'

export default function Footer() {
  return (
    <footer className="bg-background text-foreground overflow-hidden">
      <div className="py-section mx-auto max-w-[1600px] px-5 sm:px-8 lg:px-12">
        <ScrollReveal className="border-foreground/15 gap-section-content pb-section-content grid border-b lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <MonoLabel tone="brand">Have an ambitious brief?</MonoLabel>
            <SectionHeading className="mt-5 max-w-5xl">
              Let’s make it
              <br />
              <em className="text-brand">unmissable.</em>
            </SectionHeading>
          </div>
          <Link
            to="/contact"
            className="bg-primary text-primary-foreground hover:bg-primary/80 flex size-24 shrink-0 items-center justify-center rounded-full transition-[background-color,scale,rotate] duration-500 hover:scale-105 hover:rotate-6 sm:size-30"
            aria-label="Contact Ali"
          >
            <ArrowUpRight className="size-8 sm:size-9" />
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
            <Link
              to="/skills"
              className="hover:text-foreground transition-colors"
            >
              Skills
            </Link>
            <Link
              to="/experience"
              className="hover:text-foreground transition-colors"
            >
              Experience
            </Link>
            <Link
              to="/notes"
              className="hover:text-foreground transition-colors"
            >
              Notes
            </Link>
            <Link
              to="/chat"
              className="hover:text-foreground transition-colors"
            >
              Ask AI
            </Link>
            <Link to="/lab" className="hover:text-foreground transition-colors">
              Lab
            </Link>
            <Link
              to="/play"
              className="hover:text-foreground transition-colors"
            >
              Play
            </Link>
            <Link
              to="/performance"
              className="hover:text-foreground transition-colors"
            >
              Performance
            </Link>
            <Link
              to="/privacy"
              className="hover:text-foreground transition-colors"
            >
              Privacy
            </Link>
            <a
              href="https://github.com/alivault"
              target="_blank"
              rel="noreferrer"
              className="hover:text-foreground transition-colors"
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
