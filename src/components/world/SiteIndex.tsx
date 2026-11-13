import { useEffect, useRef } from 'react'
import type { ReactNode } from 'react'
import { Link } from '@tanstack/react-router'
import { AnimatePresence, motion } from 'motion/react'
import type { Variants } from 'motion/react'
import { DURATIONS, EASE_IN, EASE_OUT } from '~/lib/design/motion'
import { cn } from '~/lib/utils'
import { SHEETS } from './sheets'
import { setWorld, useWorld } from './store'

const EMAIL = 'ali@aliabbas.net'

type Entry = { label: string; to: string } | { label: string; href: string }

const GROUPS: Array<{
  title: string
  size: 'large' | 'small'
  entries: Array<Entry>
}> = [
  {
    title: 'Work',
    size: 'large',
    entries: [
      { label: 'Pico', to: '/work/pico' },
      { label: 'Whimcall', to: '/work/whimcall' },
      { label: 'Postmaster', to: '/work/postmaster' },
      { label: 'Averno', to: '/play' },
      { label: 'All work', to: '/work' },
    ],
  },
  {
    title: 'About',
    size: 'large',
    entries: [
      { label: 'Experience', to: '/experience' },
      { label: 'Skills', to: '/skills' },
      { label: 'Notes', to: '/notes' },
      { label: 'Ask AI', to: '/ai' },
    ],
  },
  {
    title: 'Craft',
    size: 'large',
    entries: [
      { label: 'Lab', to: '/lab' },
      { label: 'Performance', to: '/performance' },
      { label: 'Design system', to: '/design' },
    ],
  },
  {
    title: 'Contact & legal',
    size: 'small',
    entries: [
      { label: 'Write a message', to: '/contact' },
      { label: EMAIL, href: `mailto:${EMAIL}` },
      { label: 'GitHub', href: 'https://github.com/alivault' },
      { label: 'LinkedIn', href: 'https://www.linkedin.com/in/webdevali/' },
      { label: 'Privacy', to: '/privacy' },
    ],
  },
]

const list: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.035, delayChildren: 0.05 } },
}

/** The lines of the index fade in one after the other, with no movement. */
const line: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { duration: DURATIONS.enter, ease: EASE_OUT },
  },
}

const linkStyle = 'hud-fill'

/**
 * The index of the site, over the world: every page in groups, in the HUD
 * face. A link closes the index, and the camera flies to the page.
 */
export default function SiteIndex() {
  const open = useWorld((s) => s.indexOpen)
  const visited = useWorld((s) => s.visited.length)
  const panel = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const opener = document.activeElement as HTMLElement | null
    panel.current?.querySelector<HTMLElement>('a')?.focus()
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      event.preventDefault()
      setWorld({ indexOpen: false })
    }
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('keydown', onKey)
      opener?.focus()
    }
  }, [open])

  const close = () => setWorld({ indexOpen: false })

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          key="index"
          ref={panel}
          role="dialog"
          aria-modal="true"
          aria-label="Index"
          data-hud
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{
            opacity: 0,
            transition: { duration: DURATIONS.exit, ease: EASE_IN },
          }}
          transition={{ duration: DURATIONS.enter, ease: EASE_OUT }}
          className="font-hud text-hud bg-ground/60 fixed inset-0 z-20 text-sm tracking-[0.42em] uppercase backdrop-blur-[20px]"
        >
          {/* The list scrolls inside, and fades out under the HUD. */}
          <div data-index-scroll className="scroll-fade h-full overflow-y-auto">
            <motion.nav
              aria-label="Index"
              initial="hidden"
              animate="show"
              variants={list}
              className="flex flex-col gap-16 px-6 pt-20 pb-40 sm:px-16"
            >
              {GROUPS.map((group) => (
                <section key={group.title}>
                  <motion.h2 variants={line} className="mb-5 text-xs">
                    {group.title}
                  </motion.h2>
                  <ul
                    className={cn(
                      'flex flex-col',
                      group.size === 'large' ? 'gap-4 text-lg' : 'gap-3',
                    )}
                  >
                    {group.entries.map((entry) => (
                      <motion.li key={entry.label} variants={line}>
                        {group.size === 'small' ? (
                          <span aria-hidden="true">→ </span>
                        ) : null}
                        <IndexLink entry={entry} onNavigate={close}>
                          {entry.label}
                        </IndexLink>
                      </motion.li>
                    ))}
                  </ul>
                </section>
              ))}
              <motion.p variants={line}>
                {visited} of {SHEETS.length} found in the world
              </motion.p>
            </motion.nav>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}

function IndexLink({
  entry,
  onNavigate,
  children,
}: {
  entry: Entry
  onNavigate: () => void
  children: ReactNode
}) {
  if ('href' in entry) {
    const external = entry.href.startsWith('http')
    return (
      <a
        href={entry.href}
        target={external ? '_blank' : undefined}
        rel={external ? 'noreferrer' : undefined}
        className={linkStyle}
      >
        {children}
      </a>
    )
  }
  return (
    <Link to={entry.to} onClick={onNavigate} className={linkStyle}>
      {children}
    </Link>
  )
}
