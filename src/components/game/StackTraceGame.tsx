import { useCallback, useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { Link } from '@tanstack/react-router'
import '@fontsource/chakra-petch/latin-500.css'
import '@fontsource/chakra-petch/latin-600.css'
import '@fontsource/chakra-petch/latin-700.css'
import '@fontsource/chakra-petch/latin-700-italic.css'
import { Bug, Check, Layers, Map as MapIcon, Navigation, X } from 'lucide-react'
import SiteHeader from '~/components/SiteHeader'
import StackTraceScene from './StackTraceScene'
import StackTraceTouchControls from './StackTraceTouchControls'
import { initialHudState } from './stack-trace-types'
import type {
  GameInputMode,
  GameHudState,
  GameResult,
  StackTraceGameApi,
} from './stack-trace-types'

type ScreenState =
  | { status: 'briefing' }
  | { status: 'playing' }
  | { status: 'result'; result: GameResult }

const LIME = '#d9ff43'
const RED = '#ff694a'

/* ---------- Shared pieces ---------- */

function KeyCap({
  children,
  tone = 'light',
}: {
  children: ReactNode
  tone?: 'light' | 'dark'
}) {
  return (
    <kbd
      className={`st-display inline-flex h-8 min-w-8 items-center justify-center rounded-md px-2 text-sm font-bold uppercase ${
        tone === 'dark'
          ? 'bg-black/15 text-current'
          : 'border-b-2 border-white/25 bg-white/12 text-white'
      }`}
    >
      {children}
    </kbd>
  )
}

function MenuButton({
  children,
  hint,
  variant = 'primary',
  disabled,
  onClick,
}: {
  children: ReactNode
  hint?: string
  variant?: 'primary' | 'secondary'
  disabled?: boolean
  onClick?: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`st-cut st-display flex w-full items-center justify-between gap-4 px-6 font-bold tracking-wide uppercase ${
        variant === 'primary' ? 'st-btn-primary' : 'st-btn-secondary'
      } h-16 text-2xl`}
    >
      {children}
      {hint && (
        <KeyCap tone={variant === 'primary' ? 'dark' : 'light'}>{hint}</KeyCap>
      )}
    </button>
  )
}

function MenuLink({ children }: { children: ReactNode }) {
  return (
    <Link
      to="/"
      className="st-cut st-display st-btn-secondary flex h-16 w-full items-center justify-start px-6 text-2xl font-bold tracking-wide uppercase"
    >
      {children}
    </Link>
  )
}

function Overlay({
  children,
  tint = 'rgba(5,6,8,.78)',
  z = 'z-40',
}: {
  children: ReactNode
  tint?: string
  z?: string
}) {
  return (
    <div
      className={`pointer-events-auto absolute inset-0 ${z} grid place-items-center overflow-y-auto p-5 text-[#f1efe8] backdrop-blur-md`}
      style={{ background: tint }}
    >
      {children}
    </div>
  )
}

/* ---------- Controls ---------- */

type ControlRow = { keys: Array<string>; action: string }

const pointerControls: Array<ControlRow> = [
  { keys: ['W', 'A', 'S', 'D'], action: 'Fly' },
  { keys: ['Space', 'C'], action: 'Rise / descend' },
  { keys: ['Q', 'E'], action: 'Roll' },
  { keys: ['Mouse'], action: 'Aim and fire' },
  { keys: ['M'], action: 'Map' },
  { keys: ['Esc'], action: 'Pause' },
  { keys: ['?'], action: 'Controls' },
]

const touchControls: Array<ControlRow> = [
  { keys: ['Left stick'], action: 'Fly' },
  { keys: ['Drag'], action: 'Aim' },
  { keys: ['Tap'], action: 'Fire' },
  { keys: ['▲', '▼'], action: 'Rise / descend' },
]

