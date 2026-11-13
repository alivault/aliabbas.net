import type { ComponentProps } from 'react'
import { useRouter } from '@tanstack/react-router'
import { sitePath } from '~/lib/chat/site-link'

/**
 * A link from text that the site does not control (an answer, a source).
 * A link to a page of this site goes through the router, so the world flies
 * to the page and the conversation stays. Other links open in a new tab.
 */
export default function SmartLink({
  href,
  children,
  onClick,
  ...props
}: ComponentProps<'a'>) {
  const router = useRouter()
  const host = typeof window === 'undefined' ? undefined : window.location.host
  const path = sitePath(href, host)

  if (path === null) {
    return (
      <a href={href} target="_blank" rel="noreferrer" {...props}>
        {children}
        <span className="sr-only"> (opens in a new tab)</span>
      </a>
    )
  }
  return (
    <a
      href={path}
      {...props}
      onClick={(event) => {
        onClick?.(event)
        // A modified click (new tab, new window) stays with the browser.
        if (
          event.defaultPrevented ||
          event.button !== 0 ||
          event.metaKey ||
          event.ctrlKey ||
          event.shiftKey ||
          event.altKey
        ) {
          return
        }
        event.preventDefault()
        void router.navigate({ href: path })
      }}
    >
      {children}
    </a>
  )
}
