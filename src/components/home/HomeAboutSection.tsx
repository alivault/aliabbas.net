import { ArrowRight } from 'lucide-react'
import ScrollReveal from '~/components/ScrollReveal'
import SectionHeading from '~/components/SectionHeading'
import { ButtonLink } from '~/components/ui/button'
import AboutVisual from './AboutVisual'

export default function HomeAboutSection() {
  return (
    <section className="bg-background text-foreground overflow-hidden">
      <div className="mx-auto grid max-w-[1600px] lg:grid-cols-2">
        <AboutVisual />
        <ScrollReveal className="py-section flex flex-col justify-between px-5 sm:px-8 lg:px-12">
          <div>
            <SectionHeading>Design + Engineering</SectionHeading>
            <p className="text-fg-secondary mt-9 max-w-xl text-base leading-8">
              That overlap means fewer gaps between intent and implementation,
              faster iteration, and products that keep their character all the
              way to production. I’m equally at home refining a visual system,
              shaping component architecture, or connecting the services behind
              it.
            </p>
          </div>
          <ButtonLink
            to="/experience"
            variant="secondary"
            className="mt-section-content self-start"
          >
            View full experience
            <ArrowRight aria-hidden="true" />
          </ButtonLink>
        </ScrollReveal>
      </div>
    </section>
  )
}
