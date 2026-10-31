import { afterEach, describe, expect, test, vi } from 'vite-plus/test'
import {
  PAGE_TRANSITION_TYPE,
  TO_CONTACT_TRANSITION_TYPE,
  pageTransitionTypes,
} from './page-transition'

function setReducedMotion(reduce: boolean) {
  vi.stubGlobal('window', { matchMedia: () => ({ matches: reduce }) })
}

const go = (from: string, to: string) =>
  pageTransitionTypes({
    fromLocation: { pathname: from },
    pathChanged: from !== to,
    toLocation: { pathname: to },
  })

describe('pageTransitionTypes', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  test('a page change gets the page transition', () => {
    setReducedMotion(false)
    expect(go('/work', '/notes')).toEqual([PAGE_TRANSITION_TYPE])
  })

  test('the way to the contact page also fades out the call to action', () => {
    setReducedMotion(false)
    expect(go('/work', '/contact')).toEqual([
      PAGE_TRANSITION_TYPE,
      TO_CONTACT_TRANSITION_TYPE,
    ])
  })

  test('no transition for the same page, chat modes, or reduced motion', () => {
    setReducedMotion(false)
    expect(go('/work', '/work')).toBe(false)
    expect(go('/chat', '/check')).toBe(false)
    setReducedMotion(true)
    expect(go('/work', '/contact')).toBe(false)
  })
})
