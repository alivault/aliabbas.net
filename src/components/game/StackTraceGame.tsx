import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { ArrowLeft, Map as MapIcon, X } from 'lucide-react'
import { Kbd } from '~/components/ui/kbd'
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

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-l border-white/15 pl-4">
      <p className="font-mono text-[10px] tracking-[0.14em] text-white/40 uppercase sm:text-[11px]">
        {label}
      </p>
      <p className="mt-1 text-base font-semibold text-white sm:text-lg">
        {value}
      </p>
    </div>
  )
}

function MissionBriefing({
  ready,
  renderingFailed,
  inputMode,
  isPortrait,
  sensitivity,
  onSensitivityChange,
  onLaunch,
}: {
  ready: boolean
  renderingFailed: boolean
  inputMode: GameInputMode
  isPortrait: boolean
  sensitivity: number
  onSensitivityChange: (sensitivity: number) => void
  onLaunch: () => void
}) {
  const isTouch = inputMode === 'touch'
  const isTouchPortrait = isTouch && isPortrait
  const canLaunch = ready && !renderingFailed
  const controls = isTouch
    ? [
        ['Move stick', 'Fly / strafe'],
        ['View', 'Drag to aim'],
        ['Tap / fire', 'Patch cannon'],
        ['Arrows', 'Rise / descend'],
      ]
    : [
        ['WASD', 'Fly'],
        ['Space / C', 'Rise / descend'],
        ['Q / E', 'Roll'],
        ['Mouse', 'Aim / fire'],
        ['M', 'Wireframe map'],
      ]

  return (
    <div className="pointer-events-auto relative z-30 flex h-svh min-h-[320px] flex-col overflow-y-auto bg-[linear-gradient(90deg,rgba(5,6,8,.94)_0%,rgba(5,6,8,.8)_48%,rgba(5,6,8,.3)_100%)] p-5 text-[#f1efe8] sm:p-8 lg:p-12">
      <div className="flex items-center">
        <Link
          to="/"
          className="group flex items-center gap-3 text-xs font-semibold text-white/60 transition-colors hover:text-white"
        >
          <ArrowLeft className="size-4 transition-transform group-hover:-translate-x-1" />
          Portfolio
        </Link>
      </div>

      <div
        className={`mx-auto my-auto w-full ${
          isTouchPortrait
            ? 'max-w-xl py-6'
            : isTouch
              ? 'grid max-w-5xl grid-cols-[0.8fr_1.2fr] items-center gap-8 py-8'
              : 'max-w-[780px] py-8 sm:py-12'
        }`}
      >
        <div>
          <h1
            className={`text-center leading-[0.72] font-extrabold tracking-[-0.075em] uppercase ${
              isTouchPortrait
                ? 'text-[clamp(3rem,16vw,5rem)]'
                : isTouch
                  ? 'text-[clamp(2.75rem,8vw,5rem)]'
                  : 'text-[clamp(3rem,9vw,9rem)]'
            }`}
          >
            Stack
            <span className="font-display block font-normal text-[#d9ff43] normal-case italic">
              Trace
            </span>
          </h1>
        </div>

        <div>
          <p
            className={`mx-auto max-w-xl text-center text-white/58 ${
              isTouch
                ? `${isTouchPortrait ? 'mt-7' : ''} text-sm leading-5`
                : 'mt-9 text-base leading-6 sm:text-lg sm:leading-7'
            }`}
          >
            Pilot a diagnostic drone through a zero-gravity codebase. Explore
            connected chambers, shoot corrupted frames and bugs, destroy the
            root bug, then escape before the build rolls back.
          </p>

          <div
            className={`mx-auto grid max-w-xl grid-cols-2 gap-px border border-white/15 bg-white/15 ${isTouch ? 'mt-4 sm:grid-cols-4' : 'mt-9 sm:grid-cols-5'}`}
          >
            {controls.map(([control, action]) => (
              <div
                key={control}
                className={`bg-[#08090b]/90 text-center ${isTouch ? 'px-2.5 py-1.5' : 'px-4 py-2.5'}`}
              >
                <p className="font-mono text-[11px] text-[#d9ff43] sm:text-xs">
                  {control}
                </p>
                <p className="mt-1 text-[11px] text-white/40 sm:text-xs">
                  {action}
                </p>
              </div>
            ))}
          </div>

          {isTouch && (
            <div className="mx-auto mt-4 max-w-xl font-mono text-[8px] tracking-[0.12em] text-white/40 uppercase">
              <label className="flex items-center gap-3">
                Look sensitivity
                <input
                  type="range"
                  min="0.65"
                  max="1.5"
                  step="0.05"
                  value={sensitivity}
                  onChange={(event) =>
                    onSensitivityChange(Number(event.currentTarget.value))
                  }
                  className="h-1 min-w-20 flex-1 accent-[#d9ff43]"
                />
              </label>
            </div>
          )}

          <button
            type="button"
            onClick={onLaunch}
            disabled={!canLaunch}
            className={`group mx-auto flex w-full max-w-xl items-center justify-between rounded-full bg-[#d9ff43] px-6 text-xs font-bold text-[#10100f] transition-colors hover:bg-white disabled:cursor-not-allowed disabled:bg-white/15 disabled:text-white/35 ${isTouch ? 'mt-4 h-12' : 'mt-7 h-14'}`}
          >
            {renderingFailed
              ? 'WebGL is unavailable'
              : ready
                ? 'Start game'
                : 'Initializing labyrinth'}
            <Kbd className="h-7 rounded-full bg-[#10100f]/10 px-2.5 font-mono text-[10px] font-bold text-[#10100f] group-disabled:bg-white/10 group-disabled:text-white/35">
              Enter
            </Kbd>
          </button>
        </div>
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
  const integrityColor = hud.integrity <= 30 ? '#ff694a' : '#d9ff43'
  const isTouch = inputMode === 'touch'

  return (
    <div className="stack-trace-hud pointer-events-none absolute inset-0 z-20 p-4 text-[#f1efe8] sm:p-6">
      <div className="flex items-start justify-between gap-8">
        <div>
          <p className="font-mono text-[11px] tracking-[0.18em] text-[#d9ff43] uppercase sm:text-xs">
            Stack Trace
          </p>
          <p className="mt-1 font-mono text-[9px] tracking-[0.14em] text-white/35 uppercase sm:text-[10px]">
            Incident 001 / Trace active
          </p>
          {!isTouch && (
            <div className="mt-4 flex items-center gap-2 font-mono text-[10px] tracking-[0.12em] text-white/45 uppercase">
              <Kbd className="size-6 border border-white/20 bg-black/35 font-mono text-xs text-white/75">
                ?
              </Kbd>
              Keybinds
            </div>
          )}
        </div>

        <div className="max-w-[50vw] text-right">
          <p className="font-mono text-[9px] tracking-[0.14em] text-white/35 uppercase sm:text-[10px]">
            Current instruction
          </p>
          <p className="mt-1 text-sm font-semibold sm:text-base">
            {hud.objective}
          </p>
          <p className="mt-1 font-mono text-[10px] text-white/35 sm:text-[11px]">
            {Math.round(hud.targetDistance)}m
          </p>
        </div>
      </div>

      {hud.phase === 'escape' && (
        <>
          <div
            className="stack-trace-escape-frame absolute inset-2 border-2 border-[#ff694a]/70 sm:inset-3"
            data-critical={hud.escapeTime <= 10 ? 'true' : 'false'}
          />
          <div
            className={`stack-trace-escape-alert absolute left-1/2 flex -translate-x-1/2 items-center gap-4 border border-[#ff694a]/75 bg-[#160906]/88 px-4 py-3 text-left shadow-[0_0_28px_rgba(255,105,74,.24)] backdrop-blur-sm ${isTouch ? 'top-[max(8rem,calc(env(safe-area-inset-top)+7rem))] w-[min(19rem,calc(100vw-2rem))]' : 'top-[max(6.25rem,calc(env(safe-area-inset-top)+5rem))] min-w-80'}`}
            data-critical={hud.escapeTime <= 10 ? 'true' : 'false'}
          >
            <span className="size-2 shrink-0 rounded-full bg-[#ff694a] shadow-[0_0_14px_#ff694a]" />
            <div className="min-w-0 flex-1">
              <p className="font-mono text-[8px] tracking-[0.18em] text-[#ff694a] uppercase sm:text-[9px]">
                Rollback active
              </p>
              <p className="mt-0.5 text-sm font-extrabold tracking-[0.04em] text-white uppercase sm:text-base">
                Return to surface
              </p>
              <p className="mt-0.5 text-[10px] text-white/50 sm:text-xs">
                Hurry—reach the exit before rollback.
              </p>
            </div>
            <span className="font-mono text-2xl font-bold text-[#ff694a] tabular-nums sm:text-3xl">
              {Math.ceil(hud.escapeTime)}s
            </span>
          </div>
        </>
      )}

      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
        <div
          key={hud.hitPulse}
          className="stack-trace-crosshair relative size-8"
          data-hit={hud.hitPulse > 0 ? 'true' : 'false'}
        >
          <span className="absolute top-1/2 left-0 h-px w-2 bg-white/70" />
          <span className="absolute top-1/2 right-0 h-px w-2 bg-white/70" />
          <span className="absolute top-0 left-1/2 h-2 w-px bg-white/70" />
          <span className="absolute bottom-0 left-1/2 h-2 w-px bg-white/70" />
          <span className="absolute top-1/2 left-1/2 size-1 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#d9ff43]" />
        </div>
      </div>

      {!isTouch && (
        <div className="absolute right-4 bottom-4 left-4 flex items-end justify-between gap-6 sm:right-6 sm:bottom-6 sm:left-6">
          <div className="hidden w-56 border border-white/12 bg-black/35 p-4 backdrop-blur-sm sm:block">
            <p className="font-mono text-[10px] tracking-[0.14em] text-white/35 uppercase">
              Captured frames
            </p>
            <div className="mt-3 space-y-2">
              {hud.frames.map((frame) => (
                <div
                  key={frame.number}
                  className="grid grid-cols-[24px_1fr_auto] items-center gap-2 font-mono text-[10px]"
                >
                  <span className="text-white/25">{frame.number}</span>
                  <span
                    className={
                      frame.status === 'active'
                        ? 'text-[#ff694a]'
                        : frame.status === 'resolved'
                          ? 'text-[#d9ff43]'
                          : 'text-white/25'
                    }
                  >
                    {frame.label}
                  </span>
                  <span className="text-[9px] tracking-[0.1em] text-white/30 uppercase">
                    {frame.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="ml-auto grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Metric
              label="Integrity"
              value={`${hud.integrity.toString().padStart(3, '0')}%`}
            />
            <Metric
              label="Frames"
              value={`${hud.faultsResolved}/${hud.totalFaults}`}
            />
            <div className="hidden sm:block">
              <Metric label="Bugs" value={String(hud.bugsPurged)} />
            </div>
            <div
              className={hud.phase === 'escape' ? 'block' : 'hidden sm:block'}
            >
              <Metric
                label={hud.phase === 'escape' ? 'Rollback' : 'Trace'}
                value={
                  hud.phase === 'escape'
                    ? `${Math.ceil(hud.escapeTime)}s`
                    : 'Active'
                }
              />
            </div>
          </div>
        </div>
      )}

      {isTouch && (
        <div className="absolute top-[max(4.25rem,calc(env(safe-area-inset-top)+3.5rem))] left-[max(1rem,env(safe-area-inset-left))] flex gap-4">
          <Metric
            label="Integrity"
            value={`${hud.integrity.toString().padStart(3, '0')}%`}
          />
          <Metric
            label="Frames"
            value={`${hud.faultsResolved}/${hud.totalFaults}`}
          />
          {hud.phase === 'escape' && (
            <Metric label="Rollback" value={`${Math.ceil(hud.escapeTime)}s`} />
          )}
        </div>
      )}

      {!isTouch && (
        <div className="absolute right-4 bottom-24 h-1 w-32 overflow-hidden bg-white/10 sm:right-6">
          <div
            className="h-full transition-[width] duration-150"
            style={{
              width: `${hud.integrity}%`,
              backgroundColor: integrityColor,
            }}
          />
        </div>
      )}
    </div>
  )
}

const keybinds = [
  ['W A S D', 'Fly / strafe'],
  ['Space / C', 'Rise / descend'],
  ['Q / E', 'Roll'],
  ['Mouse', 'Aim / fire'],
  ['M', 'Wireframe map'],
  ['Esc', 'Pause'],
  ['Enter', 'Resume game'],
  ['?', 'Toggle keybinds'],
] as const

function KeybindsScreen({ onClose }: { onClose: () => void }) {
  return (
    <div className="pointer-events-auto absolute inset-0 z-50 grid place-items-center overflow-y-auto bg-[#050608]/82 p-5 text-[#f1efe8] backdrop-blur-sm">
      <div className="w-full max-w-2xl border border-white/15 bg-[#090a0d] p-6 sm:p-8">
        <div className="flex items-start justify-between gap-6">
          <div>
            <p className="font-mono text-[10px] tracking-[0.2em] text-[#d9ff43] uppercase">
              Input reference
            </p>
            <h2 className="font-display mt-3 text-4xl tracking-[-0.045em] sm:text-6xl">
              Flight controls
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex size-11 shrink-0 items-center justify-center rounded-full border border-white/20 text-white/60 transition-colors hover:border-white/45 hover:text-white"
            aria-label="Close keybinds"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="mt-7 grid gap-px border border-white/15 bg-white/15 sm:grid-cols-2">
          {keybinds.map(([keybind, action]) => (
            <div
              key={keybind}
              className="flex min-h-16 items-center justify-between gap-4 bg-[#08090b] px-4 py-3"
            >
              <span className="text-sm text-white/55">{action}</span>
              <Kbd className="h-6 shrink-0 bg-white/8 px-2 font-mono text-xs font-semibold text-[#d9ff43]">
                {keybind}
              </Kbd>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={onClose}
          className="mt-7 flex h-12 w-full items-center justify-between rounded-full bg-[#d9ff43] px-5 text-xs font-bold text-[#10100f] transition-colors hover:bg-white"
        >
          Resume game
          <Kbd className="h-7 rounded-full bg-[#10100f]/10 px-2.5 font-mono text-[10px] font-bold text-[#10100f]">
            Enter
          </Kbd>
        </button>
      </div>
    </div>
  )
}

function PauseScreen({
  inputMode,
  onResume,
}: {
  inputMode: GameInputMode
  onResume: () => void
}) {
  return (
    <div className="pointer-events-auto absolute inset-0 z-40 grid place-items-center bg-[#050608]/80 p-5 text-[#f1efe8] backdrop-blur-sm">
      <div className="w-full max-w-md border border-white/15 bg-[#0a0b0e] p-6 sm:p-8">
        <p className="font-mono text-[9px] tracking-[0.2em] text-[#ff694a] uppercase">
          Diagnostic suspended
        </p>
        <h2 className="font-display mt-4 text-5xl tracking-[-0.045em]">
          Trace paused.
        </h2>
        <p className="mt-4 text-sm leading-6 text-white/45">
          Resume {inputMode === 'touch' ? 'touch' : 'pointer'} control to
          continue the mission.
        </p>
        <button
          type="button"
          onClick={onResume}
          className="mt-7 flex h-12 w-full items-center justify-between rounded-full bg-[#d9ff43] px-5 text-xs font-bold text-[#10100f] hover:bg-white"
        >
          Resume game
          <Kbd className="h-7 rounded-full bg-[#10100f]/10 px-2.5 font-mono text-[10px] font-bold text-[#10100f]">
            Enter
          </Kbd>
        </button>
        <Link
          to="/"
          className="mt-3 flex h-12 items-center justify-center text-xs font-semibold text-white/45 transition-colors hover:text-white"
        >
          Exit to portfolio
        </Link>
      </div>
    </div>
  )
}

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
        <div>
          <div className="flex items-center gap-2 font-mono text-[9px] tracking-[0.2em] text-[#d9ff43] uppercase">
            <MapIcon className="size-4" />
            Complete stack geometry
          </div>
          <h2 className="font-display mt-2 text-3xl tracking-[-0.04em] sm:text-5xl">
            Wireframe map
          </h2>
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 font-mono text-[7px] tracking-[0.12em] text-white/40 uppercase sm:text-[8px]">
            {[
              ['#d9ff43', 'Player'],
              ['#ff694a', 'Hostile target'],
              ['#f1efe8', 'Traversed'],
              ['#335cff', 'Untraversed'],
            ].map(([color, label]) => (
              <span key={label} className="flex items-center gap-1.5">
                <span
                  className="size-1.5 rounded-full"
                  style={{ backgroundColor: color }}
                />
                {label}
              </span>
            ))}
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="pointer-events-auto flex size-11 items-center justify-center rounded-full border border-white/20 bg-black/40 text-white/70 backdrop-blur-sm transition-colors hover:border-white/45 hover:text-white"
          aria-label="Close wireframe map"
        >
          <X className="size-4" />
        </button>
      </div>

      <div className="flex items-end justify-between gap-6 font-mono text-[8px] tracking-[0.14em] text-white/35 uppercase sm:text-[9px]">
        <span>
          {inputMode === 'touch'
            ? 'Drag to rotate'
            : 'Drag to rotate / Wheel to zoom'}
        </span>
        <span>
          {inputMode === 'touch' ? 'Tap close to resume' : 'M or Esc to close'}
        </span>
      </div>
    </div>
  )
}

function ResultScreen({
  result,
  onRestart,
}: {
  result: GameResult
  onRestart: () => void
}) {
  const didWin = result.status === 'won'
  return (
    <div className="pointer-events-auto absolute inset-0 z-40 grid place-items-center overflow-y-auto bg-[#050608]/88 p-5 text-[#f1efe8] backdrop-blur-md">
      <div className="w-full max-w-2xl border border-white/15 bg-[#090a0d] p-6 sm:p-9">
        <div className="flex items-center justify-between gap-6">
          <p
            className={`font-mono text-[9px] tracking-[0.2em] uppercase ${didWin ? 'text-[#d9ff43]' : 'text-[#ff694a]'}`}
          >
            {didWin ? 'Stack trace resolved' : 'Trace terminated'}
          </p>
          <span className="font-mono text-[8px] text-white/25">
            INCIDENT_001
          </span>
        </div>
        <h2 className="mt-6 text-[clamp(3.5rem,11vw,7rem)] leading-[0.78] font-extrabold tracking-[-0.065em] uppercase">
          Build
          <span
            className={`font-display block font-normal normal-case italic ${didWin ? 'text-[#d9ff43]' : 'text-[#ff694a]'}`}
          >
            {didWin ? 'shipped.' : 'failed.'}
          </span>
        </h2>
        <p className="mt-6 text-sm text-white/45">{result.reason}</p>

        <div className="mt-8 grid grid-cols-2 gap-px border border-white/15 bg-white/15 sm:grid-cols-3">
          {[
            ['Ship score', result.score.toLocaleString()],
            ['Integrity', `${result.integrity}%`],
            ['Accuracy', `${Math.round(result.accuracy)}%`],
            ['Bugs purged', String(result.bugsPurged)],
            ['Frames resolved', `${result.faultsResolved}/3`],
            ['Trace time', `${Math.round(result.elapsed)}s`],
          ].map(([label, value]) => (
            <div key={label} className="bg-[#090a0d] p-4 sm:p-5">
              <p className="font-mono text-[8px] tracking-[0.14em] text-white/30 uppercase">
                {label}
              </p>
              <p className="mt-2 text-xl font-semibold">{value}</p>
            </div>
          ))}
        </div>

        <div className="mt-7 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={onRestart}
            className="flex h-12 flex-1 items-center justify-between rounded-full bg-[#d9ff43] px-5 text-xs font-bold text-[#10100f] hover:bg-white"
          >
            Run trace again
            <Kbd className="h-7 rounded-full bg-[#10100f]/10 px-2.5 font-mono text-[10px] font-bold text-[#10100f]">
              Enter
            </Kbd>
          </button>
          <Link
            to="/"
            className="flex h-12 flex-1 items-center justify-center rounded-full border border-white/15 text-xs font-semibold text-white/60 transition-colors hover:border-white/35 hover:text-white"
          >
            Return to portfolio
          </Link>
        </div>
      </div>
    </div>
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
    setScreen({ status: 'playing' })
    apiRef.current.start(inputMode, { sensitivity })
  }, [inputMode, ready, renderingFailed, requestMobileFullscreen, sensitivity])

  useEffect(() => {
    if (screen.status !== 'briefing' && screen.status !== 'result') return
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.code !== 'Enter' || event.repeat) return
      event.preventDefault()
      event.stopImmediatePropagation()
      launch()
    }
    window.addEventListener('keydown', handleKeyDown, true)
    return () => window.removeEventListener('keydown', handleKeyDown, true)
  }, [launch, screen.status])

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

      {screen.status === 'briefing' && (
        <MissionBriefing
          ready={ready}
          renderingFailed={renderingFailed}
          inputMode={inputMode}
          isPortrait={isPortrait}
          sensitivity={sensitivity}
          onSensitivityChange={setSensitivity}
          onLaunch={launch}
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
        <KeybindsScreen onClose={closeKeybinds} />
      )}
      {screen.status === 'playing' && paused && !mapOpen && !keybindsOpen && (
        <PauseScreen inputMode={inputMode} onResume={resume} />
      )}
      {screen.status === 'result' && (
        <ResultScreen result={screen.result} onRestart={launch} />
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
