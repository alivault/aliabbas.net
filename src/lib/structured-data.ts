/**
 * JSON-LD for search engines. Every fact here is also on the visible page.
 * Pages refer to the Person and the WebSite by `@id`, so search engines join
 * them into one graph.
 */

export const SITE_URL = 'https://aliabbas.net'
const PERSON_ID = `${SITE_URL}/#person`
const WEBSITE_ID = `${SITE_URL}/#website`

type JsonLd = Record<string, unknown>

export const person: JsonLd = {
  '@type': 'Person',
  '@id': PERSON_ID,
  name: 'Ali Abbas',
  url: SITE_URL,
  image: `${SITE_URL}/og-image.png`,
  jobTitle: 'Senior Frontend Engineer',
  description:
    'Senior frontend engineer for streaming interfaces, state machines, motion and accessibility.',
  knowsAbout: [
    'React',
    'TypeScript',
    'Streaming user interfaces',
    'State machines',
    'Interaction design',
    'Web accessibility',
    'Core Web Vitals',
    'Design systems',
  ],
  sameAs: [
    'https://github.com/alivault',
    'https://www.linkedin.com/in/webdevali/',
  ],
}

export const website: JsonLd = {
  '@type': 'WebSite',
  '@id': WEBSITE_ID,
  name: 'Ali Abbas',
  url: SITE_URL,
  inLanguage: 'en',
  author: { '@id': PERSON_ID },
  publisher: { '@id': PERSON_ID },
}

export function article({
  dateModified,
  datePublished,
  description,
  path,
  title,
  type = 'BlogPosting',
}: {
  dateModified?: string
  datePublished?: string
  description: string
  path: string
  title: string
  type?: 'BlogPosting' | 'TechArticle'
}): JsonLd {
  const url = `${SITE_URL}${path}`
  return {
    '@type': type,
    '@id': `${url}#article`,
    headline: title,
    description,
    url,
    mainEntityOfPage: url,
    ...(datePublished ? { datePublished } : {}),
    ...(dateModified ? { dateModified } : {}),
    inLanguage: 'en',
    author: { '@id': PERSON_ID },
    publisher: { '@id': PERSON_ID },
    isPartOf: { '@id': WEBSITE_ID },
    image: `${SITE_URL}/og-image.png`,
  }
}

export function breadcrumbs(
  items: ReadonlyArray<{ name: string; path: string }>,
): JsonLd {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: `${SITE_URL}${item.path}`,
    })),
  }
}

/**
 * A `<script type="application/ld+json">` for a route's `head().scripts`.
 * `<` is escaped, so text from the CMS cannot close the script element.
 */
export function jsonLdScript(...nodes: Array<JsonLd>) {
  const data =
    nodes.length === 1
      ? { '@context': 'https://schema.org', ...nodes[0] }
      : { '@context': 'https://schema.org', '@graph': nodes }
  return {
    type: 'application/ld+json',
    children: JSON.stringify(data).replace(/</g, '\\u003c'),
  }
}

/**
 * Title, description, canonical link and Open Graph tags for a page that
 * shares the site image.
 */
export function pageHead({
  description,
  path,
  title,
  type = 'article',
}: {
  description: string
  path: string
  title: string
  type?: 'article' | 'website'
}) {
  const url = `${SITE_URL}${path}`
  const image = `${SITE_URL}/og-image.png?v=2`
  return {
    meta: [
      { title },
      { name: 'description', content: description },
      { property: 'og:title', content: title },
      { property: 'og:description', content: description },
      { property: 'og:url', content: url },
      { property: 'og:type', content: type },
      { property: 'og:image', content: image },
      { property: 'og:image:width', content: '1200' },
      { property: 'og:image:height', content: '630' },
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:title', content: title },
      { name: 'twitter:description', content: description },
      { name: 'twitter:image', content: image },
    ],
    links: [{ rel: 'canonical', href: url }],
  }
}
