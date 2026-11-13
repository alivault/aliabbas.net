/** The hosts of this site. A link to one of them stays in the app. */
const SITE_HOSTS = new Set(['aliabbas.net', 'www.aliabbas.net'])

/**
 * The path of a link to a page of this site, with its search and hash, or
 * null for a link to another site. A path (`/work/pico`) is on this site.
 * So is a full URL to aliabbas.net, or to the host the page runs on (a dev
 * server or a preview). The v1 archive is another site.
 */
export function sitePath(href: string | undefined, currentHost?: string) {
  if (!href) return null
  if (href.startsWith('/') && !href.startsWith('//')) return href
  let url: URL
  try {
    url = new URL(href)
  } catch {
    return null
  }
  if (url.protocol !== 'https:' && url.protocol !== 'http:') return null
  const host = url.host.toLowerCase()
  if (!SITE_HOSTS.has(host) && host !== currentHost?.toLowerCase()) return null
  return `${url.pathname}${url.search}${url.hash}`
}
