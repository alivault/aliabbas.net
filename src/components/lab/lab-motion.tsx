import {
  createContext,
  use,
  useEffect,
  useId,
  useMemo,
  useState,
  useSyncExternalStore,
} from 'react'
import type { ReactNode } from 'react'
import { MotionConfig } from 'motion/react'
import { cn } from 'cn'

const REDUCED_QUERY = '(prefers-reduced-motion: reduce)'

function subscribe(onChange: () => void) {
  const query = window.matchMedia(REDUCED_QUERY)
  query.addEventListener('change', onChange)
  return () => query.removeEventListener('change', onChange)
}

/** The OS setting. It updates live, unlike Motion's useReducedMotion. */
function useSystemReducedMotion() {
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(REDUCED_QUERY).matches,
    () => false,
  )
}

/**
 * Classes on <html> while motion is reduced. They stop CSS animations and
 * transitions on the whole page, also in portals such as the drawer and
 * the hover card.
 */
const REDUCED_CLASSES = [
  '[&_*]:animate-none!',
  '[&_*]:transition-none!',
] as const

type LabMotionValue = {
  /** True when the page must not animate. */
  reduce: boolean
  system: boolean
  forced: boolean
  setForced: (forced: boolean) => void
}

const LabMotionContext = createContext<LabMotionValue | null>(null)

export function useLabMotion() {
  const value = use(LabMotionContext)
  if (!value) throw new Error('useLabMotion must be used in LabMotionProvider.')
  return value
}

/**
 * The page-level motion setting. It follows the OS by default, and the
 * visitor can force reduced motion on. Motion components get it from
 * MotionConfig. Lab components read it with useLabMotion.
 */
export function LabMotionProvider({ children }: { children: ReactNode }) {
  const system = useSystemReducedMotion()
  const [forced, setForced] = useState(false)
  const reduce = system || forced

  useEffect(() => {
    if (!reduce) return
    const root = document.documentElement
    root.classList.add(...REDUCED_CLASSES)
    return () => root.classList.remove(...REDUCED_CLASSES)
  }, [reduce])

  const value = useMemo(
    () => ({ reduce, system, forced, setForced }),
    [reduce, system, forced],
  )

  return (
    <LabMotionContext value={value}>
      <MotionConfig reducedMotion={reduce ? 'always' : 'never'}>
        {children}
      </MotionConfig>
    </LabMotionContext>
  )
}

export function ReducedMotionSwitch({ className }: { className?: string }) {
  const { reduce, system, forced, setForced } = useLabMotion()
  const descriptionId = useId()

  return (
    <div
      className={cn('flex flex-wrap items-center gap-x-3 gap-y-1', className)}
    >
      <button
        type="button"
        role="switch"
        aria-checked={reduce}
        aria-disabled={system || undefined}
        aria-describedby={descriptionId}
        onClick={() => {
          if (!system) setForced(!forced)
        }}
        className="group/switch focus-visible:ring-brand/70 flex items-center gap-3 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-offset-4 focus-visible:ring-offset-[var(--background)] aria-disabled:cursor-not-allowed"
      >
        <span
          aria-hidden="true"
          className={cn(
            'relative flex h-6 w-11 shrink-0 items-center rounded-full border p-0.5 transition-colors',
            reduce
              ? 'border-brand bg-brand'
              : 'border-foreground/25 bg-foreground/[0.06]',
          )}
        >
          <span
            className={cn(
              'size-4.5 rounded-full transition-transform',
              reduce
                ? 'bg-brand-foreground translate-x-5'
                : 'bg-foreground/60 translate-x-0',
            )}
          />
        </span>
        <span className="text-foreground text-sm font-semibold whitespace-nowrap">
          Reduce motion
        </span>
      </button>
      <span id={descriptionId} className="text-fg-muted text-sm">
        {system
          ? 'On. Your system asks for reduced motion.'
          : forced
            ? 'On for this page.'
            : 'Off. It follows your system setting.'}
      </span>
    </div>
  )
}
