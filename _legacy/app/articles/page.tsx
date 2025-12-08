import { Metadata } from 'next'
import ArticleList from '@/components/ArticleList'
import Main from '@/components/Main'
import Nav from '@/components/Nav'
import PageHeading from '@/components/PageHeading'
import Section from '@/components/Section'

export const metadata: Metadata = {
  title: 'Articles',
  description: 'Articles about software development.',
}

export default function ArticlesPage() {
  return (
    <Main>
      <Nav />
      <Section>
        <PageHeading>Articles</PageHeading>
        <ArticleList />
      </Section>
    </Main>
  )
}
