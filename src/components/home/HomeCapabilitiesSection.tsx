import { ArrowRight } from 'lucide-react'
import ScrollReveal from '~/components/ScrollReveal'
import SectionHeading from '~/components/SectionHeading'
import SkillList from '~/components/skills/SkillList'
import { ButtonLink } from '~/components/ui/button'

export default function HomeCapabilitiesSection() {
  return (
    <section className="bg-background text-foreground">
      <div className="py-section mx-auto max-w-[1600px] px-5 sm:px-8 lg:px-12">
        <ScrollReveal
          as="header"
          className="pb-section-content grid gap-6 lg:grid-cols-2 lg:items-end lg:gap-16"
        >
          <SectionHeading>Skills</SectionHeading>
          <div className="flex flex-col items-start gap-6">
            <p className="text-fg-secondary max-w-xl text-base leading-7 text-pretty">
              I work where design and engineering overlap. That means fewer gaps
              between intent and implementation, faster iteration, and products
              that keep their character all the way to production. Each skill
              below has a live example.
            </p>
            <ButtonLink to="/skills" variant="secondary">
              Skills and stack
              <ArrowRight aria-hidden="true" />
            </ButtonLink>
          </div>
        </ScrollReveal>
        <SkillList headingLevel="h3" />
      </div>
    </section>
  )
}
