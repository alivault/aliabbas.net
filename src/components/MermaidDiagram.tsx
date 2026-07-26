import { useEffect, useId, useState } from 'react'

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
  mermaidPromise ??= import('mermaid').then(({ default: mermaid }) => {
    mermaid.initialize({
      startOnLoad: false,
      suppressErrorRendering: true,
      securityLevel: 'strict',
      theme: 'base',
      themeVariables: {
        background: '#f4f2ed',
        fontFamily: 'Inter Tight, ui-sans-serif, system-ui, sans-serif',
        lineColor: '#111111',
        primaryColor: '#f4f2ed',
        primaryTextColor: '#111111',
        primaryBorderColor: '#111111',
        secondaryColor: '#dfe5ff',
        secondaryTextColor: '#111111',
        tertiaryColor: '#ffffff',
      },
    })

    return mermaid
  })

  return mermaidPromise
}

export function MermaidDiagram({ value }: { value: MermaidDiagramValue }) {
  const renderId = `mermaid-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`
  const [state, setState] = useState<RenderState>({ status: 'loading' })

  useEffect(() => {
    if (!value.code) return

    let active = true

    async function renderDiagram() {
      try {
        const mermaid = await loadMermaid()
        const { svg } = await mermaid.render(renderId, value.code ?? '')

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
    <figure className="not-prose my-10 border-y border-black/15 py-8 sm:py-10">
      {state.status === 'rendered' ? (
        <div
          className="flex min-h-52 items-center justify-center overflow-x-auto [&_svg]:h-auto [&_svg]:max-w-full"
          role="img"
          aria-label={value.caption || 'Architecture diagram'}
          dangerouslySetInnerHTML={{ __html: state.svg }}
        />
      ) : state.status === 'error' ? (
        <pre className="overflow-x-auto bg-black p-5 font-mono text-xs leading-6 text-white">
          <code>{value.code}</code>
        </pre>
      ) : (
        <div className="min-h-52 animate-pulse bg-black/5" aria-hidden="true" />
      )}
      {value.caption && (
        <figcaption className="mt-5 text-center font-mono text-[9px] tracking-[0.12em] text-black/45 uppercase">
          {value.caption}
        </figcaption>
      )}
    </figure>
  )
}
