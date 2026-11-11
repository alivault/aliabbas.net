import { useCallback, useEffect, useRef, useState } from 'react'
import type { KeyboardEvent } from 'react'
import EvidenceLayout, {
  PANEL_SPRING_MS,
} from '~/components/chat/EvidenceLayout'
import EvidencePanel, {
  EvidenceRail,
  evidenceSourceElementId,
} from '~/components/chat/EvidencePanel'
import type { LabScenario } from '~/lib/lab/fake-stream'
import LabAnswer from './LabAnswer'
import { useLabMotion } from './lab-motion'
import Specimen from './Specimen'
import { useIsDesktop } from './use-is-desktop'
import { useLabStream } from './use-lab-stream'
import { usePanelRef } from 'react-resizable-panels'
import { revealSource } from '~/lib/chat/reveal-source'

const ID = 'fluid-resizer'
const PREFIX = 'lab-aside'
const EVIDENCE_ID = 'lab-evidence-panel'

type FocusTarget = 'heading' | 'rail' | { sourceId: string }

export default function ResizerSpecimen() {
  const stream = useLabStream('done')
  const isDesktop = useIsDesktop()
  const { reduce } = useLabMotion()
  const [collapsed, setCollapsed] = useState(false)
  const [activeSourceId, setActiveSourceId] = useState<string | null>(null)
  const [hoveredSourceId, setHoveredSourceId] = useState<string | null>(null)
  const [focusTarget, setFocusTarget] = useState<{
    target: FocusTarget
    nonce: number
  } | null>(null)
  const panelRef = usePanelRef()
  const groupElementRef = useRef<HTMLDivElement | null>(null)
  const openWidthRef = useRef<number | null>(null)
  const animationTimerRef = useRef(0)
  const triggerRef = useRef<HTMLElement | null>(null)
  const { turn } = stream

  const requestFocus = (target: FocusTarget) =>
    setFocusTarget((request) => ({
      target,
      nonce: (request?.nonce ?? 0) + 1,
    }))

  /** The same open and collapse as the chat, with the spring as CSS. */
  const setPanelOpen = useCallback(
    (open: boolean) => {
      const panel = panelRef.current
      if (!panel || panel.isCollapsed() !== open) return
      const group = groupElementRef.current
      if (group && !reduce) {
        group.setAttribute('data-animating', '')
        window.clearTimeout(animationTimerRef.current)
        animationTimerRef.current = window.setTimeout(() => {
          group.removeAttribute('data-animating')
          setCollapsed(panelRef.current?.isCollapsed() ?? !open)
        }, PANEL_SPRING_MS + 50)
      }
      setCollapsed(!open)
      const width = openWidthRef.current
      if (open && width) panel.resize(`${Math.round(width)}px`)
      else if (open) panel.expand()
      else panel.collapse()
    },
    [panelRef, reduce],
  )

  useEffect(() => () => window.clearTimeout(animationTimerRef.current), [])

  // Move focus after the panel renders the new state.
  useEffect(() => {
    if (!focusTarget) return
    const { target } = focusTarget
    let frame = 0
    let tries = 0
    const attempt = () => {
      const element =
        target === 'heading'
          ? document.getElementById(`${PREFIX}-heading`)
          : target === 'rail'
            ? document.querySelector<HTMLElement>(
                `#${EVIDENCE_ID} button[aria-expanded="false"]`,
              )
            : document.getElementById(
                evidenceSourceElementId(PREFIX, target.sourceId),
              )
      if (element) {
        element.focus({ preventScroll: true })
        if (typeof target === 'object') {
          requestAnimationFrame(() => revealSource(element))
        }
        return
      }
      tries += 1
      if (tries < 30) frame = requestAnimationFrame(attempt)
    }
    frame = requestAnimationFrame(attempt)
    return () => cancelAnimationFrame(frame)
  }, [focusTarget])

  const rememberTrigger = () => {
    triggerRef.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null
  }

  const handleCite = useCallback(
    (sourceId: string) => {
      // A second click on a selected citation clears the selection, when
      // the panel shows it.
      if (!collapsed && activeSourceId === sourceId) {
        setActiveSourceId(null)
        return
      }
      rememberTrigger()
      setActiveSourceId(sourceId)
      setPanelOpen(true)
      requestFocus({ sourceId })
    },
    [collapsed, activeSourceId, setPanelOpen],
  )

  const handleEvidenceKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key !== 'Escape') return
    const trigger = triggerRef.current
    if (!trigger?.isConnected) return
    event.preventDefault()
    trigger.focus()
  }

  const run = stream.run
  const labStream = {
    ...stream,
    run: (scenario: LabScenario) => {
      setActiveSourceId(null)
      run(scenario)
    },
  }

  const conversation = (
    <div className="h-full overflow-y-auto overscroll-contain p-5">
      <LabAnswer
        turn={turn}
        activeSourceId={activeSourceId}
        hoveredSourceId={hoveredSourceId}
        preview={collapsed}
        onCite={handleCite}
        onHover={setHoveredSourceId}
        onRetry={stream.retry}
      />
    </div>
  )

  return (
    <Specimen
      id={ID}
      number="3"
      title="Fluid resizer"
      wide
      stream={labStream}
      description="Drag to resize the evidence panel, or collapse it to a rail."
      keys="On the handle, arrows resize and Enter toggles the panel."
    >
      {isDesktop ? (
        <div className="border-foreground/10 bg-background h-[460px] overflow-hidden rounded-lg border">
          <EvidenceLayout
            layoutId="lab-evidence-layout"
            showEvidence
            collapsed={collapsed}
            onCollapsedChange={setCollapsed}
            onEvidenceKeyDown={handleEvidenceKeyDown}
            onToggle={() => setPanelOpen(collapsed)}
            openWidthRef={openWidthRef}
            panelRef={panelRef}
            groupElementRef={groupElementRef}
            evidenceId={EVIDENCE_ID}
            conversation={conversation}
            evidence={
              <EvidencePanel
                idPrefix={PREFIX}
                headingId={`${PREFIX}-heading`}
                turn={turn}
                scope={undefined}
                activeSourceId={activeSourceId}
                hoveredSourceId={hoveredSourceId}
                onHover={setHoveredSourceId}
                onSelect={setActiveSourceId}
                onShowLatest={() => undefined}
                onCollapse={() => {
                  setPanelOpen(false)
                  requestFocus('rail')
                }}
              />
            }
            rail={
              <EvidenceRail
                controlsId={EVIDENCE_ID}
                onExpand={() => {
                  setPanelOpen(true)
                  requestFocus('heading')
                }}
                sourceCount={turn?.sources.length ?? 0}
                streaming={turn?.status === 'streaming'}
              />
            }
          />
        </div>
      ) : (
        <div className="space-y-4">
          <p className="border-foreground/15 text-fg-muted rounded-lg border border-dashed p-4 text-sm leading-6">
            Needs a wider screen. Phones get the drawer instead.
          </p>
          <LabAnswer turn={turn} onRetry={stream.retry} />
        </div>
      )}
    </Specimen>
  )
}
