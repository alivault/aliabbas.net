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
      {
        property: 'og:image',
        content: 'https://aliabbas.dev/og-image.png',
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
        content: 'Ali Abbas — Full-stack Product Engineer',
      },
      {
        name: 'twitter:description',
        content:
          'I design and build expressive digital products from interface to infrastructure.',
      },
      {
        name: 'twitter:image',
        content: 'https://aliabbas.dev/og-image.png',
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
