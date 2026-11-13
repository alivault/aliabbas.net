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
import ScrambleText from '~/components/ui/scramble-text'
import GuideArrows from './GuideArrows'
import { SHEETS } from './sheets'
import { setWorld, useWorld, worldCommands } from './store'

const corner = 'hud-fill pointer-events-auto disabled:opacity-50'

/**
 * The HUD over the world. The name at the top center goes home; on a page,
 * Back at the top left goes to where the visitor came from, top right opens the index, the sound and
 * music buttons sit left of Index, and bottom right flies to the next page.
 */
export default function Hud({ inPage }: { inPage: boolean }) {
  const indexOpen = useWorld((s) => s.indexOpen)
  const hover = useWorld((s) => s.hover)
  const ready = useWorld((s) => s.ready)
  const phase = useWorld((s) => s.phase)
  const lost = useWorld((s) => s.lost)
  const lightboxOpen = useWorld((s) => s.lightboxOpen)
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

      <div className="absolute top-5 right-6 flex items-center gap-6">
        {/* Music, then Sound, left of Index. Sound stays in place when the
            music buttons show. */}
        <div className="relative flex items-center gap-4">
          {soundOn ? (
            // The music: one of five vibes. Its name shows below for a
            // moment after a change.
            <>
              <button
                type="button"
                data-sound="none"
                aria-label="Previous music"
                className={corner}
                onClick={() => stepVibe(-1)}
              >
                <Rewind
                  aria-hidden="true"
                  className="size-4"
                  strokeWidth={1.5}
                />
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
                  className="size-4"
                  strokeWidth={1.5}
                />
              </button>
              <p
                aria-live="polite"
                className={cn(
                  'absolute top-full right-0 mt-2 whitespace-nowrap transition-opacity duration-500',
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
            </>
          ) : null}
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
              <Volume2
                aria-hidden="true"
                className="size-4"
                strokeWidth={1.5}
              />
            ) : (
              <VolumeX
                aria-hidden="true"
                className="size-4"
                strokeWidth={1.5}
              />
            )}
          </button>
        </div>

        {/* One control that changes its job in place: Index opens the
            index, Return closes it. Its label scrambles into the new word.
            Under the zoom view of a picture it reads Close, as the Close of
            the zoom view does, so it scrambles back to Index after it.
            Its slot is as wide as the longest word, and the label holds to
            the right edge, so the buttons at its left do not move while it
            scrambles. */}
        <div className="relative">
          <span aria-hidden="true" className="invisible">
            Return
          </span>
          <button
            type="button"
            aria-haspopup={indexOpen ? undefined : 'dialog'}
            className={cn(
              corner,
              'absolute top-0 right-0 whitespace-nowrap',
              lightboxOpen && 'invisible',
            )}
            onClick={() =>
              indexOpen
                ? setWorld({ indexOpen: false })
                : setWorld({ indexOpen: true, hover: null })
            }
          >
            <ScrambleText
              text={lightboxOpen ? 'Close' : indexOpen ? 'Return' : 'Index'}
            />
          </button>
        </div>
      </div>

      {/* The name of the sheet under the pointer: at the bottom center, in
          line with Next. On a phone, above Next, where it has no room at
          its side. */}
      <p
        aria-live="polite"
        className={cn(
          'absolute bottom-20 left-1/2 sm:bottom-6 sm:flex sm:h-7 sm:items-center -translate-x-1/2 text-center whitespace-nowrap transition-opacity',
          (hovered || lost) && !inPage && !indexOpen
            ? 'opacity-100'
            : 'opacity-0',
        )}
      >
        {hovered ? hovered.title : lost ? 'Lost? Click Next' : ''}
      </p>

      {/* Toward the nearest icons, when none is in sight. */}
      {inPage || indexOpen ? null : <GuideArrows />}

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
