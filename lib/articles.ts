import { compileMDX } from 'next-mdx-remote/rsc';
import remarkGfm from 'remark-gfm';
import CustomImage from '@/components/CustomImage';
import rehypePrettyCode from 'rehype-pretty-code';

const shiki = require('shiki');

async function customGetHighlighter() {
  const path = require('path');
  const themePath = path.resolve(
    process.cwd(),
    'node_modules/shiki/themes/github-dark-dimmed.json'
  );
  const theme = await shiki.loadTheme(themePath);
  const highlighter = await shiki.getHighlighter({ theme });
  return highlighter;
}

const options = {
  getHighlighter: customGetHighlighter,
};

type Filetree = {
  tree: [
    {
      path: string;
    },
  ];
};

export async function getArticleByName(
  fileName: string
): Promise<Article | undefined> {
  const res = await fetch(
    `https://raw.githubusercontent.com/alivault/articles/main/${fileName}`,
    {
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
        'X-GitHub-Api-Version': '2022-11-28',
      },
    }
  );

  if (!res.ok) return undefined;

  const rawMDX = await res.text();

  if (rawMDX === '404: Not Found') return undefined;

  const { frontmatter, content } = await compileMDX<{
    title: string;
    date: string;
  }>({
    source: rawMDX,
    components: {
      CustomImage,
    },
    options: {
      parseFrontmatter: true,
      mdxOptions: {
        remarkPlugins: [remarkGfm],
        rehypePlugins: [[rehypePrettyCode, options]],
      },
    },
  });

  const id = fileName.replace(/\.mdx$/, '');

  const articleObj: Article = {
    meta: {
      id,
      title: frontmatter.title,
      date: frontmatter.date,
    },
    content,
  };

  return articleObj;
}

export async function getArticlesMeta(): Promise<Meta[] | undefined> {
  const res = await fetch(
    'https://api.github.com/repos/alivault/articles/git/trees/main?recursive=1',
    {
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
        'X-GitHub-Api-Version': '2022-11-28',
      },
    }
  );

  if (!res.ok) return undefined;

  const repoFiletree: Filetree = await res.json();

  const filesArray = repoFiletree.tree
    .map(file => file.path)
    .filter(file => file.endsWith('.mdx'));

  const articles: Meta[] = [];

  for (const file of filesArray) {
    const article = await getArticleByName(file);
    if (article) {
      const { meta } = article;
      articles.push(meta);
    }
  }

  return articles.sort((a, b) => (a.date < b.date ? 1 : -1));
}
