import { useCallback, useRef, useState } from 'react'
import { FileSearch } from 'lucide-react'
import { Button } from '~/components/ui/button'
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerTitle,
} from '~/components/ui/drawer'
import EvidencePanel, {
  evidenceSourceElementId,
} from '~/components/chat/EvidencePanel'
import type { LabScenario } from '~/lib/lab/fake-stream'
import LabAnswer from './LabAnswer'
import Specimen from './Specimen'
import { useIsDesktop } from './use-is-desktop'
import { useLabStream } from './use-lab-stream'
import { revealSource } from '~/lib/chat/reveal-source'

const ID = 'citation-drawer'
const PREFIX = 'lab-drawer'

export default function CitationDrawerSpecimen() {
  // It opens in the middle of a stream, as the other demos do.
  const stream = useLabStream('streaming')
  const isDesktop = useIsDesktop()
  const [open, setOpen] = useState(false)
  const [activeSourceId, setActiveSourceId] = useState<string | null>(null)
  const [hoveredSourceId, setHoveredSourceId] = useState<string | null>(null)
  const triggerRef = useRef<HTMLElement | null>(null)
  const { turn } = stream
  const sourceCount = turn?.sources.length ?? 0

  const openDrawer = useCallback((sourceId: string | null) => {
    triggerRef.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null
    setActiveSourceId(sourceId)
    setOpen(true)
  }, [])

  const run = stream.run
  const labStream = {
    ...stream,
    run: (scenario: LabScenario) => {
      setActiveSourceId(null)
      run(scenario)
    },
  }

  return (
    <Specimen
      id={ID}
      title="Citation drawer"
      stream={labStream}
      description="Evidence in a drawer: from the bottom on a phone, from the right on a wide screen."
      keys="Enter on a chip opens its source. Esc closes and returns focus."
    >
      <div className="space-y-5">
        <LabAnswer
          turn={turn}
          activeSourceId={open ? activeSourceId : null}
          hoveredSourceId={hoveredSourceId}
          preview={false}
          onCite={(sourceId) => openDrawer(sourceId)}
          onHover={setHoveredSourceId}
          onRetry={stream.retry}
          hideQuestion
        />
        <Button
          variant="secondary"
          aria-haspopup="dialog"
          aria-expanded={open}
          disabled={!turn}
          onClick={() => openDrawer(null)}
        >
          <FileSearch aria-hidden="true" />
          Open evidence
          <span className="text-fg-muted tabular-nums">
            · {sourceCount} {sourceCount === 1 ? 'source' : 'sources'}
          </span>
        </Button>
      </div>

      <Drawer
        // Snap points are fixed when the drawer mounts, so a new layout
        // mounts a new drawer.
        key={isDesktop ? 'desktop' : 'mobile'}
        open={open}
        onOpenChange={setOpen}
        swipeDirection={isDesktop ? 'right' : 'down'}
        snapPoints={isDesktop ? undefined : [0.6, 1]}
        // Focus scrolls the card into the drawer's full height, which can
        // reach below the screen at a snap point. Once the drawer settles,
        // bring the card into the part on screen.
        onOpenChangeComplete={(open) => {
          const card =
            open && activeSourceId
              ? document.getElementById(
                  evidenceSourceElementId(PREFIX, activeSourceId),
                )
              : null
          if (card) revealSource(card)
        }}
        showSwipeHandle
      >
        <DrawerContent
          // The side drawer starts below the fixed site header.
          className={isDesktop ? 'top-header!' : undefined}
          initialFocus={() =>
            (activeSourceId &&
              document.getElementById(
                evidenceSourceElementId(PREFIX, activeSourceId),
              )) ||
            document.getElementById(`${PREFIX}-heading`) ||
            true
          }
          finalFocus={() =>
            triggerRef.current?.isConnected ? triggerRef.current : true
          }
        >
          <DrawerTitle className="sr-only">Evidence</DrawerTitle>
          <DrawerDescription className="sr-only">
            The sources that the answer cites.
            {!isDesktop && ' Drag up to see more.'}
          </DrawerDescription>
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-[calc(2rem_+_var(--drawer-snap-offset,0px))] [--evidence-pad:0.75rem] [--evidence-surface:var(--color-popover)]">
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
            />
          </div>
        </DrawerContent>
      </Drawer>
    </Specimen>
  )
}
