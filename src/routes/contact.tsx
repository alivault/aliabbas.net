import { createFileRoute } from '@tanstack/react-router'
import { pageHead } from '~/lib/structured-data'
import Main from '~/components/Main'
import ContactForm from '~/components/ContactForm'

export const Route = createFileRoute('/contact')({
  head: () =>
    pageHead({
      title: 'Contact — Ali Abbas',
      description:
        'Contact Ali Abbas about a senior frontend role, a contract or a collaboration on interactive and streaming interfaces.',
      path: '/contact',
    }),
  component: ContactPage,
})

function ContactPage() {
  return (
    <Main>
      <ContactForm />
    </Main>
  )
}
