import WorkList from '@/components/ExperienceList'
import Footer from '@/components/Footer'
import Main from '@/components/Main'
import Nav from '@/components/Nav'
import Section from '@/components/Section'

export default function WorkPage() {
  return (
    <Main>
      <Nav />
      <Section>
        <h1 className="mb-4 font-mono text-3xl font-bold">Experience</h1>
        <WorkList />
      </Section>
      <Footer />
    </Main>
  )
}
