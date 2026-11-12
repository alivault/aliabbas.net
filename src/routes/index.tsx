import { createFileRoute } from '@tanstack/react-router'
import { jsonLdScript, pageHead, person, website } from '~/lib/structured-data'

export const Route = createFileRoute('/')({
  head: () => ({
    ...pageHead({
      title:
        'Ali Abbas — Senior Frontend Engineer, Interactive & Streaming Interfaces',
      socialTitle: 'Ali Abbas — Senior Frontend Engineer',
      description:
        'Senior frontend engineer for interactive and streaming interfaces: state machines, motion, design systems, performance and accessibility.',
      path: '/',
    }),
    scripts: [jsonLdScript(person, website)],
  }),
  component: Home,
})

// The home page is the world itself (see WorldShell).
function Home() {
  return null
}
