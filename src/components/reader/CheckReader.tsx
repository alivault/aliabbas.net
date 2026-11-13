import { useCallback, useEffect, useId, useRef, useState } from 'react'
import { useNavigate, useSearch } from '@tanstack/react-router'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import SmartLink from '~/components/chat/SmartLink'
import { useCheckSession } from '~/components/check/CheckSessionProvider'
import VerdictBadge, { VERDICT_STYLE } from '~/components/check/VerdictBadge'
import type { ChatSource } from '~/lib/chat/protocol'
import { sitePath } from '~/lib/chat/site-link'
import { isChecking } from '~/lib/check/check-machine'
import type { CheckState, CheckedPart } from '~/lib/check/check-machine'
import { highlightQuote } from '~/lib/check/evidence'
import type { EvidenceQuote } from '~/lib/check/evidence'
import { MAX_CLAIM_LENGTH } from '~/lib/check/protocol'
import { VERDICTS, VERDICT_INFO } from '~/lib/check/verdicts'
import { DURATIONS, EASE_OUT, SPRINGS } from '~/lib/design/motion'
import { cn } from '~/lib/utils'
import {
  Line,
  Reader,
  ReaderLink,
  ReaderLinks,
  ReaderList,
  ReaderSection,
  ReaderText,
  ReaderTitle,
  hudText,
} from './Reader'
import ReaderComposer from './ReaderComposer'
import type { ComposerLabels } from './ReaderComposer'

const LABELS: ComposerLabels = {
  field: 'A claim about Ali to check',
  placeholder: 'Paste a claim',
  busyPlaceholder: 'Type to check another claim',
  submit: 'Check the claim',
  stop: 'Stop the check',
  stopAndSubmit: 'Stop the check and check this claim',
  submitHint: 'check',
}

const EXAMPLES = [
  'Ali has shipped WebRTC in production.',
  'Ali led the design of TronChat and has worked at Super Studios since 2021.',
  'Ali built Pico in Rust.',
  'Ali has a computer science degree.',
  'Ali has five years of Kubernetes experience.',
] as const

/** A small action, in the HUD face. */
const actionStyle = cn(hudText, 'hud-fill uppercase')

function plural(count: number, word: string) {
  return `${count} ${word}${count === 1 ? '' : 's'}`
}

/** What the screen reader hears when the check changes state. */
function announcementFor(state: CheckState) {
  const graded = state.parts.filter((part) => part.status === 'graded')
  switch (state.status) {
    case 'idle':
    case 'failed':
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
    case 'complete':
      return state.verdict
        ? `Check complete. Overall grade: ${VERDICT_INFO[state.verdict].label}.`
        : ''
  }
}

/**
 * The claim checker as a reader, beside the orb of the chat. It splits a
 * claim into parts and grades each part against Ali's public record, with
 * the quotes that each grade rests on. The claim is in the URL, so a
 * result can be shared, and a link with a claim checks it at once.
 */