function ControlsPanel({
  inputMode,
  sensitivity,
  onSensitivityChange,
  onBack,
  onResume,
}: {
  inputMode: GameInputMode
  sensitivity?: number
  onSensitivityChange?: (sensitivity: number) => void
  onBack: () => void
  onResume?: () => void
}) {
  const rows = inputMode === 'touch' ? touchControls : pointerControls
  return (
    <Overlay z="z-50">
      <div className="st-panel w-full max-w-2xl p-6 sm:p-8">
        <div className="flex items-center justify-between gap-6">
          <h2 className="st-display text-4xl font-bold uppercase italic sm:text-5xl">
            Controls
          </h2>
          <button
            type="button"
            onClick={onBack}
            className="st-cut-sm st-btn-secondary flex size-12 shrink-0 items-center justify-center"
            aria-label="Back"
          >
            <X className="size-5" />
          </button>
        </div>

        <div className="mt-6 grid gap-2 sm:grid-cols-2">
          {rows.map(({ keys, action }) => (
            <div
              key={action}
              className="flex min-h-14 items-center justify-between gap-4 bg-white/[.04] px-4 py-2"
            >
              <span className="text-base text-white/75">{action}</span>
              <span className="flex flex-wrap justify-end gap-1">
                {keys.map((key) => (
                  <KeyCap key={key}>{key}</KeyCap>
                ))}
              </span>
            </div>
          ))}
        </div>

        {sensitivity !== undefined && onSensitivityChange && (
          <label className="mt-4 flex items-center gap-4 bg-white/[.04] px-4 py-3 text-base text-white/75">
            Look speed
            <input
              type="range"
              min="0.65"
              max="1.5"
              step="0.05"
              value={sensitivity}
              onChange={(event) =>
                onSensitivityChange(Number(event.currentTarget.value))
              }
              className="h-2 min-w-20 flex-1 accent-[#d9ff43]"
            />
            <span className="st-display w-12 text-right font-bold text-[#d9ff43]">
              {sensitivity.toFixed(1)}×
            </span>
          </label>
        )}

        <div className="mt-6">
          {onResume ? (
            <MenuButton
              onClick={onResume}
              hint={inputMode === 'pointer' ? 'Enter' : undefined}
            >
              Resume
            </MenuButton>
          ) : (
            <MenuButton onClick={onBack} variant="secondary">
              Back
            </MenuButton>
          )}
        </div>
      </div>
    </Overlay>
  )
}

/* ---------- Title screen ---------- */

const missionSteps = [
  'Trace the corrupted frames',
  'Destroy the root bug',
  'Escape before rollback',
]

function MissionBriefing({
  ready,
  renderingFailed,
  inputMode,
  isPortrait,
  onOpenControls,
  onLaunch,
}: {
  ready: boolean
  renderingFailed: boolean
  inputMode: GameInputMode
  isPortrait: boolean
  onOpenControls: () => void
  onLaunch: () => void
}) {
  const isTouchLandscape = inputMode === 'touch' && !isPortrait
  const canLaunch = ready && !renderingFailed

  return (
    <div className="pointer-events-auto relative z-30 flex h-svh min-h-[320px] flex-col overflow-y-auto bg-[radial-gradient(ellipse_at_center,rgba(5,6,8,.55)_0%,rgba(5,6,8,.9)_75%)] p-5 pt-[72px] text-[#f1efe8] sm:p-8 sm:pt-[72px]">
      <div
        className={`mx-auto my-auto w-full ${
          isTouchLandscape
            ? 'grid max-w-4xl grid-cols-[1.1fr_1fr] items-center gap-10 py-4'
            : 'max-w-xl py-8'
        }`}
      >
        <div className={isTouchLandscape ? '' : 'text-center'}>
          <h1
            className={`st-display st-logo leading-[.85] font-bold uppercase italic ${
              isTouchLandscape ? 'text-6xl' : 'text-7xl sm:text-8xl'
            }`}
          >
            Stack
            <span className="block text-[#d9ff43]">Trace</span>
          </h1>

          <ol
            className={`mt-8 space-y-2 ${isTouchLandscape ? '' : 'mx-auto w-fit text-left'}`}
          >
            {missionSteps.map((step, index) => (
              <li key={step} className="flex items-center gap-3 text-lg">
                <span className="st-cut-sm st-display flex size-8 shrink-0 items-center justify-center bg-[#d9ff43]/15 text-base font-bold text-[#d9ff43]">
                  {index + 1}
                </span>
                <span className="text-white/80">{step}</span>
              </li>
            ))}
          </ol>
        </div>

        <div
          className={`flex flex-col gap-3 ${isTouchLandscape ? '' : 'mt-10'}`}
        >
          <MenuButton
            onClick={onLaunch}
            disabled={!canLaunch}
            hint={inputMode === 'pointer' && canLaunch ? 'Enter' : undefined}
          >
            {renderingFailed
              ? 'WebGL unavailable'
              : ready
                ? 'Play'
                : 'Loading…'}
          </MenuButton>
          <MenuButton onClick={onOpenControls} variant="secondary">
            Controls
          </MenuButton>
        </div>
      </div>
    </div>
  )
}

