import ExperienceList from '@/components/ExperienceList'
import Section from '@/components/Section'
import SectionHeading from '@/components/SectionHeading'

export default function WorkSection({}) {
  return (
    <Section>
      <SectionHeading href="/experience">Experience</SectionHeading>
      <ExperienceList maxItems={1} />
    </Section>
  )
}