export default function CheckReader() {
  const { state, check, stop, draft, setDraft } = useCheckSession()
  const search: { claim?: string } = useSearch({ strict: false })
  const navigate = useNavigate()
  const field = useRef<HTMLTextAreaElement>(null)
  const busy = isChecking(state)

  const showClaim = useCallback(
    (claim: string | undefined) =>
      void navigate({
        to: '/check',
        search: claim ? { claim } : {},
        replace: true,
        resetScroll: false,
      }),
    [navigate],
  )

  const submit = (claim: string) => {
    const text = claim.trim().slice(0, MAX_CLAIM_LENGTH)
    if (text.length < 3) return
    void check(text)
    setDraft('')
    showClaim(text)
  }

  // A link with a claim checks it once, when the page opens. A return to
  // the claim that is already here (from the chat) keeps its result.
  const [claimAtOpen] = useState(search.claim?.trim())
  const started = useRef(false)
  useEffect(() => {
    if (started.current || !claimAtOpen) return
    started.current = true
    if (claimAtOpen !== state.claim) {
      void check(claimAtOpen.slice(0, MAX_CLAIM_LENGTH))
    }
  }, [claimAtOpen, state.claim, check])

  // A return without a claim in the URL shows the claim of the last check.
  useEffect(() => {
    if (!claimAtOpen && state.claim) showClaim(state.claim)
    // Only when the page opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Esc stops the check. It runs before the Esc of the world, which skips
  // a handled key, so the page stays open.
  useEffect(() => {
    if (!busy) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' || event.defaultPrevented) return
      event.preventDefault()
      stop()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [busy, stop])

  const edit = () => {
    setDraft(state.claim)
    requestAnimationFrame(() => {
      const element = field.current
      if (!element) return
      element.focus()
      element.setSelectionRange(element.value.length, element.value.length)
    })
  }

  const copyLink = () => {
    const url = new URL('/check', window.location.origin)
    url.searchParams.set('claim', state.claim)
    void navigator.clipboard?.writeText(url.toString())
  }

  return (
    <Reader>
      <ReaderTitle>Check a claim</ReaderTitle>
      <ReaderText>
        Paste a claim from a résumé, a profile or a recruiter note. The checker
        grades each part of it against Ali’s public record and shows the exact
        words that each grade rests on.
      </ReaderText>
      <ReaderLinks>
        <ReaderLink to="/ai">Ask a question instead</ReaderLink>
      </ReaderLinks>

      <p role="status" aria-live="polite" className="sr-only">
        {announcementFor(state)}
      </p>

      <Line className="mt-12">
        <ReaderComposer
          id="claim-input"
          fieldRef={field}
          labels={LABELS}
          maxLength={MAX_CLAIM_LENGTH}
          value={draft}
          busy={busy}
          showHints
          onChange={setDraft}
          onSubmit={() => submit(draft)}
          onStop={stop}
        />
      </Line>

      {state.status !== 'idle' ? (
        <motion.section
          aria-labelledby="check-result-heading"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: DURATIONS.enter, ease: EASE_OUT }}
          className="mt-14 max-w-[60ch]"
        >
          <h2 id="check-result-heading" className="sr-only">
            Result
          </h2>
          <p className={cn(hudText, 'text-hud/70 text-xs')}>Claim</p>
          <p className="text-foreground mt-2 text-xl leading-8 text-pretty">
            “{state.claim}”
          </p>
          <div className="mt-6">
            <Summary
              state={state}
              onRetry={() => void check(state.claim)}
              onEdit={edit}
              onCopyLink={copyLink}
              onStop={stop}
            />
          </div>
          {state.parts.length > 0 ? (
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
          ) : null}
        </motion.section>
      ) : null}

      {!busy ? (
        <div className="mt-14">
          <p className={cn(hudText, 'text-hud/70 text-xs')}>Try a claim</p>
          <ReaderList
            items={EXAMPLES.map((claim) => (
              <button
                key={claim}
                type="button"
                data-sound="send"
                onClick={() => submit(claim)}
                className="hud-fill decoration-hud/50 text-left uppercase underline underline-offset-[10px]"
              >
                {claim}
              </button>
            ))}
            className="mt-4 flex flex-col gap-3"
          />
        </div>
      ) : null}

      <ReaderSection title="How the grades work">
        <ReaderText>
          The checker splits a claim into parts and grades each part against the
          same sources as the chat. A grade that says the record supports or
          contradicts a part must quote the record. The server checks each quote
          word for word. If a quote is not in its source, the part becomes
          Unknown.
        </ReaderText>
        <Line className="mt-8">
          <dl className="flex max-w-[60ch] flex-col gap-5">
            {VERDICTS.map((verdict) => (
              <div
                key={verdict}
                className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-5"
              >
                <dt className="sm:w-44 sm:shrink-0">
                  <VerdictBadge verdict={verdict} />
                </dt>
                <dd className="text-fg-secondary text-sm leading-6">
                  {VERDICT_INFO[verdict].description}
                </dd>
              </div>
            ))}
          </dl>
        </Line>
      </ReaderSection>
    </Reader>
  )
}

function Summary({
  onCopyLink,
  onEdit,
  onRetry,
  onStop,
  state,
}: {
  onCopyLink: () => void
  onEdit: () => void
  onRetry: () => void
  onStop: () => void
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

  const again = (
    <button
      type="button"
      data-sound="send"
      onClick={onRetry}
      className={actionStyle}
    >
      Check again
    </button>
  )
  const edit = (
    <button type="button" onClick={onEdit} className={actionStyle}>
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
          className="bg-hud/15 h-px overflow-hidden"
        >
          <motion.div
            className="bg-hud h-full origin-left"
            initial={false}
            animate={{
              scaleX:
                state.status === 'splitting'
                  ? 0.06
                  : (graded + 0.3) / Math.max(total, 1),
            }}
            transition={reduceMotion ? { duration: 0 } : SPRINGS.settle}
          />
        </div>
        <button
          type="button"
          data-sound="none"
          onClick={onStop}
          className={cn(actionStyle, 'self-start')}
        >
          Stop
        </button>
      </div>
    )
  }

  if (state.status === 'failed') {
    return (
      <div className="flex flex-col items-start gap-4">
        <p role="alert" className="text-contradicted text-sm font-medium">
          {state.error}
        </p>
        <div className="flex flex-wrap gap-x-10 gap-y-2">
          {again}
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
        <div className="flex flex-wrap gap-x-10 gap-y-2">
          {again}
          {edit}
        </div>
      </div>
    )
  }

  if (state.status !== 'complete' || !state.verdict) return null
  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: DURATIONS.enter, ease: EASE_OUT }}
      className={cn('border p-5 sm:p-6', VERDICT_STYLE[state.verdict].ring)}
    >
      <h3 className={cn(hudText, 'text-hud/70 text-xs')}>Overall grade</h3>
      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
        <VerdictBadge size="lg" verdict={state.verdict} />
        <p className="text-fg-secondary text-sm">
          {VERDICT_INFO[state.verdict].description}
        </p>
      </div>
      <p className="text-fg-muted mt-4 text-sm tabular-nums">
        {plural(total, 'part')} · {plural(state.sources.length, 'source')}{' '}
        quoted
        {seconds ? <> · {seconds} s</> : null}
      </p>
      <div className="mt-5 flex flex-wrap gap-x-10 gap-y-2">
        <button
          type="button"
          onClick={() => {
            onCopyLink()
            setCopied(true)
          }}
          className={actionStyle}
        >
          <span aria-live="polite">{copied ? 'Link copied' : 'Copy link'}</span>
        </button>
        {edit}
      </div>
    </motion.div>
  )
}

