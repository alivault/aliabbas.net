import { createFileRoute } from '@tanstack/react-router'
import Main from '~/components/Main'
import Nav from '~/components/Nav'
import ContactForm from '~/components/ContactForm'

export const Route = createFileRoute('/contact')({
  head: () => ({
    meta: [{ title: 'Contact | Ali Abbas' }],
  }),
  component: ContactPage,
})

function ContactPage() {
  return (
    <Main>
      <Nav />
      <ContactForm />
    </Main>
  )
}

