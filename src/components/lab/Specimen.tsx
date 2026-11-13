import type { ReactNode } from 'react'
import { cn } from 'cn'
import { tabId } from './specimens'
import type { SpecimenId } from './specimens'
import StateBar, { StateTrack } from './StateBar'
import type { LabStream } from './use-lab-stream'

/** A short HUD label over a group of controls. */
function Label({ children }: { children: ReactNode }) {
  return (
    <h3 className="font-hud text-hud/70 mb-3 text-xs tracking-[0.42em] uppercase">
      {children}
    </h3>
  )
}

/**
 * One demo of the lab, as a tab panel. A side column has what it does,
 * the controls of its stream, its machine state and its keys. The stage
 * next to it has only the live demo. Esc in the demo stops its stream.
 * Esc in a portal, such as the drawer, is left to the portal.
 */
export default function Specimen({
  children,
  description,
  id,
  keys,
  stream,
  title,
  controls,
}: {
  children: ReactNode
  description: ReactNode
  id: SpecimenId
  /** A short line on the keyboard path. */
  keys: ReactNode
  stream: LabStream
  title: string
  /** The own controls of this demo, above the stream controls. */
  controls?: ReactNode
}) {
  return (
    <section
      id={id}
      role="tabpanel"
      aria-labelledby={tabId(id)}
      className="grid gap-10 lg:grid-cols-[16rem_minmax(0,1fr)] lg:gap-14"
      onKeyDown={(event) => {
        if (
          event.key !== 'Escape' ||
          event.defaultPrevented ||
          !stream.isActive ||
          !(event.target instanceof Node) ||
          !event.currentTarget.contains(event.target)
        ) {
          return
        }
        event.preventDefault()
        stream.stop()
      }}
    >
      <h2 className="sr-only">{title}</h2>
      <aside className="flex flex-col gap-9">
        <p className="text-fg-secondary text-base leading-7">{description}</p>
        {controls}
        <div>
          <Label>Force a state</Label>
          <StateBar label={title} stream={stream} />
        </div>
        <div>
          <Label>Machine</Label>
          <StateTrack state={stream.machineState} />
        </div>
        <div>
          <Label>Keys</Label>
          <p className="text-fg-muted text-sm leading-6">{keys}</p>
        </div>
      </aside>
      <div
        className={cn(
          'border-hud/20 bg-background/60 min-w-0 self-start border p-5 backdrop-blur-[20px] sm:p-8',
        )}
      >
        {children}
      </div>
    </section>
  )
}

export { Label as SpecimenLabel }
