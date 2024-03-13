import ArticleListItem from '@/components/ArticleListItem'
import { getArticlesMeta } from '@/lib/articles'

export default async function ArticleList() {
  const articles = await getArticlesMeta()

  if (!articles) {
    return <span>Sorry, no articles yet.</span>
  }

  return (
    <ul className="flex flex-col">
      {articles.map((article) => (
        <ArticleListItem key={article.id} article={article} />
      ))}
    </ul>
  )
}
