import type { MouseEvent } from 'react'

/**
 * Click handler for an in-page link (`href="#id"`). It scrolls smoothly to
 * the section, or at once when the visitor asks for reduced motion, puts
 * the hash in the URL, and moves keyboard focus to the section so that Tab
 * continues from there. Smooth scroll is set here and not on <html>, so
 * route changes still jump to the top.
 */
export function scrollToSection(event: MouseEvent<HTMLAnchorElement>) {
  const hash = event.currentTarget.hash
  const target = hash ? document.getElementById(hash.slice(1)) : null
  if (
    !target ||
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
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  target.scrollIntoView({
    behavior: reduce ? 'auto' : 'smooth',
    block: 'start',
  })
  // A hash change while the scroll runs makes the router jump to the
  // target and cuts the animation, so set the hash when the scroll ends.
  let done = false
  const setHash = () => {
    if (done) return
    done = true
    history.replaceState(history.state, '', hash)
  }
  if (reduce) setHash()
  else {
    window.addEventListener('scrollend', setHash, { once: true })
    window.setTimeout(setHash, 1500)
  }
  if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1')
  target.focus({ preventScroll: true })
}
