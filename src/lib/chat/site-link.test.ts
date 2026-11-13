import { describe, expect, it } from 'vite-plus/test'
import { sitePath } from './site-link'

describe('sitePath', () => {
  it('keeps a path on this site', () => {
    expect(sitePath('/work/pico')).toBe('/work/pico')
    expect(sitePath('/lab?demo=fluid-resizer#top')).toBe(
      '/lab?demo=fluid-resizer#top',
    )
  })

  it('turns a full URL to this site into a path', () => {
    expect(sitePath('https://aliabbas.net/work/pico')).toBe('/work/pico')
    expect(sitePath('https://www.aliabbas.net/notes?x=1')).toBe('/notes?x=1')
    expect(sitePath('https://aliabbas.net')).toBe('/')
    expect(sitePath('http://localhost:3100/chat', 'localhost:3100')).toBe(
      '/chat',
    )
  })

  it('leaves other sites alone', () => {
    expect(sitePath('https://github.com/alivault')).toBeNull()
    expect(sitePath('https://v1.aliabbas.net/work')).toBeNull()
    expect(sitePath('//evil.example/x')).toBeNull()
    expect(sitePath('mailto:ali@aliabbas.net')).toBeNull()
    expect(sitePath('#cite-S1')).toBeNull()
    expect(sitePath(undefined)).toBeNull()
  })
})
