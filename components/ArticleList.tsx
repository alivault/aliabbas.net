import ArticleListItem from '@/components/ArticleListItem'
import { getArticlesMeta } from '@/lib/articles'

interface ArticleListProps {
  limit?: number
}

export default async function ArticleList({ limit }: ArticleListProps) {
  const articles = await getArticlesMeta()

  if (!articles) {
    return <span>Sorry, no articles yet.</span>
  }

  const displayedArticles = limit ? articles.slice(0, limit) : articles

  return (
    <ul className="flex flex-col">
      {displayedArticles.map((article) => (
        <ArticleListItem key={article.id} article={article} />
      ))}
    </ul>
  )
}
