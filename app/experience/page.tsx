import { Metadata } from 'next'
import WorkList from '@/components/ExperienceList'
import Main from '@/components/Main'
import Nav from '@/components/Nav'
import PageHeading from '@/components/PageHeading'
import Section from '@/components/Section'

export const metadata: Metadata = {
  title: 'Experience',
  description: 'My work experience.',
}

export default function WorkPage() {
  return (
    <Main>
      <Nav />
      <Section>
        <PageHeading>Experience</PageHeading>
        <WorkList />
      </Section>
    </Main>
  )
}
