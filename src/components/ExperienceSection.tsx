import ExperienceList from './ExperienceList'
import Section from './Section'
import SectionHeading from './SectionHeading'
import SectionButton from './SectionButton'

export default function ExperienceSection() {
  return (
    <Section>
      <SectionHeading>Experience</SectionHeading>
      <ExperienceList maxItems={1} />
      <SectionButton href="/experience">View All Experience</SectionButton>
    </Section>
  )
}

