import ArticleList from '@/components/ArticleList'
import Footer from '@/components/Footer'
import Main from '@/components/Main'
import Nav from '@/components/Nav'
import Section from '@/components/Section'

export default function ArticlesPage() {
  return (
    <Main>
      <Nav />
      <Section>
        <h1 className="mb-4 font-mono text-3xl font-bold">Articles</h1>
        <ArticleList />
      </Section>
      <Footer />
    </Main>
  )
}
