import { useEffect, useState } from 'react'
import { Link, useRouter } from '@tanstack/react-router'
import { ArrowLeft, FastForward, Rewind, Volume2, VolumeX } from 'lucide-react'
import { cn } from '~/lib/utils'
import {
  VIBE_NAMES,
  getVibe,
  isSoundOn,
  onSoundChange,
  onVibeChange,
  play,
  setSound,
  stepVibe,
} from '~/lib/sound'
import GuideArrows from './GuideArrows'
import { SHEETS } from './sheets'
import { setWorld, useWorld, worldCommands } from './store'

const corner = 'hud-fill pointer-events-auto disabled:opacity-50'

/**
 * The HUD over the world. The name at the top center goes home; on a page,
 * Back at the top left goes to where the visitor came from, top right opens the index, bottom left turns
 * the sound on or off, and bottom right flies to the next page.
 */
export default function Hud({ inPage }: { inPage: boolean }) {
  const indexOpen = useWorld((s) => s.indexOpen)
  const hover = useWorld((s) => s.hover)
  const ready = useWorld((s) => s.ready)
  const phase = useWorld((s) => s.phase)
  const lost = useWorld((s) => s.lost)
  const [soundOn, setSoundOn] = useState(false)
  const [vibe, setVibe] = useState(0)
  /** The name of the vibe shows for a moment after a change. */
  const [vibeShown, setVibeShown] = useState(false)
  const router = useRouter()

  useEffect(() => {
    setSoundOn(isSoundOn())
    setVibe(getVibe())
    const offSound = onSoundChange(setSoundOn)
    const offVibe = onVibeChange((index) => {
      setVibe(index)
      setVibeShown(true)
    })
    return () => {
      offSound()
      offVibe()
    }
  }, [])

  useEffect(() => {
    if (!vibeShown) return
    const timer = window.setTimeout(() => setVibeShown(false), 2400)
    return () => window.clearTimeout(timer)
  }, [vibeShown, vibe])

  const hovered = SHEETS.find((s) => s.id === hover)

  // Back to where the visitor came from in this site. A page opened from
  // outside (a link, a new tab) goes up instead: a note to the notes, and
  // a page to the world.
  const back = () => {
    if (router.history.canGoBack()) {
      router.history.back()
      return
    }
    const path = router.state.location.pathname.replace(/\/+$/, '')
    const parent = path.slice(0, path.lastIndexOf('/'))
    void router.navigate({ to: parent || '/' })
  }

  return (
    <div
      data-hud
      className="font-hud text-hud pointer-events-none fixed inset-0 z-30 text-xs tracking-[0.42em] uppercase [&_:is(button,a,input)]:uppercase"
    >
      {inPage && !indexOpen ? (
        <div className="absolute top-5 left-6">
          <button
            type="button"
            data-sound="none"
            className={cn(corner, 'inline-flex items-center gap-3')}
            onClick={back}
          >
            <ArrowLeft
              aria-hidden="true"
              className="size-4 -translate-y-px"
              strokeWidth={1.5}
            />
            Back
          </button>
        </div>
      ) : null}

      {/* The name, at the center of the top; on a phone, at the left, where
          Back takes its place on a page. The tracking adds space after the
          last letter too; a negative margin of the same size centers the
          letters themselves. */}
      <div className="absolute top-5 left-6 sm:left-1/2 sm:-translate-x-1/2">
        <Link
          to="/"
          data-sound="none"
          // On a phone, the name gives its room to Back on a page.
          className={cn(
            corner,
            '-mr-[0.42em] whitespace-nowrap',
            inPage && !indexOpen && 'max-sm:hidden',
          )}
          // Home also closes the index, when it is open.
          onClick={() => setWorld({ indexOpen: false })}
        >
          Ali Abbas
        </Link>
      </div>

      <div className="absolute top-5 right-6 flex flex-col items-end gap-1">
        {indexOpen ? (
          <button
            type="button"
            className={corner}
            onClick={() => setWorld({ indexOpen: false })}
          >
            Return
          </button>
        ) : (
          <button
            type="button"
            aria-haspopup="dialog"
            className={corner}
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
          (hovered || lost) && !inPage && !indexOpen
            ? 'opacity-100'
            : 'opacity-0',
        )}
      >
        {hovered ? hovered.title : lost ? 'Lost? Click Next' : ''}
      </p>

      {/* Toward the nearest icons, when none is in sight. */}
      {inPage || indexOpen ? null : <GuideArrows />}

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
        {soundOn ? (
          // The music: one of five vibes. Its name shows above for a
          // moment after a change.
          <div className="ml-4 flex items-center gap-4">
            <button
              type="button"
              data-sound="none"
              aria-label="Previous music"
              className={corner}
              onClick={() => stepVibe(-1)}
            >
              <Rewind aria-hidden="true" className="size-6" strokeWidth={1.5} />
            </button>
            <button
              type="button"
              data-sound="none"
              aria-label="Next music"
              className={corner}
              onClick={() => stepVibe(1)}
            >
              <FastForward
                aria-hidden="true"
                className="size-6"
                strokeWidth={1.5}
              />
            </button>
            <p
              aria-live="polite"
              className={cn(
                'absolute bottom-full left-0 mb-2 whitespace-nowrap transition-opacity duration-500',
                vibeShown ? 'opacity-100' : 'opacity-0',
              )}
            >
              <span className="sr-only">Music: </span>
              {VIBE_NAMES[vibe]}
              <span className="text-hud/60">
                {' '}
                {vibe + 1}/{VIBE_NAMES.length}
              </span>
            </p>
          </div>
        ) : null}
      </div>

      {inPage || indexOpen ? null : (
        <div className="absolute right-6 bottom-6">
          <button
            type="button"
            data-sound="none"
            // When the visitor is lost, Next pulses: it is the way back.
            className={cn(
              corner,
              'text-lg',
              lost && 'motion-safe:animate-pulse',
            )}
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
