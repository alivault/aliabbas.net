import { createFileRoute } from '@tanstack/react-router'
import {
  Reader,
  ReaderLink,
  ReaderLinks,
  ReaderList,
  ReaderSection,
  ReaderText,
  ReaderTitle,
} from '~/components/reader/Reader'
import { STACK } from '~/components/skills/StackMarquee'
import { capabilities } from '~/data/capabilities'
import { pageHead } from '~/lib/structured-data'

export const Route = createFileRoute('/skills')({
  head: () =>
    pageHead({
      title: 'Skills — Ali Abbas',
      description:
        'Streaming state, motion and interaction, design systems, and performance and accessibility.',
      path: '/skills',
    }),
  component: SkillsPage,
})

function SkillsPage() {
  return (
    <Reader>
      <ReaderTitle>Skills</ReaderTitle>
      <ReaderText>
        I bridge product design and frontend engineering, so the idea survives
        implementation, and the interface holds up in every state after launch.
      </ReaderText>
      {capabilities.map((capability, index) => (
        <ReaderSection
          key={capability.id}
          id={capability.id}
          title={`${String.fromCharCode(65 + index)}. ${capability.title}`}
        >
          <ReaderText>{capability.description}</ReaderText>
          <ReaderLinks>
            <ReaderLink to={capability.proof.to} hash={capability.proof.hash}>
              {capability.proof.label}
            </ReaderLink>
          </ReaderLinks>
        </ReaderSection>
      ))}
      <ReaderSection title="Tools">
        <ReaderList items={STACK.map((tool) => tool.name)} />
      </ReaderSection>
    </Reader>
  )
}
