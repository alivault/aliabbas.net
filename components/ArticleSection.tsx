import Section from '@/components/Section'
import SectionHeading from '@/components/SectionHeading'
import ArticleList from './ArticleList'

export default function ArticlesSection() {
  return (
    <Section>
      <SectionHeading href="/articles">Articles</SectionHeading>
      <ArticleList />
    </Section>
  )
}
