import { useCallback, useEffect, useId, useRef, useState } from 'react'
import { ArrowUpRight, Check, Link2, Pencil, RotateCcw } from 'lucide-react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import ChatComposer from '~/components/chat/ChatComposer'
import type { ComposerLabels } from '~/components/chat/ChatComposer'
import { usePanelActive } from '~/components/assistant/panel-active'
import PageHeading from '~/components/PageHeading'
import { buttonVariants } from '~/components/ui/button'
import { chipStyles } from '~/components/ui/chip'
import type { ChatSource } from '~/lib/chat/protocol'
import { isChecking } from '~/lib/check/check-machine'
import type { CheckState, CheckedPart } from '~/lib/check/check-machine'
import { highlightQuote } from '~/lib/check/evidence'
import type { EvidenceQuote } from '~/lib/check/evidence'
import { MAX_CLAIM_LENGTH } from '~/lib/check/protocol'
import { VERDICTS, VERDICT_INFO } from '~/lib/check/verdicts'
import { cn } from '~/lib/utils'
import { useClaimCheck } from './use-claim-check'
import VerdictBadge, { VERDICT_STYLE } from './VerdictBadge'
import { SPRINGS } from '~/lib/design/motion'

const COMPOSER_ID = 'claim-input'

const labels: ComposerLabels = {
  field: 'A claim about Ali to check',
  placeholder: 'Paste a claim, for example from a résumé or a recruiter note…',
  busyPlaceholder: 'Type to check a different claim…',
  submit: 'Check the claim',
  stop: 'Stop the check',
  stopAndSubmit: 'Stop the check and check this claim',
  submitHint: 'check',
}

const exampleClaims = [
  'Ali has shipped WebRTC in production.',
  'Ali led the design of TronChat and has worked at Super Studios since 2021.',
  'Ali built Pico in Rust.',
  'Ali has a computer science degree.',
  'Ali has five years of Kubernetes experience.',
] as const

const SPRING = SPRINGS.settle

function plural(count: number, word: string) {
  return `${count} ${word}${count === 1 ? '' : 's'}`
}

