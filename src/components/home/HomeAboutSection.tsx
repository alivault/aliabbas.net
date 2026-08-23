import { Link } from '@tanstack/react-router'
import { ArrowRight } from 'lucide-react'
import ScrollReveal from '~/components/ScrollReveal'
import AboutVisual from './AboutVisual'

export default function HomeAboutSection() {
  return (
    <section className="bg-background text-foreground overflow-hidden">
      <div className="mx-auto grid max-w-[1600px] lg:grid-cols-2">
        <AboutVisual />
        <ScrollReveal className="flex flex-col justify-between px-5 py-16 sm:px-8 sm:py-20 lg:p-12 lg:py-16">
          <div>
            <h2 className="font-display text-[clamp(3.5rem,7vw,7rem)] leading-[0.79] tracking-[-0.055em]">
              Design + Engineering
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
              <span className="text-foreground/40">Focus</span>
              <span className="font-semibold">
                Product engineering · Creative frontend
              </span>
            </div>
            <Link
              to="/experience"
              className="group border-foreground/25 hover:text-background relative mt-7 flex items-center justify-between overflow-hidden border-b px-3 py-4 text-xs font-bold uppercase transition-colors duration-300"
            >
              <span className="bg-foreground absolute inset-0 translate-y-full transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:translate-y-0" />
              <span className="relative z-10">View full experience</span>
              <ArrowRight className="relative z-10 size-5" />
            </Link>
          </div>
        </ScrollReveal>
      </div>
    </section>
  )
}