function PartStatus({ part }: { part: CheckedPart }) {
  const reduceMotion = useReducedMotion()
  return (
    <AnimatePresence mode="popLayout" initial={false}>
      <motion.span
        key={part.status === 'graded' ? part.grade?.verdict : part.status}
        initial={reduceMotion ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={reduceMotion ? undefined : { opacity: 0 }}
        transition={{ duration: DURATIONS.enter, ease: EASE_OUT }}
        className="inline-flex"
      >
        {part.status === 'graded' && part.grade ? (
          <VerdictBadge verdict={part.grade.verdict} />
        ) : part.status === 'checking' ? (
          <span className={cn(hudText, 'text-xs motion-safe:animate-pulse')}>
            Checking
          </span>
        ) : (
          <span className={cn(hudText, 'text-hud/60 text-xs')}>
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
  const grade = part.grade
  return (
    <motion.li
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{
        duration: DURATIONS.enter,
        ease: EASE_OUT,
        delay: index * 0.06,
      }}
      aria-busy={part.status === 'checking'}
      className="border-hud/15 border-b py-6 last:border-b-0"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
        <p className="text-foreground flex gap-4 text-base leading-7">
          <span
            aria-hidden="true"
            className={cn(hudText, 'text-hud/70 w-5 shrink-0 tabular-nums')}
          >
            {index + 1}
          </span>
          <span>
            <span className="sr-only">Part {index + 1}: </span>
            {part.text}
          </span>
        </p>
        <div className="pl-9 sm:pl-0">
          <PartStatus part={part} />
        </div>
      </div>

      {part.status === 'failed' ? (
        <p className="text-fg-muted mt-3 pl-9 text-sm">{part.error}</p>
      ) : null}

      {grade ? (
        <div className="mt-3 space-y-4 pl-9">
          {grade.reason ? (
            <p className="text-fg-secondary text-sm leading-6">
              {grade.reason}
            </p>
          ) : null}
          {grade.downgraded ? (
            <p className="text-fg-muted text-sm leading-6">
              The model quoted words that are not in its source, twice. The
              server removed those quotes and does not show a grade.
            </p>
          ) : null}
          {grade.evidence.map((evidence) => (
            <Quote
              key={`${evidence.sourceId}:${evidence.quote}`}
              evidence={evidence}
              source={sources.find((source) => source.id === evidence.sourceId)}
            />
          ))}
        </div>
      ) : null}
    </motion.li>
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
    <figure className="border-hud/40 border-l pl-4">
      <blockquote className="text-fg-secondary text-sm leading-6">
        “{evidence.quote}”
      </blockquote>
      <figcaption className="mt-2">
        <button
          type="button"
          aria-expanded={open}
          aria-controls={excerptId}
          onClick={() => setOpen((value) => !value)}
          className="text-fg-muted hover:text-foreground focus-visible:ring-hud/70 inline-flex max-w-full items-center gap-2 text-left text-sm outline-none focus-visible:ring-1"
        >
          <span className="border-hud/30 border px-1.5 font-mono tabular-nums">
            {evidence.sourceId}
          </span>
          <span className="truncate">
            {source?.title ?? 'Source'} · {open ? 'Hide source' : 'Show source'}
          </span>
        </button>
        {open && source ? (
          <SourceExcerpt
            id={excerptId}
            quote={evidence.quote}
            source={source}
          />
        ) : null}
      </figcaption>
    </figure>
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
    <div id={id} className="border-hud/20 bg-background/40 mt-3 border p-4">
      {source.group ? (
        <p className="text-fg-muted text-sm">{source.group}</p>
      ) : null}
      <p className="text-foreground text-sm font-semibold">{source.title}</p>
      <p className="text-fg-muted mt-2 text-sm leading-6 [overflow-wrap:anywhere] whitespace-pre-line">
        {highlightQuote(body, quote).map((part, index) =>
          part.match ? (
            <mark key={index} className="bg-hud/20 text-foreground px-0.5">
              {part.text}
            </mark>
          ) : (
            <span key={index}>{part.text}</span>
          ),
        )}
      </p>
      {source.href ? (
        <SmartLink
          href={source.href}
          className="text-fg-muted hover:text-hud mt-3 inline-flex text-sm transition-colors"
        >
          {sitePath(source.href) ??
            new URL(source.href).hostname.replace(/^www\./, '')}
        </SmartLink>
      ) : null}
    </div>
  )
}
