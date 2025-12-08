import Section from './Section'
import SectionHeading from './SectionHeading'
import SectionButton from './SectionButton'

export default function ArticlesSection() {
  return (
    <Section>
      <SectionHeading>Articles</SectionHeading>
      <p className="prose dark:prose-invert">
        Check out my articles on software development and design.
      </p>
      <SectionButton href="/articles">View All Articles</SectionButton>
    </Section>
  )
}

