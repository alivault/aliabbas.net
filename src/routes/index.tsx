import { createFileRoute } from '@tanstack/react-router'
import HomeExperience from '~/components/HomeExperience'

export const Route = createFileRoute('/')({
  head: () => ({
    meta: [
      {
        title:
          'Ali Abbas — Senior Frontend Engineer, Interactive & Streaming Interfaces',
      },
      {
        name: 'description',
        content:
          'Senior frontend engineer for interactive and streaming interfaces: state machines, motion, design systems, performance and accessibility.',
      },
      {
        property: 'og:title',
        content: 'Ali Abbas — Senior Frontend Engineer',
      },
      {
        property: 'og:description',
        content:
          'Senior frontend engineer for interactive and streaming interfaces: state machines, motion, design systems, performance and accessibility.',
      },
      { property: 'og:url', content: 'https://aliabbas.net' },
      { property: 'og:type', content: 'website' },
      {
        property: 'og:image',
        content: 'https://aliabbas.net/og-image.png',
      },
      { property: 'og:image:width', content: '1200' },
      { property: 'og:image:height', content: '630' },
      { property: 'og:image:type', content: 'image/png' },
      {
        property: 'og:image:alt',
        content: 'Ali Abbas — I design and build full-stack digital products.',
      },
      { name: 'twitter:card', content: 'summary_large_image' },
      {
        name: 'twitter:title',
        content: 'Ali Abbas — Senior Frontend Engineer',
      },
      {
        name: 'twitter:description',
        content:
          'Senior frontend engineer for interactive and streaming interfaces: state machines, motion, design systems, performance and accessibility.',
      },
      {
        name: 'twitter:image',
        content: 'https://aliabbas.net/og-image.png',
      },
      {
        name: 'twitter:image:alt',
        content: 'Ali Abbas — I design and build full-stack digital products.',
      },
    ],
  }),
  component: Home,
})

function Home() {
  return <HomeExperience />
}
