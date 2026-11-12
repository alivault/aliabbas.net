import { Suspense, lazy, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { Link, useLocation, useRouter } from '@tanstack/react-router'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { DURATIONS, EASE_OUT } from '~/lib/design/motion'
import { installInteractionSounds } from '~/lib/sound'
import { hasFastWebGL } from '~/lib/webgl'
import EnterGate from './EnterGate'
import Hud from './Hud'
import { SHEETS, sheetForPath } from './sheets'
import {
  getWorld,
  loadVisited,
  setWorld,
  useWorld,
  worldCommands,
} from './store'

const World = lazy(() => import('./World'))

/**
 * The frame of the whole site. The world stays mounted behind every page.
 * On `/` the visitor is in the world. On any other path, the page shows
 * over it, as if the camera had gone into that page's sheet.
 */
export default function WorldShell({ children }: { children: ReactNode }) {
  const path = useLocation({ select: (location) => location.pathname })
  const router = useRouter()
  const reducedMotion = useReducedMotion() ?? false
  const ready = useWorld((s) => s.ready)
  const phase = useWorld((s) => s.phase)
  const inPage = path !== '/'
  // undefined until the client knows if WebGL is fast.
  const [webgl, setWebgl] = useState<boolean | undefined>(undefined)

  useEffect(() => {
    // ?gl=force draws the world also with software WebGL, for tests.
    const force = new URLSearchParams(location.search).get('gl') === 'force'
    setWebgl(force || hasFastWebGL())
    loadVisited()
    return installInteractionSounds()
  }, [])

  // The router moves the camera: back and forward, links between pages,
  // and deep links.
  useEffect(() => {
    if (!ready) return
    const { phase, target } = getWorld()
    if (!inPage) {
      if (phase === 'inside' || phase === 'entering') worldCommands.leave()
      return
    }
    const sheet = sheetForPath(path)
    if (!sheet) {
      if (phase === 'roam') setWorld({ phase: 'inside', target: null })
      return
    }
    if (phase === 'entering' && target === sheet.id) return
    if (phase !== 'inside' || target !== sheet.id) {
      worldCommands.snapInto(sheet.id)
    }
  }, [path, inPage, ready])

  // Esc leaves a page, back to the world.
  useEffect(() => {
    if (!inPage) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' || event.defaultPrevented) return
      // A dialog or a menu uses Esc first.
      if (document.querySelector('[role="dialog"], [role="menu"]')) return
      void router.navigate({ to: '/' })
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [inPage, router])

  return (
    <>
      <div
        aria-hidden={inPage}
        className="from-sky-warm via-sky-cool to-ground fixed inset-0 bg-linear-to-b"
      >
        {webgl ? (
          <Suspense fallback={null}>
            <World
              reducedMotion={reducedMotion}
              paused={inPage && phase === 'inside'}
              onEntered={(sheet) => void router.navigate({ href: sheet.to })}
            />
          </Suspense>
        ) : null}
      </div>

      {webgl === false && !inPage ? <FlatWorld /> : null}

      <AnimatePresence initial={false}>
        {inPage ? (
          <motion.div
            key="page"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: DURATIONS.enter, ease: EASE_OUT }}
            className="bg-background relative z-10 min-h-svh"
          >
            {children}
          </motion.div>
        ) : null}
      </AnimatePresence>
      {/* The home page has no content of its own: it is the world. */}
      {inPage ? null : <h1 className="sr-only">Ali Abbas</h1>}

      <Hud inPage={inPage} />
      <EnterGate active={!inPage && webgl !== false} />
    </>
  )
}

/** Without a fast GPU: the pages as a list over a still sky. */
function FlatWorld() {
  return (
    <nav
      aria-label="Pages"
      data-hud
      className="font-hud text-hud relative z-10 flex min-h-svh items-center justify-center text-sm tracking-[0.42em] uppercase [&_:is(button,a,input)]:uppercase"
    >
      <ul className="flex flex-col items-center gap-5">
        {SHEETS.map((sheet) => (
          <li key={sheet.id}>
            <Link to={sheet.to} className="hover:opacity-70">
              {sheet.title}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  )
}
