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
  // Only the browser draws diagrams. In the server build this is a
  // constant, so the build drops mermaid and its diagram chunks (about 8 MB)
  // from the Worker.
  if (import.meta.env.SSR) {
    return Promise.reject(new Error('Mermaid runs in the browser only.'))
  }
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

/**
 * A color token of the site as rgb(), for mermaid, which does not read
 * oklch(): paint one pixel with it and read the pixel back.
 */
function tokenColor(name: string, fallback: string) {
  const value = getComputedStyle(document.documentElement)
    .getPropertyValue(name)
    .trim()
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = 1
  const context = canvas.getContext('2d', { willReadFrequently: true })
  if (!value || !context) return fallback
  context.fillStyle = value
  context.fillRect(0, 0, 1, 1)
  const [r, g, b] = context.getImageData(0, 0, 1, 1).data
  return `#${[r, g, b].map((c) => c.toString(16).padStart(2, '0')).join('')}`
}

export function MermaidDiagram({ value }: { value: MermaidDiagramValue }) {
  const renderId = `mermaid-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`
  const [state, setState] = useState<RenderState>({ status: 'loading' })
  const svgContainerRef = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    if (state.status === 'rendered') fitSvgToContent(svgContainerRef.current)
  }, [state])

  useEffect(() => {
    if (!value.code) return

    let active = true

    async function renderDiagram() {
      try {
        const mermaid = await loadMermaid()
        // The site is dark only: the diagram uses its tokens, with the
        // HUD orange for the edges of the boxes.
        const foreground = tokenColor('--foreground', '#e5e3dc')
        const background = tokenColor('--background', '#0d0f10')
        const hud = tokenColor('--hud', '#d9502a')
        const muted = tokenColor('--fg-muted', '#9a958c')

        mermaid.initialize({
          startOnLoad: false,
          suppressErrorRendering: true,
          securityLevel: 'strict',
          theme: 'base',
          themeVariables: {
            background,
            fontFamily:
              'DM Sans Variable, ui-sans-serif, system-ui, sans-serif',
            fontSize: '14px',
            lineColor: muted,
            primaryColor: background,
            primaryTextColor: foreground,
            primaryBorderColor: hud,
            secondaryColor: background,
            secondaryTextColor: foreground,
            tertiaryColor: background,
            edgeLabelBackground: background,
            clusterBkg: 'transparent',
            clusterBorder: hud,
          },
        })
        const themedRenderId = `${renderId}-dark`
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
  }, [renderId, value.code])

  if (!value.code) return null

  return (
    <figure className="not-prose my-12 sm:my-16">
      {state.status === 'rendered' ? (
        <div
          ref={svgContainerRef}
          className="flex min-h-52 items-center justify-center overflow-x-auto [&_svg]:h-auto [&_svg]:max-w-full"
          role="img"
          aria-label={value.caption || 'Architecture diagram'}
          dangerouslySetInnerHTML={{ __html: state.svg }}
        />
      ) : state.status === 'error' ? (
        <pre className="bg-foreground text-background overflow-x-auto p-5 font-mono text-sm leading-6">
          <code>{value.code}</code>
        </pre>
      ) : (
        <div
          className="bg-foreground/5 min-h-52 animate-pulse"
          aria-hidden="true"
        />
      )}
      {value.caption && (
        <figcaption className="text-fg-muted mt-3 max-w-[60ch] text-sm leading-6">
          {value.caption}
        </figcaption>
      )}
    </figure>
  )
}
