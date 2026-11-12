import { useEffect, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { Volume2, VolumeX } from 'lucide-react'
import { cn } from '~/lib/utils'
import { isSoundOn, onSoundChange, play, setSound } from '~/lib/sound'
import { SHEETS } from './sheets'
import { setWorld, useWorld, worldCommands } from './store'

const corner = 'hud-fill pointer-events-auto disabled:opacity-50'

/**
 * The HUD: four corners over the world. Top left goes home (also out of a
 * page, back to the world), top right opens the index, bottom left turns
 * the sound on or off, and bottom right flies to the next page.
 */
export default function Hud({ inPage }: { inPage: boolean }) {
  const indexOpen = useWorld((s) => s.indexOpen)
  const hover = useWorld((s) => s.hover)
  const ready = useWorld((s) => s.ready)
  const phase = useWorld((s) => s.phase)
  const [soundOn, setSoundOn] = useState(false)

  useEffect(() => {
    setSoundOn(isSoundOn())
    return onSoundChange(setSoundOn)
  }, [])

  const hovered = SHEETS.find((s) => s.id === hover)

  return (
    <div
      data-hud
      className="font-hud text-hud pointer-events-none fixed inset-0 z-30 text-sm tracking-[0.42em] uppercase [&_:is(button,a,input)]:uppercase"
    >
      {/* On a phone, the text of a page scrolls under the corners: a dark
          band behind each edge keeps the HUD and the text apart. */}
      {inPage ? (
        <>
          <div
            aria-hidden="true"
            className="from-background via-background absolute inset-x-0 top-0 h-28 bg-linear-to-b via-55% to-transparent lg:hidden"
          />
          <div
            aria-hidden="true"
            className="from-background via-background absolute inset-x-0 bottom-0 h-24 bg-linear-to-t via-45% to-transparent lg:hidden"
          />
        </>
      ) : null}
      <div className="absolute top-5 left-6">
        <Link to="/" data-sound="none" className={corner}>
          Ali Abbas
        </Link>
      </div>

      <div className="absolute top-5 right-6 flex flex-col items-end gap-1">
        {indexOpen ? (
          <button
            type="button"
            className={cn(corner, 'text-lg')}
            onClick={() => setWorld({ indexOpen: false })}
          >
            Return
          </button>
        ) : (
          <button
            type="button"
            aria-haspopup="dialog"
            className={cn(corner, 'text-lg')}
            onClick={() => setWorld({ indexOpen: true, hover: null })}
          >
            Index
          </button>
        )}
      </div>

      {/* The name of the sheet under the pointer. */}
      <p
        aria-live="polite"
        className={cn(
          'absolute bottom-20 left-1/2 -translate-x-1/2 text-center whitespace-nowrap transition-opacity',
          hovered && !inPage ? 'opacity-100' : 'opacity-0',
        )}
      >
        {hovered ? `${hovered.title} · ${hovered.kind}` : ''}
      </p>

      <div className="absolute bottom-6 left-6 flex items-center">
        <button
          type="button"
          data-sound="toggle"
          aria-label="Sound"
          aria-pressed={soundOn}
          title={soundOn ? 'Sound on' : 'Sound off'}
          className={corner}
          onClick={() => {
            const next = !soundOn
            setSound(next)
            if (next) play('toggle')
          }}
        >
          {soundOn ? (
            <Volume2 aria-hidden="true" className="size-6" strokeWidth={1.5} />
          ) : (
            <VolumeX aria-hidden="true" className="size-6" strokeWidth={1.5} />
          )}
        </button>
      </div>

      {inPage || indexOpen ? null : (
        <div className="absolute right-6 bottom-6">
          <button
            type="button"
            data-sound="none"
            className={cn(corner, 'text-lg')}
            disabled={!ready || phase !== 'roam'}
            onClick={() => worldCommands.next()}
          >
            Next
          </button>
        </div>
      )}
    </div>
  )
}
