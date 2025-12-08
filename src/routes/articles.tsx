import { createFileRoute } from '@tanstack/react-router'
import Main from '~/components/Main'
import Nav from '~/components/Nav'
import PageHeading from '~/components/PageHeading'
import Section from '~/components/Section'

export const Route = createFileRoute('/articles')({
  head: () => ({
    meta: [
      { title: 'Articles | Ali Abbas' },
      { name: 'description', content: 'Articles about software development.' },
    ],
  }),
  component: ArticlesPage,
})

function ArticlesPage() {
  return (
    <Main>
      <Nav />
      <Section>
        <PageHeading>Articles</PageHeading>
        <p className="prose dark:prose-invert">
          Articles coming soon. Check back later!
        </p>
      </Section>
    </Main>
  )
}

