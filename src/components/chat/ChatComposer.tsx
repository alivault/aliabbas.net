import type { Ref } from 'react'
import { ArrowUp, Square } from 'lucide-react'
import { Button } from '~/components/ui/button'
import { Kbd } from '~/components/ui/kbd'
import { Textarea } from '~/components/ui/textarea'
import { cn } from 'cn'

export type ComposerLabels = {
  field: string
  placeholder: string
  busyPlaceholder: string
  submit: string
  stop: string
  stopAndSubmit: string
  /** The verb in the keyboard hint, for example "send". */
  submitHint: string
}

const chatLabels: ComposerLabels = {
  field: 'Ask a question about Ali',
  placeholder: 'Ask about experience, projects, skills…',
  busyPlaceholder: 'Type to ask something else…',
  submit: 'Send',
  stop: 'Stop the answer',
  stopAndSubmit: 'Stop the answer and send',
  submitHint: 'send',
}

/**
 * The composer stays editable while an answer streams. With an empty draft
 * the button stops the answer. With a draft it sends the new question, which
 * stops the current answer first. The button is one element in both modes,
 * so keyboard focus stays on it when the mode changes.
 */
export default function ChatComposer({
  className,
  id,
  isStreaming,
  labels = chatLabels,
  maxLength = 1000,
  onChange,
  onStop,
  onSubmit,
  showHints = false,
  textareaRef,
  value,
}: {
  className?: string
  id: string
  isStreaming: boolean
  labels?: ComposerLabels
  maxLength?: number
  onChange: (value: string) => void
  onStop: () => void
  onSubmit: () => void
  showHints?: boolean
  textareaRef?: Ref<HTMLTextAreaElement>
  value: string
}) {
  const hasDraft = value.trim().length > 0
  const showStop = isStreaming && !hasDraft
  const hintId = `${id}-hints`

  return (
    <div className={className}>
      <form
        onSubmit={(event) => {
          event.preventDefault()
          if (hasDraft) onSubmit()
        }}
        className="border-foreground/15 bg-background focus-within:border-brand/60 relative flex items-end gap-2 rounded-[23px] border p-1"
      >
        <label htmlFor={id} className="sr-only">
          {labels.field}
        </label>
        <Textarea
          ref={textareaRef}
          id={id}
          value={value}
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
          maxLength={maxLength}
          rows={1}
          placeholder={
            isStreaming ? labels.busyPlaceholder : labels.placeholder
          }
          className="text-foreground placeholder:text-foreground/35 max-h-32 min-h-9 resize-none border-0 bg-transparent px-2 py-2 text-base shadow-none focus-visible:border-0 focus-visible:ring-0 md:text-base dark:bg-transparent"
        />
        <Button
          type={showStop ? 'button' : 'submit'}
          size="icon-lg"
          onClick={showStop ? onStop : undefined}
          disabled={!showStop && !hasDraft}
          aria-label={
            showStop
              ? labels.stop
              : isStreaming
                ? labels.stopAndSubmit
                : labels.submit
          }
          className={cn(
            'rounded-full transition-colors',
            showStop
              ? 'bg-foreground/10 text-foreground hover:bg-foreground/15'
              : 'bg-foreground text-background hover:bg-foreground hover:text-background',
          )}
        >
          {showStop ? (
            <Square className="size-3.5 fill-current" />
          ) : (
            <ArrowUp />
          )}
        </Button>
      </form>
      {showHints && (
        <p
          id={hintId}
          className="text-foreground/50 mt-2 hidden items-center justify-center gap-4 text-sm sm:flex [&_kbd]:h-6 [&_kbd]:px-1.5 [&_kbd]:text-sm"
        >
          <span>
            <Kbd>Enter</Kbd> {labels.submitHint}
          </span>
          <span>
            <Kbd>Shift</Kbd> <Kbd>Enter</Kbd> new line
          </span>
          {isStreaming && (
            <span>
              <Kbd>Esc</Kbd> stop
            </span>
          )}
        </p>
      )}
    </div>
  )
}