/* ---------- In-game HUD ---------- */

function IntegrityBar({
  integrity,
  compact,
}: {
  integrity: number
  compact: boolean
}) {
  const color = integrity <= 30 ? RED : LIME
  const segments = 20
  const filled = Math.ceil((integrity / 100) * segments)
  return (
    <div className={`st-panel px-4 py-3 ${compact ? 'w-44' : 'w-56 sm:w-72'}`}>
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-sm font-semibold text-white/60 uppercase">
          Integrity
        </span>
        <span
          className={`st-display font-bold tabular-nums ${compact ? 'text-xl' : 'text-3xl'} ${integrity <= 30 ? 'st-pulse' : ''}`}
          style={{ color }}
        >
          {integrity}
          <span className="text-base">%</span>
        </span>
      </div>
      <div
        className={`mt-2 grid gap-[3px] ${compact ? 'h-2.5' : 'h-3.5'}`}
        style={{ gridTemplateColumns: `repeat(${segments}, 1fr)` }}
      >
        {Array.from({ length: segments }, (_, index) => (
          <span
            key={index}
            className="-skew-x-12 transition-colors duration-150"
            style={{
              backgroundColor: index < filled ? color : 'rgba(255,255,255,.1)',
              boxShadow: index < filled ? `0 0 8px ${color}66` : undefined,
            }}
          />
        ))}
      </div>
    </div>
  )
}

function ObjectiveBanner({
  hud,
  compact,
}: {
  hud: GameHudState
  compact: boolean
}) {
  const escaping = hud.phase === 'escape'
  const critical = escaping && hud.escapeTime <= 10
  return (
    <div
      className={`st-panel flex items-center gap-4 px-4 py-3 ${escaping ? 'stack-trace-escape-alert' : ''}`}
      data-tone={escaping ? 'danger' : undefined}
      data-critical={critical ? 'true' : 'false'}
    >
      <div className="min-w-0 flex-1">
        <p
          className={`text-sm font-semibold uppercase ${escaping ? 'text-[#ff694a]' : 'text-[#d9ff43]'}`}
        >
          {escaping ? 'Rollback incoming' : 'Objective'}
        </p>
        <p
          className={`st-display mt-0.5 leading-tight font-bold ${compact ? 'text-base' : 'text-xl'}`}
        >
          {hud.objective}
        </p>
        <p className="mt-1 flex items-center gap-1.5 text-sm text-white/60">
          <Navigation className="size-3.5 rotate-45" />
          <span className="tabular-nums">
            {Math.round(hud.targetDistance)} m
          </span>
        </p>
      </div>
      {escaping && (
        <span
          className={`st-display font-bold text-[#ff694a] tabular-nums ${compact ? 'text-4xl' : 'text-6xl'}`}
        >
          {Math.ceil(hud.escapeTime)}
        </span>
      )}
    </div>
  )
}

function StatBadge({
  icon,
  label,
  value,
}: {
  icon: ReactNode
  label: string
  value: string
}) {
  return (
    <div className="st-panel flex items-center gap-3 px-4 py-3">
      <span className="text-[#d9ff43]">{icon}</span>
      <div>
        <p className="text-sm font-semibold text-white/60 uppercase">{label}</p>
        <p className="st-display text-3xl leading-none font-bold tabular-nums">
          {value}
        </p>
      </div>
    </div>
  )
}

