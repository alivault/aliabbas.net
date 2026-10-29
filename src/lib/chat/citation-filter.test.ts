import { createCitationFilter } from './citation-filter'
import { describe, expect, it } from 'vite-plus/test'

const VALID = new Set(['S1', 'S2', 'S7', 'S20'])

/** Push the chunks one by one, as the model stream does, then flush. */
function run(chunks: ReadonlyArray<string>) {
  const filter = createCitationFilter(VALID)
  const outputs = [...chunks.map((chunk) => filter.push(chunk)), filter.flush()]
  return {
    text: outputs.map((output) => output.text).join(''),
    newIds: outputs.flatMap((output) => output.newSourceIds),
  }
}

describe('createCitationFilter', () => {
  it('keeps a valid marker and takes the space before it', () => {
    expect(run(['Ali built Pico [S1].']).text).toBe('Ali built Pico[S1].')
  })

  it('joins a marker that a token split in two', () => {
    expect(run(['state', '[S2', '0].']).text).toBe('state[S20].')
    expect(run(['a [', 'S', '1', ']', ' b']).text).toBe('a[S1] b')
  })

  it('rewrites lists of ids to one marker per id', () => {
    expect(run(['x [S1, S2] y [S1; 7].']).text).toBe('x[S1][S2] y[S1][S7].')
  })

  it('removes ids that are not in the knowledge base', () => {
    expect(run(['x [S9] y [S1, S99].']).text).toBe('x y[S1].')
  })

  it('removes markers with no number', () => {
    expect(run(['implementation [S].']).text).toBe('implementation.')
    expect(run(['engineer [S]', '[S2].']).text).toBe('engineer[S2].')
  })

  it('reports each source once, in order of first citation', () => {
    expect(run(['a [S2] b [S1] c [S2][S1] d [S7]']).newIds).toEqual([
      'S2',
      'S1',
      'S7',
    ])
  })

  it('does not hold back text that cannot become a marker', () => {
    const filter = createCitationFilter(VALID)
    expect(filter.push('see [link]').text).toBe('see [link]')
  })
})
