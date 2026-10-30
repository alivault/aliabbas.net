import { useCallback, useMemo, useState } from 'react'
import type { CSSProperties, ReactNode } from 'react'
import {
  Outlet,
  createFileRoute,
  useLocation,
  useNavigate,
  useSearch,
} from '@tanstack/react-router'
import { PanelActiveContext } from '~/components/assistant/panel-active'
import PortfolioChat from '~/components/chat/PortfolioChat'
import ClaimChecker from '~/components/check/ClaimChecker'
import ModeSwitch from '~/components/check/ModeSwitch'
import type { AssistantMode } from '~/components/check/ModeSwitch'
import Main from '~/components/Main'
import { motion, useReducedMotion } from 'motion/react'
import { cn } from 'cn'
import { DURATIONS, EASE_OUT } from '~/lib/design/motion'

/**
 * Chat and the claim checker are two modes of one page. The layout stays
 * mounted, so a switch does not run the page transition. Both panels stay
 * mounted after their first visit, so a conversation survives a detour to
 * the checker. The new panel slides in from the side of its tab.
 */
export const Route = createFileRoute('/_assistant')({
  component: AssistantLayout,
})

const ORDER: ReadonlyArray<AssistantMode> = ['chat', 'check']

function modeOf(pathname: string): AssistantMode {
  return pathname.startsWith('/check') ? 'check' : 'chat'
}

function AssistantLayout() {
  const active = useLocation({
    select: (location) => modeOf(location.pathname),
  })
  const search: { claim?: string } = useSearch({ strict: false })
  const navigate = useNavigate()
  const reduce = useReducedMotion() ?? false

  // The claim stays in the URL, so a result can be shared. It also stays
  // on the Check tab link, so a return to the checker keeps it.
  const [lastClaim, setLastClaim] = useState(search.claim)
  const setClaim = useCallback(
    (next: string | undefined) => {
      setLastClaim(next)
      void navigate({
        to: '/check',
        search: next ? { claim: next } : {},
        replace: true,
      })
    },
    [navigate],
  )

  // Mount a panel on its first visit, then keep it.
  const [mounted, setMounted] = useState<ReadonlySet<AssistantMode>>(
    () => new Set([active]),
  )
  if (!mounted.has(active)) setMounted(new Set([...mounted, active]))

  // A switch remembers its direction (+1 to the right tab, -1 to the left)
  // and keeps the panel that leaves on screen until its exit ends.
  const [previous, setPrevious] = useState(active)
  const [leaving, setLeaving] = useState<AssistantMode | null>(null)
  const [direction, setDirection] = useState<1 | -1>(1)
  if (previous !== active) {
    setPrevious(active)
    setLeaving(reduce ? null : previous)
    setDirection(ORDER.indexOf(active) > ORDER.indexOf(previous) ? 1 : -1)
  }
  // Panels on screen at the first render do not animate in.
  const [firstMode] = useState(active)

  const panels: Record<AssistantMode, ReactNode> = {
    chat: <PortfolioChat />,
    check: (
      <ClaimChecker initialClaim={search.claim} onClaimChange={setClaim} />
    ),
  }

  return (
    // The chat fills the screen. The checker is a page, so it has the footer.
    <Main hideFooter={active === 'chat'}>
      <section
        className="site-noise bg-background text-foreground"
        style={{ '--assistant-bar': '4rem' } as CSSProperties}
      >
        <div className="relative z-30 mx-auto flex h-16 max-w-3xl items-end px-4 sm:px-6 lg:justify-center">
          <ModeSwitch current={active} claim={lastClaim} />
        </div>
        <div className="relative z-30 mx-auto grid max-w-[1600px] overflow-x-clip">
          {ORDER.map((mode) => {
            if (!mounted.has(mode)) return null
            return (
              <Panel
                key={mode}
                active={mode === active}
                leaving={mode === leaving}
                animateIn={mode !== firstMode}
                direction={direction}
                reduce={reduce}
                onExitEnd={() => setLeaving(null)}
              >
                {panels[mode]}
              </Panel>
            )
          })}
        </div>
        <Outlet />
      </section>
    </Main>
  )
}

function Panel({
  active,
  animateIn,
  children,
  direction,
  leaving,
  onExitEnd,
  reduce,
}: {
  active: boolean
  /** False only for the panel of the first render. */
  animateIn: boolean
  children: ReactNode
  direction: 1 | -1
  leaving: boolean
  onExitEnd: () => void
  reduce: boolean
}) {
  // New objects only when the state changes, so a re-render of an active
  // panel does not start the animation again.
  const target = useMemo(
    () =>
      active
        ? {
            opacity: [0, 1],
            x: [direction * 40, 0],
            filter: ['blur(6px)', 'blur(0px)'],
          }
        : {
            opacity: 0,
            x: direction * -40,
            filter: 'blur(6px)',
          },
    [active, direction],
  )
  return (
    <PanelActiveContext.Provider value={active}>
      <motion.div
        inert={!active}
        initial={
          animateIn
            ? { opacity: 0, x: direction * 40, filter: 'blur(6px)' }
            : false
        }
        animate={target}
        transition={
          reduce
            ? { duration: 0 }
            : active
              ? { duration: DURATIONS.page, ease: EASE_OUT, delay: 0.1 }
              : { duration: DURATIONS.enter, ease: EASE_OUT }
        }
        onAnimationComplete={() => {
          if (leaving) onExitEnd()
        }}
        className={cn(
          'min-w-0 [grid-area:1/1]',
          !active && 'pointer-events-none',
          !active && !leaving && 'hidden',
        )}
      >
        {children}
      </motion.div>
    </PanelActiveContext.Provider>
  )
}