function ExampleClaims({
  onSelect,
  disabled,
}: {
  onSelect: (claim: string) => void
  disabled: boolean
}) {
  return (
    <div>
      <h2 className="text-foreground text-base font-semibold">Try a claim</h2>
      <ul className="mt-3 flex flex-wrap gap-2">
        {exampleClaims.map((claim) => (
          <li key={claim} className="max-w-full">
            <button
              type="button"
              disabled={disabled}
              onClick={() => onSelect(claim)}
              className={chipStyles()}
            >
              {claim}
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}

function VerdictLegend() {
  return (
    <section aria-labelledby="verdict-legend-heading">
      <h2
        id="verdict-legend-heading"
        className="text-foreground text-base font-semibold"
      >
        How the grades work
      </h2>
      <p className="text-fg-muted mt-3 max-w-xl text-sm leading-6">
        The checker splits a claim into parts and grades each part against the
        same sources as the chat. A grade that says the record supports or
        contradicts a part must quote the record. The server checks each quote
        word for word. If a quote is not in its source, the part becomes
        Unknown.
      </p>
      <dl className="border-foreground/10 mt-5 grid gap-px overflow-hidden rounded-xl border sm:grid-cols-2">
        {VERDICTS.map((verdict) => (
          <div
            key={verdict}
            className="bg-background outline-foreground/10 flex flex-col gap-2 p-4 outline last:sm:col-span-2"
          >
            <dt>
              <VerdictBadge verdict={verdict} />
            </dt>
            <dd className="text-fg-muted text-sm leading-5">
              {VERDICT_INFO[verdict].description}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  )
}

/** The source text, with the quoted words marked. */
function SourceExcerpt({
  id,
  quote,
  source,
}: {
  id: string
  quote: string
  source: ChatSource
}) {
  const body = source.body.replace(/\*\*/g, '')
  return (
    <div
      id={id}
      className="border-foreground/10 bg-foreground/[0.02] mt-3 rounded-lg border p-4"
    >
      {source.group && <p className="text-fg-muted text-sm">{source.group}</p>}
      <p className="text-foreground text-sm font-semibold">{source.title}</p>
      <p className="text-fg-muted mt-2 text-sm leading-6 [overflow-wrap:anywhere] whitespace-pre-line">
        {highlightQuote(body, quote).map((part, index) =>
          part.match ? (
            <mark
              key={index}
              className="bg-brand/15 text-foreground rounded-[3px] px-0.5"
            >
              {part.text}
            </mark>
          ) : (
            <span key={index}>{part.text}</span>
          ),
        )}
      </p>
      {source.href && (
        <a
          href={source.href}
          target="_blank"
          rel="noreferrer"
          className="text-fg-muted hover:text-brand mt-3 inline-flex items-center gap-1 text-sm transition-colors"
        >
          {new URL(source.href).hostname.replace(/^www\./, '')}
          <ArrowUpRight aria-hidden="true" className="size-3" />
          <span className="sr-only">(opens in a new tab)</span>
        </a>
      )}
    </div>
  )
}

function Quote({
  evidence,
  source,
}: {
  evidence: EvidenceQuote
  source: ChatSource | undefined
}) {
  const [open, setOpen] = useState(false)
  const excerptId = useId()
  return (
    <figure className="border-foreground/15 border-l-2 pl-4">
      <blockquote className="text-fg-secondary text-sm leading-6">
        “{evidence.quote}”
      </blockquote>
      <figcaption className="mt-2">
        <button
          type="button"
          aria-expanded={open}
          aria-controls={excerptId}
          onClick={() => setOpen((value) => !value)}
          className="text-fg-muted hover:text-foreground focus-visible:ring-brand/70 inline-flex max-w-full items-center gap-2 rounded text-left text-sm outline-none focus-visible:ring-2"
        >
          <span className="border-foreground/20 rounded border px-1.5 font-mono tabular-nums">
            {evidence.sourceId}
          </span>
          <span className="truncate">
            {source?.title ?? 'Source'} · {open ? 'Hide source' : 'Show source'}
          </span>
        </button>
        {open && source && (
          <SourceExcerpt
            id={excerptId}
            quote={evidence.quote}
            source={source}
          />
        )}
      </figcaption>
    </figure>
  )
}

function PartStatus({ part }: { part: CheckedPart }) {
  const reduceMotion = useReducedMotion()
  return (
    <AnimatePresence mode="popLayout" initial={false}>
      <motion.span
        key={part.status === 'graded' ? part.grade?.verdict : part.status}
        initial={reduceMotion ? false : { opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={reduceMotion ? undefined : { opacity: 0, scale: 0.8 }}
        transition={reduceMotion ? { duration: 0 } : SPRING}
        className="inline-flex"
      >
        {part.status === 'graded' && part.grade ? (
          <VerdictBadge verdict={part.grade.verdict} />
        ) : part.status === 'checking' ? (
          <span className="border-foreground/15 text-fg-muted inline-flex h-8 items-center gap-2 rounded-full border px-3 text-sm font-semibold">
            <span
              aria-hidden="true"
              className="bg-foreground/40 size-1.5 rounded-full motion-safe:animate-pulse"
            />
            Checking
          </span>
        ) : (
          <span className="border-foreground/15 text-fg-muted inline-flex h-8 items-center rounded-full border border-dashed px-3 text-sm font-semibold">
            {part.status === 'stopped' ? 'Stopped' : 'Not graded'}
          </span>
        )}
      </motion.span>
    </AnimatePresence>
  )
}

function PartRow({
  index,
  part,
  sources,
}: {
  index: number
  part: CheckedPart
  sources: ReadonlyArray<ChatSource>
}) {
  const reduceMotion = useReducedMotion()
  const grade = part.grade
  return (
    <motion.li
      initial={reduceMotion ? false : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={
        reduceMotion ? { duration: 0 } : { ...SPRING, delay: index * 0.06 }
      }
      aria-busy={part.status === 'checking'}
      className="border-foreground/10 border-b py-6 last:border-b-0"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
        <p className="flex gap-3 text-base leading-7 font-medium">
          <span
            aria-hidden="true"
            className="border-foreground/20 text-fg-muted flex size-7 shrink-0 items-center justify-center rounded-full border text-sm tabular-nums"
          >
            {index + 1}
          </span>
          <span>
            <span className="sr-only">Part {index + 1}: </span>
            {part.text}
          </span>
        </p>
        <div className="pl-10 sm:pl-0">
          <PartStatus part={part} />
        </div>
      </div>

      {part.status === 'failed' && (
        <p className="text-fg-muted mt-3 pl-10 text-sm">{part.error}</p>
      )}

      {grade && (
        <div className="mt-3 space-y-4 pl-10">
          {grade.reason && (
            <p className="text-fg-secondary text-sm leading-6">
              {grade.reason}
            </p>
          )}
          {grade.downgraded && (
            <p className="text-fg-muted text-sm leading-6">
              The model quoted words that are not in its source, twice. The
              server removed those quotes and does not show a grade.
            </p>
          )}
          {grade.evidence.length > 0 && (
            <div className="space-y-4">
              {grade.evidence.map((evidence) => (
                <Quote
                  key={`${evidence.sourceId}:${evidence.quote}`}
                  evidence={evidence}
                  source={sources.find(
                    (source) => source.id === evidence.sourceId,
                  )}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </motion.li>
  )
}

function Summary({
  onCopyLink,
  onEdit,
  onRetry,
  state,
}: {
  onCopyLink: () => void
  onEdit: () => void
  onRetry: () => void
  state: CheckState
}) {
  const reduceMotion = useReducedMotion()
  const [copied, setCopied] = useState(false)
  const graded = state.parts.filter((part) => part.status === 'graded').length
  const total = state.parts.length
  const seconds =
    state.startedAt !== undefined && state.endedAt !== undefined
      ? ((state.endedAt - state.startedAt) / 1000).toFixed(1)
      : null

  useEffect(() => {
    if (!copied) return
    const timer = window.setTimeout(() => setCopied(false), 2000)
    return () => window.clearTimeout(timer)
  }, [copied])

  const actionClass = buttonVariants({ variant: 'secondary', size: 'pill' })

  const retry = (
    <button type="button" onClick={onRetry} className={actionClass}>
      <RotateCcw aria-hidden="true" className="size-4" />
      Check again
    </button>
  )
  const edit = (
    <button type="button" onClick={onEdit} className={actionClass}>
      <Pencil aria-hidden="true" className="size-4" />
      Edit claim
    </button>
  )

  if (state.status === 'splitting' || state.status === 'checking') {
    return (
      <div className="flex flex-col gap-3">
        <p className="text-fg-muted text-sm">
          {state.status === 'splitting'
            ? 'Splitting the claim into parts…'
            : `Grading ${plural(total, 'part')}: ${graded} done.`}
        </p>
        <div
          role="progressbar"
          aria-label="Check progress"
          aria-valuemin={0}
          aria-valuemax={Math.max(total, 1)}
          aria-valuenow={graded}
          className="bg-foreground/10 h-1 overflow-hidden rounded-full"
        >
          <motion.div
            className="bg-foreground/60 h-full origin-left rounded-full"
            initial={false}
            animate={{
              scaleX:
                state.status === 'splitting'
                  ? 0.06
                  : (graded + 0.3) / Math.max(total, 1),
            }}
            transition={reduceMotion ? { duration: 0 } : SPRING}
          />
        </div>
        <p className="text-fg-muted text-sm">
          Press <kbd className="font-mono">Esc</kbd> to stop.
        </p>
      </div>
    )
  }

  if (state.status === 'failed') {
    return (
      <div className="flex flex-col items-start gap-4">
        <p role="alert" className="text-contradicted text-sm font-medium">
          {state.error}
        </p>
        <div className="flex flex-wrap gap-2">
          {retry}
          {edit}
        </div>
      </div>
    )
  }

  if (state.status === 'stopped') {
    return (
      <div className="flex flex-col items-start gap-4">
        <p className="text-fg-secondary text-sm">
          {total === 0
            ? 'Stopped before the claim was split. '
            : `Stopped. ${graded} of ${plural(total, 'part')} graded. `}
          A stopped check has no overall grade.
        </p>
        <div className="flex flex-wrap gap-2">
          {retry}
          {edit}
        </div>
      </div>
    )
  }

  if (state.status !== 'complete' || !state.verdict) return null
  const style = VERDICT_STYLE[state.verdict]
  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={reduceMotion ? { duration: 0 } : SPRING}
      className={cn('bg-background rounded-2xl border p-5 sm:p-6', style.ring)}
    >
      <h3 className="text-fg-muted text-sm font-medium">Overall grade</h3>
      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
        <VerdictBadge size="lg" verdict={state.verdict} />
        <p className="text-fg-secondary text-sm">
          {VERDICT_INFO[state.verdict].description}
        </p>
      </div>
      <p className="text-fg-muted mt-4 text-sm tabular-nums">
        {plural(total, 'part')} · {plural(state.sources.length, 'source')}{' '}
        quoted
        {seconds && <> · {seconds} s</>}
      </p>
      <div className="mt-5 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => {
            onCopyLink()
            setCopied(true)
          }}
          className={actionClass}
        >
          {copied ? (
            <Check aria-hidden="true" className="size-4" />
          ) : (
            <Link2 aria-hidden="true" className="size-4" />
          )}
          {copied ? 'Link copied' : 'Copy link'}
        </button>
        {edit}
      </div>
    </motion.div>
  )
}

/** What the screen reader hears when the check changes state. */
function useAnnouncement(state: CheckState) {
  const graded = state.parts.filter((part) => part.status === 'graded')
  switch (state.status) {
    case 'idle':
      return ''
    case 'splitting':
      return 'Checking the claim.'
    case 'checking': {
      const last = graded.at(-1)
      return last?.grade
        ? `Part ${state.parts.indexOf(last) + 1}: ${VERDICT_INFO[last.grade.verdict].label}. ${graded.length} of ${state.parts.length} graded.`
        : `Split into ${plural(state.parts.length, 'part')}. Grading.`
    }
    case 'stopped':
      return 'Check stopped.'
    case 'failed':
      return ''
    case 'complete':
      return state.verdict
        ? `Check complete. Overall grade: ${VERDICT_INFO[state.verdict].label}.`
        : ''
  }
}

export default function ClaimChecker({
  initialClaim,
  onClaimChange,
}: {
  initialClaim?: string
  onClaimChange: (claim: string | undefined) => void
}) {
  const { state, check, stop } = useClaimCheck()
  const [draft, setDraft] = useState('')
  const composerRef = useRef<HTMLTextAreaElement>(null)
  // Only the claim in the URL at load starts a check. Later URL changes
  // come from this page.
  const [claimAtLoad] = useState(initialClaim)
  const startedFromUrl = useRef(false)
  const busy = isChecking(state)
  const panelActive = usePanelActive()
  const announcement = useAnnouncement(state)

  const submit = useCallback(
    (claim: string) => {
      const text = claim.trim().slice(0, MAX_CLAIM_LENGTH)
      if (text.length < 3) return
      void check(text)
      setDraft('')
      onClaimChange(text)
    },
    [check, onClaimChange],
  )

  // A shared link checks its claim once, on load.
  useEffect(() => {
    if (startedFromUrl.current || !claimAtLoad?.trim()) return
    startedFromUrl.current = true
    void check(claimAtLoad.trim().slice(0, MAX_CLAIM_LENGTH))
  }, [claimAtLoad, check])

  // Esc stops the check, anywhere on the page.
  useEffect(() => {
    if (!busy || !panelActive) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' || event.defaultPrevented) return
      event.preventDefault()
      stop()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [busy, stop, panelActive])

  const edit = () => {
    setDraft(state.claim)
    requestAnimationFrame(() => {
      const field = composerRef.current
      if (!field) return
      field.focus()
      field.setSelectionRange(field.value.length, field.value.length)
    })
  }

  const copyLink = () => {
    const url = new URL('/check', window.location.origin)
    url.searchParams.set('claim', state.claim)
    void navigator.clipboard?.writeText(url.toString())
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-4 pt-8 pb-16 sm:px-6 lg:pt-12">
      <p role="status" aria-live="polite" className="sr-only">
        {announcement}
      </p>

      <PageHeading className="lg:text-center">
        Check a claim about Ali.
      </PageHeading>
      <p className="text-fg-muted mt-5 max-w-xl text-base leading-7 lg:mx-auto lg:text-center">
        Paste a claim from a résumé, a profile or a recruiter note. The checker
        grades each part of it against Ali&apos;s public record and shows the
        exact words that each grade rests on.
      </p>

      <ChatComposer
        id={COMPOSER_ID}
        className="mt-8"
        textareaRef={composerRef}
        labels={labels}
        maxLength={MAX_CLAIM_LENGTH}
        value={draft}
        isStreaming={busy}
        onChange={setDraft}
        onStop={stop}
        onSubmit={() => submit(draft)}
        showHints
      />

      {state.status !== 'idle' && (
        <section aria-labelledby="check-result-heading" className="mt-12">
          <h2 id="check-result-heading" className="sr-only">
            Result
          </h2>
          <p className="text-fg-muted text-sm font-medium">Claim</p>
          <p className="font-display mt-2 text-xl leading-8 font-medium sm:text-2xl sm:leading-9">
            “{state.claim}”
          </p>
          <div className="mt-6">
            <Summary
              state={state}
              onRetry={() => void check(state.claim)}
              onEdit={edit}
              onCopyLink={copyLink}
            />
          </div>
          {state.parts.length > 0 && (
            <ol aria-label="Parts of the claim" className="mt-6">
              {state.parts.map((part, index) => (
                <PartRow
                  key={part.id}
                  index={index}
                  part={part}
                  sources={state.sources}
                />
              ))}
            </ol>
          )}
        </section>
      )}

      <div className="mt-12 space-y-12">
        {!busy && <ExampleClaims onSelect={submit} disabled={busy} />}
        <VerdictLegend />
      </div>
    </div>
  )
}
