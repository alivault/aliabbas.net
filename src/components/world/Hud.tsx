import { useEffect, useState } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import { Volume2, VolumeX } from 'lucide-react'
import { cn } from '~/lib/utils'
import { isSoundOn, onSoundChange, play, setSound } from '~/lib/sound'
import { SHEETS } from './sheets'
import {
  askOpenChat,
  setPendingQuestion,
  setWorld,
  useWorld,
  worldCommands,
} from './store'

const corner = 'hud-fill pointer-events-auto disabled:opacity-50'

/**
 * The HUD: four corners over the world. Top left goes home, top right counts
 * the sheets found, bottom left has sound and the next sheet (or the way
 * back out of a page), bottom right asks the AI.
 */
export default function Hud({ inPage }: { inPage: boolean }) {
  const navigate = useNavigate()
  const indexOpen = useWorld((s) => s.indexOpen)
  const hover = useWorld((s) => s.hover)
  const ready = useWorld((s) => s.ready)
  const phase = useWorld((s) => s.phase)
  const [soundOn, setSoundOn] = useState(false)
  const [question, setQuestion] = useState('')

  useEffect(() => {
    setSoundOn(isSoundOn())
    return onSoundChange(setSoundOn)
  }, [])

  const hovered = SHEETS.find((s) => s.id === hover)

  const ask = (event: React.FormEvent) => {
    event.preventDefault()
    const text = question.trim()
    if (!text) return
    setQuestion('')
    if (askOpenChat(text)) return
    setPendingQuestion(text)
    void navigate({ to: '/chat' })
  }

  return (
    <div
      data-hud
      className="font-hud text-hud pointer-events-none fixed inset-0 z-30 text-sm tracking-[0.42em] uppercase [&_:is(button,a,input)]:uppercase"
    >
      <Link
        to="/"
        data-sound="none"
        className={cn(corner, 'absolute top-5 left-6')}
      >
        Ali Abbas
      </Link>

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
          <>
            {inPage ? (
              <Link to="/" data-sound="none" className={cn(corner, 'text-lg')}>
                Close
              </Link>
            ) : null}
            <button
              type="button"
              aria-haspopup="dialog"
              className={cn(corner, inPage ? '' : 'text-lg')}
              onClick={() => setWorld({ indexOpen: true, hover: null })}
            >
              Index
            </button>
          </>
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

      <div className="absolute bottom-6 left-6 flex items-center gap-8">
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
        {inPage || indexOpen ? null : (
          <button
            type="button"
            data-sound="none"
            className={corner}
            disabled={!ready || phase !== 'roam'}
            onClick={() => worldCommands.next()}
          >
            Next
          </button>
        )}
      </div>

      {
        <form
          onSubmit={ask}
          className="absolute right-6 bottom-6 flex items-baseline gap-10"
        >
          <label className="sr-only" htmlFor="hud-ask">
            Ask the AI about Ali
          </label>
          <input
            id="hud-ask"
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            placeholder="Type here"
            autoComplete="off"
            className="placeholder:text-hud/45 pointer-events-auto w-56 bg-transparent tracking-[0.42em] uppercase outline-none"
          />
          <button type="submit" data-sound="send" className={corner}>
            Send
          </button>
        </form>
      }
    </div>
  )
}
