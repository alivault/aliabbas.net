import Main from '@/components/Main'
import Nav from '@/components/Nav'
import Section from '@/components/Section'
import { SubscribeForm } from '@/components/SubscribeForm'

export default function SubscribePage() {
  return (
    <Main>
      <Nav />
      <Section>
        <h1 className="mb-4 font-mono text-2xl font-bold sm:text-3xl">
          The Chronicles of Ali
        </h1>
        <SubscribeForm />
      </Section>
    </Main>
  )
}
