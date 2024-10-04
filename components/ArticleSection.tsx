import Section from '@/components/Section'
import SectionHeading from '@/components/SectionHeading'
import ArticleList from './ArticleList'
import SectionButton from './SectionButton'

export default function ArticlesSection() {
  return (
    <Section>
      <SectionHeading>Articles</SectionHeading>
      <ArticleList limit={3} />
      <SectionButton href="/articles">View All Articles</SectionButton>
    </Section>
  )
}