function FrameTracker({ frames }: { frames: GameHudState['frames'] }) {
  return (
    <div className="st-panel w-72 px-4 py-4">
      <p className="text-sm font-semibold text-white/60 uppercase">
        Stack frames
      </p>
      <ul className="mt-3 space-y-2">
        {frames.map((frame) => (
          <li key={frame.number} className="flex items-center gap-3">
            <span
              className={`st-cut-sm flex size-7 shrink-0 items-center justify-center ${
                frame.status === 'resolved'
                  ? 'bg-[#d9ff43] text-[#0b0c0a]'
                  : frame.status === 'active'
                    ? 'bg-[#ff694a]/20 text-[#ff694a]'
                    : 'bg-white/8 text-white/35'
              }`}
            >
              {frame.status === 'resolved' ? (
                <Check className="size-4" strokeWidth={3} />
              ) : frame.status === 'active' ? (
                <span className="st-pulse size-2.5 rounded-full bg-[#ff694a]" />
              ) : (
                <span className="st-display text-sm font-bold">
                  {Number(frame.number)}
                </span>
              )}
            </span>
            <span
              className={`st-display text-base font-semibold ${
                frame.status === 'active'
                  ? 'text-white'
                  : frame.status === 'resolved'
                    ? 'text-white/50 line-through decoration-[#d9ff43]/60'
                    : 'text-white/40'
              }`}
            >
              {frame.label}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}

function Crosshair({ hitPulse }: { hitPulse: number }) {
  return (
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
      <div
        key={hitPulse}
        className="stack-trace-crosshair relative size-11"
        data-hit={hitPulse > 0 ? 'true' : 'false'}
      >
        <span className="absolute top-0 left-0 size-2.5 border-t-2 border-l-2 border-white/80" />
        <span className="absolute top-0 right-0 size-2.5 border-t-2 border-r-2 border-white/80" />
        <span className="absolute bottom-0 left-0 size-2.5 border-b-2 border-l-2 border-white/80" />
        <span className="absolute right-0 bottom-0 size-2.5 border-r-2 border-b-2 border-white/80" />
        <span className="absolute top-1/2 left-1/2 size-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#d9ff43] shadow-[0_0_8px_#d9ff43]" />
      </div>
    </div>
  )
}

function MissionHud({
  hud,
  inputMode,
}: {
  hud: GameHudState
  inputMode: GameInputMode
}) {
  const isTouch = inputMode === 'touch'

  return (
    <div className="stack-trace-hud pointer-events-none absolute inset-0 z-20 text-[#f1efe8]">
      {hud.phase === 'escape' && (
        <div
          className="stack-trace-escape-frame absolute inset-2 border-2 border-[#ff694a]/70 sm:inset-3"
          data-critical={hud.escapeTime <= 10 ? 'true' : 'false'}
        />
      )}

      <Crosshair hitPulse={hud.hitPulse} />

      {isTouch ? (
        <div className="absolute top-[max(1rem,env(safe-area-inset-top))] right-[max(1rem,env(safe-area-inset-right))] left-[max(1rem,env(safe-area-inset-left))] flex items-start justify-between gap-3">
          <div className="space-y-2">
            <IntegrityBar integrity={hud.integrity} compact />
            <div className="st-panel st-display w-fit px-3 py-1.5 text-base font-bold">
              <Layers className="mr-2 inline size-4 text-[#d9ff43]" />
              {hud.faultsResolved}/{hud.totalFaults}
            </div>
          </div>
          <div className="w-[min(46vw,18rem)]">
            <ObjectiveBanner hud={hud} compact />
          </div>
        </div>
      ) : (
        <>
          <div className="absolute top-4 right-4 left-4 flex flex-wrap items-start justify-between gap-2 sm:top-6 sm:right-6 sm:left-6 lg:gap-6">
            <IntegrityBar integrity={hud.integrity} compact={false} />
            <div className="order-last w-full lg:absolute lg:left-1/2 lg:w-[min(32rem,36vw)] lg:-translate-x-1/2">
              <ObjectiveBanner hud={hud} compact={false} />
            </div>
            <div className="flex gap-2">
              <StatBadge
                icon={<Layers className="size-6" />}
                label="Frames"
                value={`${hud.faultsResolved}/${hud.totalFaults}`}
              />
              <StatBadge
                icon={<Bug className="size-6" />}
                label="Bugs"
                value={String(hud.bugsPurged)}
              />
            </div>
          </div>

          <div className="absolute right-4 bottom-4 left-4 flex items-end justify-between gap-6 sm:right-6 sm:bottom-6 sm:left-6">
            <div className="hidden md:block">
              <FrameTracker frames={hud.frames} />
            </div>
            <div className="ml-auto hidden items-center gap-5 text-sm font-semibold text-white/70 uppercase sm:flex">
              <span className="flex items-center gap-2">
                <KeyCap>M</KeyCap> Map
              </span>
              <span className="flex items-center gap-2">
                <KeyCap>?</KeyCap> Controls
              </span>
              <span className="flex items-center gap-2">
                <KeyCap>Esc</KeyCap> Pause
              </span>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

/* ---------- Pause, map, result ---------- */

function PauseScreen({
  inputMode,
  onResume,
  onOpenControls,
}: {
  inputMode: GameInputMode
  onResume: () => void
  onOpenControls: () => void
}) {
  return (
    <Overlay>
      <div className="w-full max-w-sm text-center">
        <h2 className="st-display st-logo text-7xl font-bold uppercase italic">
          Paused
        </h2>
        <div className="mt-10 flex flex-col gap-3">
          <MenuButton
            onClick={onResume}
            hint={inputMode === 'pointer' ? 'Enter' : undefined}
          >
            Resume
          </MenuButton>
          <MenuButton onClick={onOpenControls} variant="secondary">
            Controls
          </MenuButton>
          <MenuLink>Quit</MenuLink>
        </div>
      </div>
    </Overlay>
  )
}

const mapLegend = [
  [LIME, 'You'],
  [RED, 'Target'],
  ['#f1efe8', 'Visited'],
  ['#335cff', 'Unexplored'],
] as const

function AutomapOverlay({
  inputMode,
  onClose,
}: {
  inputMode: GameInputMode
  onClose: () => void
}) {
  return (
    <div className="pointer-events-none absolute inset-0 z-40 flex flex-col justify-between p-5 text-[#f1efe8] sm:p-8">
      <div className="flex items-start justify-between gap-6">
        <div className="st-panel px-5 py-4">
          <h2 className="st-display flex items-center gap-3 text-3xl font-bold uppercase italic">
            <MapIcon className="size-7 text-[#d9ff43]" />
            Map
          </h2>
          <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-base text-white/75">
            {mapLegend.map(([color, label]) => (
              <span key={label} className="flex items-center gap-2">
                <span
                  className="size-3 rounded-full"
                  style={{
                    backgroundColor: color,
                    boxShadow: `0 0 8px ${color}`,
                  }}
                />
                {label}
              </span>
            ))}
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="st-cut-sm st-btn-secondary pointer-events-auto flex size-12 items-center justify-center backdrop-blur-sm"
          aria-label="Close map"
        >
          <X className="size-5" />
        </button>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4 text-base text-white/75">
        <span>
          {inputMode === 'touch'
            ? 'Drag to rotate'
            : 'Drag to rotate, scroll to zoom'}
        </span>
        {inputMode === 'pointer' && (
          <span className="flex items-center gap-2">
            <KeyCap>M</KeyCap> Close
          </span>
        )}
      </div>
    </div>
  )
}

function rankFor(result: GameResult) {
  if (result.status !== 'won') return { letter: 'F', color: RED }
  if (result.score >= 10000) return { letter: 'S', color: LIME }
  if (result.score >= 8500) return { letter: 'A', color: LIME }
  if (result.score >= 7000) return { letter: 'B', color: '#f1efe8' }
  return { letter: 'C', color: '#f1efe8' }
}

function ResultScreen({
  result,
  inputMode,
  onRestart,
}: {
  result: GameResult
  inputMode: GameInputMode
  onRestart: () => void
}) {
  const didWin = result.status === 'won'
  const accent = didWin ? LIME : RED
  const rank = rankFor(result)
  const stats = [
    ['Integrity', `${result.integrity}%`],
    ['Accuracy', `${Math.round(result.accuracy)}%`],
    ['Bugs', String(result.bugsPurged)],
    ['Frames', `${result.faultsResolved}/3`],
    ['Time', `${Math.round(result.elapsed)}s`],
  ] as const

  return (
    <Overlay tint="rgba(5,6,8,.85)">
      <div className="w-full max-w-3xl py-6">
        <p
          className="st-display text-center text-xl font-bold uppercase"
          style={{ color: accent }}
        >
          {didWin ? 'Mission complete' : 'Mission failed'}
        </p>
        <h2 className="st-display st-logo mt-2 text-center text-6xl leading-none font-bold uppercase italic sm:text-8xl">
          Build{' '}
          <span style={{ color: accent }}>{didWin ? 'shipped' : 'failed'}</span>
        </h2>
        <p className="mt-4 text-center text-lg text-white/70">
          {result.reason}
        </p>

        <div className="mt-8 grid gap-3 sm:grid-cols-[auto_1fr]">
          <div
            className="st-panel flex items-center gap-6 px-6 py-5"
            style={{ ['--st-accent' as string]: accent }}
          >
            <div>
              <p className="text-sm font-semibold text-white/60 uppercase">
                Rank
              </p>
              <p
                className="st-display text-7xl leading-none font-bold italic"
                style={{
                  color: rank.color,
                  textShadow: `0 0 30px ${rank.color}55`,
                }}
              >
                {rank.letter}
              </p>
            </div>
            <div>
              <p className="text-sm font-semibold text-white/60 uppercase">
                Score
              </p>
              <p className="st-display text-5xl leading-none font-bold tabular-nums">
                {result.score.toLocaleString()}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
            {stats.map(([label, value]) => (
              <div
                key={label}
                className="flex flex-col justify-center bg-white/[.05] px-3 py-4 text-center"
              >
                <p className="text-sm font-semibold text-white/60 uppercase">
                  {label}
                </p>
                <p className="st-display mt-1 text-2xl font-bold tabular-nums">
                  {value}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-8 grid gap-3 sm:grid-cols-[1.4fr_1fr]">
          <MenuButton
            onClick={onRestart}
            hint={inputMode === 'pointer' ? 'Enter' : undefined}
          >
            Play again
          </MenuButton>
          <MenuLink>Quit</MenuLink>
        </div>
      </div>
    </Overlay>
  )
}

export default function StackTraceGame() {
  const pageRef = useRef<HTMLElement>(null)
  const apiRef = useRef<StackTraceGameApi>(null)
  const [ready, setReady] = useState(false)
  const [renderingFailed, setRenderingFailed] = useState(false)
  const [paused, setPaused] = useState(false)
  const [mapOpen, setMapOpen] = useState(false)
  const [keybindsOpen, setKeybindsOpen] = useState(false)
  const [briefingControlsOpen, setBriefingControlsOpen] = useState(false)
  const [hud, setHud] = useState(initialHudState)
  const [screen, setScreen] = useState<ScreenState>({ status: 'briefing' })
  const [inputMode, setInputMode] = useState<GameInputMode>('pointer')
  const [isPortrait, setIsPortrait] = useState(false)
  const [sensitivity, setSensitivity] = useState(1)

  useEffect(() => {
    const touchQuery = window.matchMedia('(hover: none), (pointer: coarse)')
    const portraitQuery = window.matchMedia('(orientation: portrait)')
    const updateInputMode = () =>
      setInputMode(touchQuery.matches ? 'touch' : 'pointer')
    const updateOrientation = () => setIsPortrait(portraitQuery.matches)
    updateInputMode()
    updateOrientation()
    touchQuery.addEventListener('change', updateInputMode)
    portraitQuery.addEventListener('change', updateOrientation)
    return () => {
      touchQuery.removeEventListener('change', updateInputMode)
      portraitQuery.removeEventListener('change', updateOrientation)
    }
  }, [])

  const requestMobileFullscreen = useCallback(() => {
    const page = pageRef.current
    if (!page?.requestFullscreen || document.fullscreenElement) return
    void page.requestFullscreen().catch(() => undefined)
  }, [])

  const launch = useCallback(() => {
    if (!ready || !apiRef.current || renderingFailed) return
    if (inputMode === 'touch') requestMobileFullscreen()
    setPaused(false)
    setMapOpen(false)
    setKeybindsOpen(false)
    setBriefingControlsOpen(false)
    setScreen({ status: 'playing' })
    apiRef.current.start(inputMode, { sensitivity })
  }, [inputMode, ready, renderingFailed, requestMobileFullscreen, sensitivity])

  useEffect(() => {
    if (screen.status !== 'briefing' && screen.status !== 'result') return
    const handleKeyDown = (event: KeyboardEvent) => {
      if (briefingControlsOpen && event.code === 'Escape') {
        event.preventDefault()
        setBriefingControlsOpen(false)
        return
      }
      if (event.code !== 'Enter' || event.repeat) return
      event.preventDefault()
      event.stopImmediatePropagation()
      launch()
    }
    window.addEventListener('keydown', handleKeyDown, true)
    return () => window.removeEventListener('keydown', handleKeyDown, true)
  }, [briefingControlsOpen, launch, screen.status])

  const resume = useCallback(() => {
    setPaused(false)
    apiRef.current?.resume()
  }, [])

  const closeKeybinds = useCallback(() => {
    setKeybindsOpen(false)
    resume()
  }, [resume])

  useEffect(() => {
    if (screen.status !== 'playing' || inputMode !== 'pointer') return
    const handleKeyDown = (event: KeyboardEvent) => {
      const togglesKeybinds = event.key === '?' && !event.repeat
      const closesKeybinds = keybindsOpen && event.code === 'Escape'
      const resumesGame = paused && event.code === 'Enter'
      if ((!togglesKeybinds && !closesKeybinds && !resumesGame) || mapOpen) {
        return
      }

      event.preventDefault()
      event.stopImmediatePropagation()
      if (closesKeybinds) {
        setKeybindsOpen(false)
      } else if (keybindsOpen) {
        closeKeybinds()
      } else if (resumesGame) {
        resume()
      } else {
        setKeybindsOpen(true)
        apiRef.current?.pause()
      }
    }
    window.addEventListener('keydown', handleKeyDown, true)
    return () => window.removeEventListener('keydown', handleKeyDown, true)
  }, [
    closeKeybinds,
    inputMode,
    keybindsOpen,
    mapOpen,
    paused,
    resume,
    screen.status,
  ])

  return (
    <main
      ref={pageRef}
      className="stack-trace-page site-noise relative h-svh min-h-[320px] overflow-hidden bg-[#050608] text-[#f1efe8]"
    >
      <div className="absolute inset-0">
        <StackTraceScene
          apiRef={apiRef}
          onReady={() => {
            setReady(true)
            setRenderingFailed(false)
          }}
          onError={() => setRenderingFailed(true)}
          onHudChange={setHud}
          onPauseChange={setPaused}
          onMapChange={setMapOpen}
          onEnd={(result) => {
            setPaused(false)
            setMapOpen(false)
            setKeybindsOpen(false)
            setScreen({ status: 'result', result })
          }}
        />
      </div>
      <div className="stack-trace-grid pointer-events-none absolute inset-0 z-10" />
      <div className="stack-trace-vignette pointer-events-none absolute inset-0 z-10" />
      <div className="stack-trace-scanlines pointer-events-none absolute inset-0 z-10" />

      {/* Show the site nav outside the game, but not while playing. */}
      {screen.status !== 'playing' && (
        <div className="stack-trace-nav">
          <SiteHeader />
        </div>
      )}
      {screen.status === 'briefing' && (
        <MissionBriefing
          ready={ready}
          renderingFailed={renderingFailed}
          inputMode={inputMode}
          isPortrait={isPortrait}
          onOpenControls={() => setBriefingControlsOpen(true)}
          onLaunch={launch}
        />
      )}
      {screen.status === 'briefing' && briefingControlsOpen && (
        <ControlsPanel
          inputMode={inputMode}
          sensitivity={inputMode === 'touch' ? sensitivity : undefined}
          onSensitivityChange={setSensitivity}
          onBack={() => setBriefingControlsOpen(false)}
        />
      )}
      {screen.status === 'playing' && !mapOpen && !keybindsOpen && (
        <MissionHud hud={hud} inputMode={inputMode} />
      )}
      {screen.status === 'playing' &&
        inputMode === 'touch' &&
        !paused &&
        !mapOpen &&
        !keybindsOpen && (
          <StackTraceTouchControls
            apiRef={apiRef}
            isPortrait={isPortrait}
            onPause={() => apiRef.current?.pause()}
            onMap={() => apiRef.current?.toggleMap()}
          />
        )}
      {screen.status === 'playing' && mapOpen && (
        <AutomapOverlay
          inputMode={inputMode}
          onClose={() => apiRef.current?.toggleMap()}
        />
      )}
      {screen.status === 'playing' && keybindsOpen && (
        <ControlsPanel
          inputMode={inputMode}
          onBack={() => setKeybindsOpen(false)}
          onResume={closeKeybinds}
        />
      )}
      {screen.status === 'playing' && paused && !mapOpen && !keybindsOpen && (
        <PauseScreen
          inputMode={inputMode}
          onResume={resume}
          onOpenControls={() => setKeybindsOpen(true)}
        />
      )}
      {screen.status === 'result' && (
        <ResultScreen
          result={screen.result}
          inputMode={inputMode}
          onRestart={launch}
        />
      )}
      {hud.damagePulse > 0 && screen.status === 'playing' && (
        <div
          key={hud.damagePulse}
          className="stack-trace-damage pointer-events-none absolute inset-0 z-30"
        />
      )}
    </main>
  )
}
