import { Link } from '@tanstack/react-router'
import { ArrowRight } from 'lucide-react'
import ScrollReveal from '~/components/ScrollReveal'
import SectionHeading from '~/components/SectionHeading'
import AboutVisual from './AboutVisual'

export default function HomeAboutSection() {
  return (
    <section className="bg-background text-foreground overflow-hidden">
      <div className="mx-auto grid max-w-[1600px] lg:grid-cols-2">
        <AboutVisual />
        <ScrollReveal className="flex flex-col justify-between px-5 py-16 sm:px-8 sm:py-20 lg:p-12 lg:py-16">
          <div>
            <SectionHeading>Design + Engineering</SectionHeading>
            <p className="text-foreground/65 mt-9 max-w-xl text-base leading-8">
              That overlap means fewer gaps between intent and implementation,
              faster iteration, and products that keep their character all the
              way to production. I’m equally at home refining a visual system,
              shaping component architecture, or connecting the services behind
              it.
            </p>
          </div>
          <Link
            to="/experience"
            className="group border-foreground/25 hover:text-background relative mt-16 flex items-center justify-between overflow-hidden border-b px-3 py-4 text-xs font-bold uppercase transition-colors duration-300"
          >
            <span className="bg-foreground absolute inset-0 translate-y-full transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:translate-y-0" />
            <span className="relative z-10">View full experience</span>
            <ArrowRight className="relative z-10 size-5" />
          </Link>
        </ScrollReveal>
      </div>
    </section>
  )
}
