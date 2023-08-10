import Footer from './../../../components/Footer';
import getFormattedDate from '@/lib/getFormattedDate';
import { getArticlesMeta, getArticleByName } from '@/lib/articles';
import 'highlight.js/styles/atom-one-dark.css';
import TheNav from '@/components/TheNav';

export const revalidate = 86400; // 24 hours

type Props = {
  params: {
    articleId: string;
  };
};

export async function generateStaticParams() {
  const articles = await getArticlesMeta();

  if (!articles) return [];

  return articles.map(article => ({
    articleId: article.id,
  }));
}

export async function generateMetadata({ params: { articleId } }: Props) {
  const article = await getArticleByName(`${articleId}.mdx`);

  if (!article) {
    return {
      title: 'Article Not Found',
    };
  }

  return {
    title: article.meta.title,
  };
}

export default async function Article({ params: { articleId } }: Props) {
  const article = await getArticleByName(`${articleId}.mdx`);

  if (!article) {
    return <h1>Article not found</h1>;
  }

  const { meta, content } = article;

  const date = getFormattedDate(meta.date);

  return (
    <main className='flex flex-col gap-6'>
      <TheNav />
      <article className='prose dark:prose-invert lg:prose-lg prose-h1:mb-4 prose-h1:text-3xl lg:prose-h1:text-4xl'>
        <h1>{meta.title}</h1>
        <time className='text-sm opacity-50' dateTime={meta.date}>
          {date}
        </time>
        {content}
      </article>
      <Footer />
    </main>
  );
}
