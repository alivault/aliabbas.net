import { splitStreamingMarkdown } from './streaming-markdown'
import { describe, expect, it } from 'vite-plus/test'

describe('splitStreamingMarkdown', () => {
  it('splits top-level blocks after a blank line', () => {
    expect(splitStreamingMarkdown('One.\n\nTwo.\n\nThree\n')).toEqual([
      'One.\n\n',
      'Two.\n\n',
      'Three\n',
    ])
  })

  it('starts a chunk only at a complete line', () => {
    // "Three" has no newline yet, so it stays with the chunk before it.
    expect(splitStreamingMarkdown('One.\n\nTwo.\n\nThree')).toEqual([
      'One.\n\n',
      'Two.\n\nThree',
    ])
  })

  it('keeps the text: the chunks join back to the input', () => {
    const text =
      '# Title\n\nA paragraph.\n\n- one\n\n- two\n\n```ts\nconst a = 1\n\nconst b = 2\n```\n\nEnd'
    expect(splitStreamingMarkdown(text).join('')).toBe(text)
  })

  it('keeps a loose list and a code fence whole', () => {
    const chunks = splitStreamingMarkdown(
      'Intro.\n\n- one\n\n- two\n\n```\na\n\nb\n```\n\nEnd\n',
    )
    // A list item never starts a chunk, so the list stays with the intro.
    expect(chunks).toEqual([
      'Intro.\n\n- one\n\n- two\n\n',
      '```\na\n\nb\n```\n\n',
      'End\n',
    ])
  })

  it('does not move a chunk start while a line is still arriving', () => {
    // "Two" has no newline yet, so it stays in the last chunk with the
    // text before it until the line is complete.
    const partial = splitStreamingMarkdown('One.\n\nTw')
    const later = splitStreamingMarkdown('One.\n\nTwo.\n\nThr')
    expect(partial.at(-1)).toBe('One.\n\nTw')
    expect(later[0]).toBe('One.\n\n')
  })
})
