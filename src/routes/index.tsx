import { createFileRoute } from '@tanstack/react-router'
import HomeExperience from '~/components/HomeExperience'

export const Route = createFileRoute('/')({
  head: () => ({
    meta: [
      { title: 'Ali Abbas — Full-stack Product Engineer' },
      {
        name: 'description',
        content:
          'Full-stack product engineer with a strong frontend design background. I design and build expressive digital products.',
      },
      {
        property: 'og:title',
        content: 'Ali Abbas — Full-stack Product Engineer',
      },
      {
        property: 'og:description',
        content:
          'Full-stack product engineer with a strong frontend design background.',
      },
      { property: 'og:url', content: 'https://aliabbas.dev' },
      { property: 'og:type', content: 'website' },
      { name: 'twitter:card', content: 'summary' },
      {
        name: 'twitter:title',
        content: 'Ali Abbas — Full-stack Product Engineer',
      },
      {
        name: 'twitter:description',
        content:
          'I design and build expressive digital products from interface to infrastructure.',
      },
    ],
  }),
  component: Home,
})

function Home() {
  return <HomeExperience />
}
