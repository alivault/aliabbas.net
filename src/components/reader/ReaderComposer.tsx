import type { RefObject } from 'react'
import { cn } from '~/lib/utils'
import { hudText } from './Reader'

export type ComposerLabels = {
  /** The name of the field, for screen readers. */
  field: string
  placeholder: string
  busyPlaceholder: string
  submit: string
  stop: string
  stopAndSubmit: string
  /** The verb in the keyboard hint, for example "send". */
  submitHint: string
}

/**
 * The field of a reader that asks the AI (the chat and the claim checker).
 * Enter sends, Shift+Enter adds a line. While the AI works, the button
 * stops it; with new text typed, it sends that, which stops the work first.
 */
export default function ReaderComposer({
  id,
  fieldRef,
  labels,
  value,
  busy,
  maxLength = 1000,
  showHints = false,
  onChange,
  onSubmit,
  onStop,
}: {
  id: string
  fieldRef?: RefObject<HTMLTextAreaElement | null>
  labels: ComposerLabels
  value: string
  busy: boolean
  maxLength?: number
  showHints?: boolean
  onChange: (value: string) => void
  onSubmit: () => void
  onStop: () => void
}) {
  const hasDraft = value.trim().length > 0
  const showStop = busy && !hasDraft
  const hintId = `${id}-hints`
  return (
    <div>
      <form
        onSubmit={(event) => {
          event.preventDefault()
          if (hasDraft) onSubmit()
        }}
        // The field is a control, not a label: 14px, for typing.
        className={cn(hudText, 'flex max-w-[60ch] items-end gap-8 text-sm')}
      >
        <label htmlFor={id} className="sr-only">
          {labels.field}
        </label>
        <textarea
          ref={fieldRef}
          id={id}
          value={value}
          rows={1}
          maxLength={maxLength}
          aria-describedby={showHints ? hintId : undefined}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={(event) => {
            if (
              event.key === 'Enter' &&
              !event.shiftKey &&
              !event.nativeEvent.isComposing
            ) {
              event.preventDefault()
              if (hasDraft) onSubmit()
            }
          }}
          placeholder={busy ? labels.busyPlaceholder : labels.placeholder}
          autoComplete="off"
          className="border-hud/40 focus:border-hud placeholder:text-hud/45 field-sizing-content max-h-48 min-w-0 flex-1 resize-none border-b bg-transparent py-2 tracking-[0.42em] uppercase outline-none"
        />
        <button
          type={showStop ? 'button' : 'submit'}
          data-sound={showStop ? 'none' : 'send'}
          onClick={showStop ? onStop : undefined}
          disabled={!showStop && !hasDraft}
          aria-label={
            showStop ? labels.stop : busy ? labels.stopAndSubmit : labels.submit
          }
          className="hud-fill mb-2 uppercase disabled:opacity-50"
        >
          {showStop ? 'Stop' : labels.submitHint}
        </button>
      </form>
      {showHints ? (
        <p
          id={hintId}
          className="text-fg-muted mt-3 hidden gap-6 text-sm sm:flex"
        >
          <span>Enter to {labels.submitHint}</span>
          <span>Shift+Enter for a new line</span>
          {busy ? <span>Esc to stop</span> : null}
        </p>
      ) : null}
    </div>
  )
}
