import { useRef } from 'react'
import type {
  CSSProperties,
  KeyboardEventHandler,
  ReactNode,
  RefObject,
} from 'react'
import { spring } from 'motion'
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '~/components/ui/resizable'
import { useDefaultLayout } from 'react-resizable-panels'
import type { PanelImperativeHandle } from 'react-resizable-panels'

export const EVIDENCE_COLLAPSED_PX = 56

/**
 * A spring for the collapse and expand transition, as a CSS easing. Motion
 * samples the spring into `linear()`, so the browser runs real spring
 * physics on the compositor without JavaScript on each frame. A drag does
 * not use it: the panel follows the pointer directly.
 */
export const PANEL_SPRING = String(
  spring({ keyframes: [0, 1], stiffness: 380, damping: 36, mass: 1 }),
)
export const PANEL_SPRING_MS = Number.parseInt(PANEL_SPRING, 10) || 400

const layoutStorage = {
  getItem: (key: string) => {
    try {
      return window.localStorage.getItem(key)
    } catch {
      return null
    }
  },
  setItem: (key: string, value: string) => {
    try {
      window.localStorage.setItem(key, value)
    } catch {
      // Private mode or a full quota: the layout is not saved.
    }
  },
}

/**
 * The conversation and the evidence panel. The panel is collapsible and
 * resizable, with the pointer or with the arrow keys on the handle. The
 * layout is saved, and the panel keeps its pixel width when the window
 * changes, so the answer column does not move.
 */
export default function EvidenceLayout({
  collapsed,
  conversation,
  evidence,
  evidenceId,
  groupElementRef,
  layoutId = 'ask-ali-evidence-layout',
  onCollapsedChange,
  onEvidenceKeyDown,
  onToggle,
  openWidthRef,
  panelRef,
  rail,
  showEvidence,
}: {
  collapsed: boolean
  conversation: ReactNode
  evidence: ReactNode
  evidenceId: string
  groupElementRef: RefObject<HTMLDivElement | null>
  /** The key for the saved layout, so two layouts do not share it. */
  layoutId?: string
  onCollapsedChange: (collapsed: boolean) => void
  onEvidenceKeyDown: KeyboardEventHandler<HTMLElement>
  /** Open or collapse the panel, for a click on the handle. */
  onToggle: () => void
  /** The last width of the open panel, so it opens again at that width. */
  openWidthRef: RefObject<number | null>
  panelRef: RefObject<PanelImperativeHandle | null>
  rail: ReactNode
  showEvidence: boolean
}) {
  // A click on the handle toggles the panel. A drag resizes it. The
  // distance between press and release tells the two apart.
  const pressRef = useRef<{ x: number; y: number } | null>(null)

  const { defaultLayout, onLayoutChanged } = useDefaultLayout({
    id: layoutId,
    panelIds: showEvidence ? ['conversation', 'evidence'] : ['conversation'],
    storage: layoutStorage,
  })

  return (
    <ResizablePanelGroup
      orientation="horizontal"
      defaultLayout={defaultLayout}
      onLayoutChanged={(layout, meta) => {
        onLayoutChanged(layout, meta)
        // The final layout after a drag, key press or toggle. Sizes
        // measured during a drag or the spring are not final.
        const percent = layout.evidence
        const groupWidth = groupElementRef.current?.clientWidth
        if (percent === undefined || !groupWidth) return
        const width = (percent / 100) * groupWidth
        if (width > EVIDENCE_COLLAPSED_PX + 1) openWidthRef.current = width
      }}
      elementRef={groupElementRef}
      style={{ '--panel-spring': PANEL_SPRING } as CSSProperties}
      className="min-h-0 [&[data-animating]>[data-panel]]:[transition:flex-grow_var(--panel-spring)]"
    >
      <ResizablePanel
        id="conversation"
        minSize={440}
        className="flex h-full min-w-0 flex-col"
      >
        {conversation}
      </ResizablePanel>
      {showEvidence && (
        <>
          <ResizableHandle
            withHandle
            aria-label="Resize the evidence panel"
            title={
              collapsed
                ? 'Drag to resize · Click to open'
                : 'Drag to resize · Click to collapse'
            }
            onPointerDown={(event) => {
              pressRef.current = { x: event.clientX, y: event.clientY }
            }}
            onClick={(event) => {
              const press = pressRef.current
              pressRef.current = null
              if (
                press &&
                Math.hypot(event.clientX - press.x, event.clientY - press.y) < 4
              ) {
                onToggle()
              }
            }}
            className="bg-foreground/10 data-[separator=active]:bg-brand data-[separator=hover]:bg-brand/50 [&>div]:bg-foreground/20 transition-colors"
          />
          <ResizablePanel
            id="evidence"
            panelRef={panelRef}
            collapsible
            collapsedSize={EVIDENCE_COLLAPSED_PX}
            minSize={300}
            maxSize={560}
            defaultSize={400}
            groupResizeBehavior="preserve-pixel-size"
            onResize={() => {
              // During the spring, the panel passes through sizes between
              // collapsed and open. The toggle sets the state itself.
              if (groupElementRef.current?.hasAttribute('data-animating')) {
                return
              }
              onCollapsedChange(panelRef.current?.isCollapsed() ?? false)
            }}
            className="h-full overflow-hidden"
          >
            <aside
              id={evidenceId}
              aria-label="Evidence"
              onKeyDown={onEvidenceKeyDown}
              className="h-full"
            >
              {collapsed ? (
                rail
              ) : (
                <div className="h-full min-w-[300px] overflow-y-auto overscroll-contain px-5 py-6">
                  {evidence}
                </div>
              )}
            </aside>
          </ResizablePanel>
        </>
      )}
    </ResizablePanelGroup>
  )
}
