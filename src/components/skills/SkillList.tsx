import { ArrowRight } from 'lucide-react'
import ScrollReveal from '~/components/ScrollReveal'
import Title from '~/components/Title'
import { ButtonLink } from '~/components/ui/button'
import { capabilities } from '~/data/capabilities'
import SkillSpecimen from './SkillSpecimens'

/**
 * The skills, each with its number, what it means, a link to its proof and
 * a small live example. The home page and /skills show this list.
 */
export default function SkillList({
  headingLevel,
}: {
  /** h3 under a section heading, h2 on a page of its own. */
  headingLevel: 'h2' | 'h3'
}) {
  return (
    <div className="grid gap-16 lg:gap-24">
      {capabilities.map((capability, index) => (
        <ScrollReveal
          key={capability.id}
          as="article"
          delay={index * 0.04}
          className="grid gap-8 lg:grid-cols-2 lg:items-center lg:gap-16"
        >
          <div>
            <Title
              as={headingLevel}
              variant="card"
              className="flex gap-4 text-balance"
            >
              <span className="tabular-nums">{capability.number}</span>
              <span>{capability.title}</span>
            </Title>
            <p className="text-fg-secondary mt-4 max-w-xl text-base leading-7 text-pretty">
              {capability.description}
            </p>
            <ButtonLink
              to={capability.proof.to}
              hash={capability.proof.hash}
              variant="secondary"
              className="mt-6"
            >
              {capability.proof.label}
              <ArrowRight aria-hidden="true" />
            </ButtonLink>
          </div>
          <SkillSpecimen id={capability.id} />
        </ScrollReveal>
      ))}
    </div>
  )
}
