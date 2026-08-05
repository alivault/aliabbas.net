import { useEffect, useRef, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { ArrowLeft, Crosshair, RotateCcw } from 'lucide-react'
import Logo from '~/components/Logo'
import StackTraceScene from './StackTraceScene'
import { initialHudState } from './stack-trace-types'
import type {
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
      <p className="font-mono text-[8px] tracking-[0.16em] text-white/35 uppercase">
        {label}
      </p>
      <p className="mt-1 text-sm font-semibold text-white">{value}</p>
    </div>
  )
}

function MissionBriefing({
  ready,
  inputSupported,
  onLaunch,
}: {
  ready: boolean
  inputSupported: boolean | null
  onLaunch: () => void
}) {
  const canLaunch = ready && inputSupported !== false

  return (
    <div className="pointer-events-auto relative z-30 flex h-svh min-h-[560px] flex-col overflow-y-auto bg-[linear-gradient(90deg,rgba(5,6,8,.94)_0%,rgba(5,6,8,.8)_48%,rgba(5,6,8,.3)_100%)] p-5 text-[#f1efe8] sm:p-8 lg:p-12">
      <div className="flex items-center justify-between">
        <Link
          to="/"
          className="group flex items-center gap-3 text-xs font-semibold text-white/60 transition-colors hover:text-white"
        >
          <ArrowLeft className="size-4 transition-transform group-hover:-translate-x-1" />
          Portfolio
        </Link>
        <div className="flex items-center gap-2 font-mono text-[9px] tracking-[0.18em] text-white/35 uppercase">
          <span className="size-1.5 rounded-full bg-[#ff694a] shadow-[0_0_12px_#ff694a]" />
          Incident 001
        </div>
      </div>

      <div className="my-auto max-w-[780px] py-12">
        <div className="flex items-center gap-3 font-mono text-[9px] tracking-[0.2em] text-[#ff694a] uppercase sm:text-[10px]">
          <Logo className="h-7 w-8 text-[#d9ff43]" />
          Interactive systems failure
        </div>
        <h1 className="mt-7 text-[clamp(4rem,14vw,10rem)] leading-[0.72] font-extrabold tracking-[-0.075em] uppercase">
          Stack
          <span className="font-display block font-normal text-[#d9ff43] normal-case italic">
            Trace
          </span>
        </h1>
        <p className="mt-9 max-w-xl text-base leading-7 text-white/58 sm:text-lg sm:leading-8">
          Follow the failure through the stack. Purge three corrupted frames,
          destroy the root bug, and escape before the build rolls back.
        </p>

        <div className="mt-9 grid max-w-xl grid-cols-2 gap-px border border-white/15 bg-white/15 sm:grid-cols-4">
          {[
            ['WASD', 'Fly'],
            ['Space / C', 'Rise / descend'],
            ['Q / E', 'Roll'],
            ['Mouse', 'Aim / fire'],
          ].map(([control, action]) => (
            <div key={control} className="bg-[#08090b]/90 p-4">
              <p className="font-mono text-[9px] text-[#d9ff43]">{control}</p>
              <p className="mt-1 text-[10px] text-white/35">{action}</p>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={onLaunch}
          disabled={!canLaunch}
          className="group mt-7 flex h-14 w-full max-w-xl items-center justify-between rounded-full bg-[#d9ff43] px-6 text-xs font-bold text-[#10100f] transition-colors hover:bg-white disabled:cursor-not-allowed disabled:bg-white/15 disabled:text-white/35"
        >
          {inputSupported === false
            ? 'Keyboard and mouse required'
            : ready
              ? 'Launch diagnostic drone'
              : 'Initializing labyrinth'}
          <Crosshair className="size-4 transition-transform group-hover:rotate-45" />
        </button>
        {inputSupported === false && (
          <p className="mt-3 max-w-xl font-mono text-[9px] leading-5 text-white/35 uppercase">
            Stack Trace is currently a desktop mission. Open it on a device with
            a keyboard and pointing device to play.
          </p>
        )}
      </div>

      <div className="flex items-end justify-between border-t border-white/15 pt-4 font-mono text-[8px] tracking-[0.16em] text-white/25 uppercase sm:text-[9px]">
        <span>Six-axis diagnostic flight</span>
        <span>Aliabbas.dev / Play</span>
      </div>
    </div>
  )
}

function MissionHud({ hud }: { hud: GameHudState }) {
  const integrityColor = hud.integrity <= 30 ? '#ff694a' : '#d9ff43'

  return (
    <div className="pointer-events-none absolute inset-0 z-20 p-4 text-[#f1efe8] sm:p-6">
      <div className="flex items-start justify-between gap-8">
        <div>
          <p className="font-mono text-[9px] tracking-[0.2em] text-[#d9ff43] uppercase">
            Stack Trace
          </p>
          <p className="mt-1 font-mono text-[8px] tracking-[0.16em] text-white/30 uppercase">
            Incident 001 / Trace active
          </p>
        </div>

        <div className="max-w-[50vw] text-right">
          <p className="font-mono text-[8px] tracking-[0.16em] text-white/30 uppercase">
            Current instruction
          </p>
          <p className="mt-1 text-xs font-semibold sm:text-sm">
            {hud.objective}
          </p>
          <p className="mt-1 font-mono text-[8px] text-white/30">
            {Math.round(hud.targetDistance)}m
          </p>
        </div>
      </div>

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

      <div className="absolute right-4 bottom-4 left-4 flex items-end justify-between gap-6 sm:right-6 sm:bottom-6 sm:left-6">
        <div className="hidden w-56 border border-white/12 bg-black/35 p-4 backdrop-blur-sm sm:block">
          <p className="font-mono text-[8px] tracking-[0.16em] text-white/30 uppercase">
            Captured frames
          </p>
          <div className="mt-3 space-y-2">
            {hud.frames.map((frame) => (
              <div
                key={frame.number}
                className="grid grid-cols-[24px_1fr_auto] items-center gap-2 font-mono text-[8px]"
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
                <span className="text-[7px] tracking-[0.12em] text-white/25 uppercase">
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
          <div className={hud.phase === 'escape' ? 'block' : 'hidden sm:block'}>
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

      <div className="absolute right-4 bottom-24 h-1 w-32 overflow-hidden bg-white/10 sm:right-6">
        <div
          className="h-full transition-[width] duration-150"
          style={{
            width: `${hud.integrity}%`,
            backgroundColor: integrityColor,
          }}
        />
      </div>
    </div>
  )
}

function PauseScreen({ onResume }: { onResume: () => void }) {
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
          Resume pointer control to continue the mission.
        </p>
        <button
          type="button"
          onClick={onResume}
          className="mt-7 flex h-12 w-full items-center justify-between rounded-full bg-[#d9ff43] px-5 text-xs font-bold text-[#10100f] hover:bg-white"
        >
          Resume trace <Crosshair className="size-4" />
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
            Run trace again <RotateCcw className="size-4" />
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
  const apiRef = useRef<StackTraceGameApi>(null)
  const [ready, setReady] = useState(false)
  const [paused, setPaused] = useState(false)
  const [hud, setHud] = useState(initialHudState)
  const [screen, setScreen] = useState<ScreenState>({ status: 'briefing' })
  const [inputSupported, setInputSupported] = useState<boolean | null>(null)

  useEffect(() => {
    const hasFinePointer = window.matchMedia('(pointer: fine)').matches
    setInputSupported(hasFinePointer && 'pointerLockElement' in document)
  }, [])

  const launch = () => {
    if (!apiRef.current || inputSupported === false) return
    setPaused(false)
    setScreen({ status: 'playing' })
    apiRef.current.start()
  }

  const resume = () => {
    setPaused(false)
    apiRef.current?.resume()
  }

  return (
    <main className="stack-trace-page site-noise relative h-svh min-h-[560px] overflow-hidden bg-[#050608] text-[#f1efe8]">
      <div className="absolute inset-0">
        <StackTraceScene
          apiRef={apiRef}
          onReady={() => setReady(true)}
          onHudChange={setHud}
          onPauseChange={setPaused}
          onEnd={(result) => {
            setPaused(false)
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
          inputSupported={inputSupported}
          onLaunch={launch}
        />
      )}
      {screen.status === 'playing' && <MissionHud hud={hud} />}
      {screen.status === 'playing' && paused && (
        <PauseScreen onResume={resume} />
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
