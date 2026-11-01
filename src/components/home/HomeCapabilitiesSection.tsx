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
          className="mb-section flex flex-col items-start gap-6 sm:flex-row sm:items-end sm:justify-between"
        >
          <div className="flex max-w-2xl flex-col gap-4">
            <SectionHeading>Skills</SectionHeading>
            <p className="text-fg-secondary text-base leading-7 text-pretty">
              I work where design and engineering overlap, so products keep
              their character all the way to production. Each skill below has a
              live example.
            </p>
          </div>
          <ButtonLink to="/skills" variant="secondary" className="shrink-0">
            Skills and stack
            <ArrowRight aria-hidden="true" />
          </ButtonLink>
        </ScrollReveal>
        <SkillList headingLevel="h3" />
      </div>
    </section>
  )
}
