import { Metadata } from 'next'
import { ContactForm } from '@/components/ContactForm'
import Main from '@/components/Main'
import Nav from '@/components/Nav'

export const metadata: Metadata = {
  title: 'Contact',
}

export default function ContactPage() {
  return (
    <Main>
      <Nav />
      <ContactForm />
    </Main>
  )
}
