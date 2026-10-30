import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react'

type MermaidDiagramValue = {
  code?: string
  caption?: string
}

type RenderState =
  | { status: 'loading' }
  | { status: 'rendered'; svg: string }
  | { status: 'error' }

let mermaidPromise: Promise<typeof import('mermaid').default> | undefined

function loadMermaid() {
  mermaidPromise ??= import('mermaid').then(({ default: mermaid }) => mermaid)

  return mermaidPromise
}

const DIAGRAM_PADDING = 8

/**
 * Mermaid sizes the SVG while it is off screen. With reduced motion on, that
 * size can be wrong (much too large), and the diagram shows very small. Size
 * the SVG again from its content once it is in the page.
 */
function fitSvgToContent(container: HTMLElement | null) {
  const svg = container?.querySelector('svg')
  if (!svg) return
  const box = svg.getBBox()
  if (!box.width || !box.height) return
  const width = box.width + DIAGRAM_PADDING * 2
  svg.setAttribute(
    'viewBox',
    `${box.x - DIAGRAM_PADDING} ${box.y - DIAGRAM_PADDING} ${width} ${box.height + DIAGRAM_PADDING * 2}`,
  )
  svg.style.maxWidth = `${width}px`
}

function getPrefersDarkMode() {
  return (
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-color-scheme: dark)').matches
  )
}

export function MermaidDiagram({ value }: { value: MermaidDiagramValue }) {
  const renderId = `mermaid-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`
  const [state, setState] = useState<RenderState>({ status: 'loading' })
  const [prefersDarkMode, setPrefersDarkMode] = useState(getPrefersDarkMode)
  const svgContainerRef = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    if (state.status === 'rendered') fitSvgToContent(svgContainerRef.current)
  }, [state])

  useEffect(() => {
    const colorScheme = window.matchMedia('(prefers-color-scheme: dark)')
    const updateColorScheme = () => setPrefersDarkMode(colorScheme.matches)

    colorScheme.addEventListener('change', updateColorScheme)
    return () => colorScheme.removeEventListener('change', updateColorScheme)
  }, [])

  useEffect(() => {
    if (!value.code) return

    let active = true

    async function renderDiagram() {
      try {
        const mermaid = await loadMermaid()
        const foreground = prefersDarkMode ? '#f1efe8' : '#111111'
        const background = prefersDarkMode ? '#10100f' : '#f4f2ed'

        mermaid.initialize({
          startOnLoad: false,
          suppressErrorRendering: true,
          securityLevel: 'strict',
          theme: 'base',
          themeVariables: {
            background,
            fontFamily:
              'DM Sans Variable, ui-sans-serif, system-ui, sans-serif',
            lineColor: foreground,
            primaryColor: background,
            primaryTextColor: foreground,
            primaryBorderColor: foreground,
            secondaryColor: prefersDarkMode ? '#202744' : '#dfe5ff',
            secondaryTextColor: foreground,
            tertiaryColor: prefersDarkMode ? '#252523' : '#ffffff',
          },
        })
        const themedRenderId = `${renderId}-${prefersDarkMode ? 'dark' : 'light'}`
        const { svg } = await mermaid.render(themedRenderId, value.code ?? '')

        if (active) setState({ status: 'rendered', svg })
      } catch {
        if (active) setState({ status: 'error' })
      }
    }

    void renderDiagram()

    return () => {
      active = false
    }
  }, [prefersDarkMode, renderId, value.code])

  if (!value.code) return null

  return (
    <figure className="not-prose border-foreground/15 my-10 border-y py-8 sm:py-10">
      {state.status === 'rendered' ? (
        <div
          ref={svgContainerRef}
          className="flex min-h-52 items-center justify-center overflow-x-auto [&_svg]:h-auto [&_svg]:max-w-full"
          role="img"
          aria-label={value.caption || 'Architecture diagram'}
          dangerouslySetInnerHTML={{ __html: state.svg }}
        />
      ) : state.status === 'error' ? (
        <pre className="bg-foreground text-background overflow-x-auto p-5 font-mono text-xs leading-6">
          <code>{value.code}</code>
        </pre>
      ) : (
        <div
          className="bg-foreground/5 min-h-52 animate-pulse"
          aria-hidden="true"
        />
      )}
      {value.caption && (
        <figcaption className="text-fg-muted mx-auto mt-5 max-w-2xl text-center text-sm leading-6">
          {value.caption}
        </figcaption>
      )}
    </figure>
  )
}
