/** Top of an element in layout coordinates. Transforms and scroll do not count. */
function layoutTop(element: HTMLElement) {
  let top = 0
  let node: HTMLElement | null = element
  while (node) {
    top += node.offsetTop
    node = node.offsetParent as HTMLElement | null
  }
  return top
}

function scrollParent(element: HTMLElement) {
  let node = element.parentElement
  while (node) {
    const { overflowY } = getComputedStyle(node)
    if (
      (overflowY === 'auto' || overflowY === 'scroll') &&
      node.scrollHeight > node.clientHeight
    ) {
      return node
    }
    node = node.parentElement
  }
  return null
}

const MARGIN = 16

/**
 * Scrolls a source card of the evidence panel into view, smoothly. It
 * measures the layout box, not the painted box: the cards animate their
 * position with transforms when the previous source collapses, and the
 * painted box is then still at the old place. A card that is taller than
 * the panel aligns its top, so its title shows.
 */
export function revealSource(element: HTMLElement) {
  const container = scrollParent(element)
  const behavior = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ? 'auto'
    : 'smooth'
  if (!container) {
    element.scrollIntoView({ block: 'nearest', behavior })
    return
  }
  const top = layoutTop(element) - layoutTop(container) - container.clientTop
  const bottom = top + element.offsetHeight
  // A sticky header covers the top of the panel, so the visible area
  // starts below it.
  const header = container.querySelector<HTMLElement>('[data-evidence-header]')
  const covered = header?.offsetHeight ?? 0
  const viewTop = container.scrollTop + covered
  const viewBottom = container.scrollTop + container.clientHeight
  const viewHeight = viewBottom - viewTop
  let next: number | null = null
  if (top < viewTop + MARGIN || bottom - top > viewHeight - 2 * MARGIN) {
    next = top - covered - MARGIN
  } else if (bottom > viewBottom - MARGIN) {
    next = bottom - container.clientHeight + MARGIN
  }
  if (next !== null) container.scrollTo({ top: Math.max(0, next), behavior })
}
