import { getArticlesMeta } from '@/lib/articles'
import ArticleListItem from './ArticleListItem'
import SectionHeader from './SectionHeader'

export default async function ArticlesSection() {
  const articles = await getArticlesMeta()

  if (!articles) {
    return <span>Sorry, no articles yet.</span>
  }

  return (
    <section className='flex flex-col gap-4'>
      <SectionHeader>📔 Articles</SectionHeader>
      <ul className='flex flex-col gap-4'>
        {articles.map(article => (
          <ArticleListItem key={article.id} article={article} />
        ))}
      </ul>
    </section>
  )
}
