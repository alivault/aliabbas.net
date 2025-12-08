import ExperienceList from '@/components/ExperienceList'
import Section from '@/components/Section'
import SectionHeading from '@/components/SectionHeading'
import SectionButton from './SectionButton'

export default function WorkSection({}) {
  return (
    <Section>
      <SectionHeading>Experience</SectionHeading>
      <ExperienceList maxItems={1} />
      <SectionButton href="/experience">View All Experience</SectionButton>
    </Section>
  )
}
