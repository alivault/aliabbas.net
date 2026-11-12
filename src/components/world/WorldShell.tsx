import { Suspense, lazy, useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { Link, useLocation, useRouter } from '@tanstack/react-router'
import { useReducedMotion } from 'motion/react'
import { installInteractionSounds } from '~/lib/sound'
import { hasFastWebGL } from '~/lib/webgl'
import EnterGate from './EnterGate'
import Hud from './Hud'
import SiteIndex from './SiteIndex'
import { SHEETS, sheetForPath } from './sheets'
import {
  getWorld,
  loadVisited,
  setWorld,
  useWorld,
  worldCommands,
} from './store'
import type { SheetSpec } from './sheets'

const World = lazy(() => import('./World'))

/**
 * The frame of the whole site. The world stays mounted behind every page.
 * On `/` the visitor walks in the world. On a page, the camera holds the
 * icon of that page on the right, the world goes dark, and the text of the
 * page comes in on the left.
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
  const firstMove = useRef(true)

  useEffect(() => {
    // ?gl=force draws the world also with software WebGL, for tests.
    const force = new URLSearchParams(location.search).get('gl') === 'force'
    setWebgl(force || hasFastWebGL())
    loadVisited()
    return installInteractionSounds()
  }, [])

  // The router moves the camera: links, back and forward, and deep links.
  useEffect(() => {
    if (!ready) return
    const first = firstMove.current
    firstMove.current = false
    const { phase, target } = getWorld()
    if (!inPage) {
      if (phase !== 'roam' && phase !== 'leaving') worldCommands.leave()
      return
    }
    const sheet = sheetForPath(path)
    if (!sheet) {
      if (phase === 'roam') setWorld({ phase: 'inside', target: null })
      return
    }
    if (target === sheet.id && (phase === 'entering' || phase === 'inside')) {
      return
    }
    // A deep link starts at the icon. Later moves fly there.
    if (first) worldCommands.snapInto(sheet.id)
    else worldCommands.enter(sheet.id)
  }, [path, inPage, ready])

  // Esc closes a page, back to the world.
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

  const open = (sheet: SheetSpec) => {
    worldCommands.enter(sheet.id)
    void router.navigate({ href: sheet.to })
  }

  // The text shows when the camera holds the icon. Before the world runs
  // (on the server, or without WebGL), it shows at once.
  const showText = inPage && (!ready || phase === 'inside')

  return (
    <>
      <div
        aria-hidden="true"
        className="from-sky-warm via-sky-cool to-ground fixed inset-0 bg-linear-to-b"
      >
        {webgl ? (
          <Suspense fallback={null}>
            <World reducedMotion={reducedMotion} onOpen={open} />
          </Suspense>
        ) : null}
      </div>

      {webgl === false && !inPage ? <FlatWorld /> : null}

      {showText ? children : null}
      {/* The home page has no content of its own: it is the world. */}
      {inPage ? null : <h1 className="sr-only">Ali Abbas</h1>}

      <SiteIndex />
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
