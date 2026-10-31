/**
 * JSON-LD for search engines. Every fact here is also on the visible page.
 * Pages refer to the Person and the WebSite by `@id`, so search engines join
 * them into one graph.
 */

export const SITE_URL = 'https://aliabbas.net'
const PERSON_ID = `${SITE_URL}/#person`
const WEBSITE_ID = `${SITE_URL}/#website`
const OG_IMAGE_URL = `${SITE_URL}/og-image.png?v=3`

type JsonLd = Record<string, unknown>

export const person: JsonLd = {
  '@type': 'Person',
  '@id': PERSON_ID,
  name: 'Ali Abbas',
  url: SITE_URL,
  image: OG_IMAGE_URL,
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
    image: OG_IMAGE_URL,
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

/** The share image of the site, rendered by scripts/og-image.ts. */
export const OG_IMAGE = {
  url: OG_IMAGE_URL,
  width: '1200',
  height: '630',
  type: 'image/png',
  alt: 'Ali Abbas, Senior Frontend Engineer: streaming interfaces, state machines, motion and accessibility.',
}

/**
 * Open Graph and Twitter tags that every page shares. The root route sets
 * them, so a page without pageHead still has the share image. A page tag
 * with the same name replaces the root tag.
 */
export const siteSocialMeta = [
  { property: 'og:site_name', content: 'Ali Abbas' },
  { property: 'og:locale', content: 'en_US' },
  { property: 'og:type', content: 'website' },
  { property: 'og:image', content: OG_IMAGE.url },
  { property: 'og:image:width', content: OG_IMAGE.width },
  { property: 'og:image:height', content: OG_IMAGE.height },
  { property: 'og:image:type', content: OG_IMAGE.type },
  { property: 'og:image:alt', content: OG_IMAGE.alt },
  { name: 'twitter:card', content: 'summary_large_image' },
  { name: 'twitter:image', content: OG_IMAGE.url },
  { name: 'twitter:image:alt', content: OG_IMAGE.alt },
]

/**
 * Title, description, canonical link and Open Graph tags for a page. The
 * share image comes from siteSocialMeta in the root route.
 * `socialTitle` replaces the title in link previews, where the site name
 * shows next to it.
 */
export function pageHead({
  description,
  path,
  title,
  socialTitle = title,
  type = 'website',
}: {
  description: string
  path: string
  title: string
  socialTitle?: string
  type?: 'article' | 'website'
}) {
  const url = path === '/' ? SITE_URL : `${SITE_URL}${path}`
  return {
    meta: [
      { title },
      { name: 'description', content: description },
      { property: 'og:title', content: socialTitle },
      { property: 'og:description', content: description },
      { property: 'og:url', content: url },
      { property: 'og:type', content: type },
      { name: 'twitter:title', content: socialTitle },
      { name: 'twitter:description', content: description },
    ],
    links: [{ rel: 'canonical', href: url }],
  }
}
