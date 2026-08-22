import { Link } from '@tanstack/react-router'
import { MoveRight } from 'lucide-react'
import ScrollReveal from '~/components/ScrollReveal'
import type { SanityExperience } from '~/lib/sanity'
import AboutVisual from './AboutVisual'

export default function HomeAboutSection({
  currentRole,
}: {
  currentRole?: SanityExperience
}) {
  return (
    <section className="bg-background text-foreground overflow-hidden">
      <div className="mx-auto grid max-w-[1600px] lg:grid-cols-2">
        <AboutVisual />
        <ScrollReveal className="flex flex-col justify-between px-5 py-16 sm:px-8 sm:py-20 lg:p-12 lg:py-16">
          <div>
            <h2 className="font-display text-[clamp(3.5rem,7vw,7rem)] leading-[0.79] tracking-[-0.055em]">
              I don’t hand designs over to engineering.
              <em className="text-brand block">I am the engineering.</em>
            </h2>
            <p className="text-foreground/65 mt-9 max-w-xl text-base leading-8">
              That overlap means fewer gaps between intent and implementation,
              faster iteration, and products that keep their character all the
              way to production. I’m equally at home refining a visual system,
              shaping component architecture, or connecting the services behind
              it.
            </p>
          </div>
          <div className="border-foreground/25 mt-16 border-t">
            <div className="border-foreground/25 grid grid-cols-[120px_1fr] border-b py-5 text-sm">
              <span className="text-foreground/40">Currently</span>
              <span className="font-semibold">
                {currentRole
                  ? `${currentRole.title} · ${currentRole.company}`
                  : 'Front-end Developer · Super Studios'}
              </span>
            </div>
            <div className="border-foreground/25 grid grid-cols-[120px_1fr] border-b py-5 text-sm">
              <span className="text-foreground/40">Focus</span>
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
        </ScrollReveal>
      </div>
    </section>
  )
}
