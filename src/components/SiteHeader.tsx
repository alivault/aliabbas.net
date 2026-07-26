import { useEffect, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { ArrowUpRight, Menu, X } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import Logo from './Logo'

const navigation = [
  { label: 'Work', kind: 'anchor', href: '/#work' },
  { label: 'Capabilities', kind: 'anchor', href: '/#capabilities' },
  { label: 'Experience', kind: 'route', to: '/experience' as const },
  { label: 'Notes', kind: 'route', to: '/notes' as const },
] as const

export default function SiteHeader() {
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    if (!menuOpen) return

    const previousOverflow = document.body.style.overflow
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMenuOpen(false)
    }

    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', closeOnEscape)

    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', closeOnEscape)
    }
  }, [menuOpen])

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-[100] h-[72px] border-b border-white/10 bg-[#10100f]/90 text-[#f1efe8] backdrop-blur-xl">
        <div className="mx-auto flex h-full max-w-[1600px] items-center justify-between px-5 sm:px-8 lg:px-12">
          <Link
            to="/"
            className="group flex items-center gap-3"
            aria-label="Ali Abbas — home"
          >
            <Logo className="h-7 w-8 text-[#d9ff43] transition-transform duration-500 group-hover:-rotate-6" />
            <span className="text-sm font-semibold tracking-[-0.02em]">
              Ali Abbas
            </span>
          </Link>

          <nav className="hidden items-center gap-8 text-[12px] font-semibold text-white/55 lg:flex">
            {navigation.map((item) =>
              item.kind === 'route' ? (
                <Link
                  key={item.label}
                  to={item.to}
                  className="transition-colors hover:text-white"
                  activeProps={{ className: 'text-white' }}
                >
                  {item.label}
                </Link>
              ) : (
                <a
                  key={item.label}
                  href={item.href}
                  className="transition-colors hover:text-white"
                >
                  {item.label}
                </a>
              ),
            )}
          </nav>

          <div className="flex items-center gap-3">
            <span className="hidden items-center gap-2 text-[11px] font-medium text-white/50 sm:flex">
              <span className="size-1.5 rounded-full bg-[#d9ff43] shadow-[0_0_10px_#d9ff43]" />
              Open to opportunities
            </span>
            <Link
              to="/contact"
              className="hidden h-9 items-center gap-2 rounded-full bg-[#f1efe8] px-4 text-[11px] font-bold text-[#10100f] transition-colors hover:bg-[#d9ff43] sm:flex"
            >
              Let’s talk <ArrowUpRight className="size-3.5" />
            </Link>
            <button
              type="button"
              onClick={() => setMenuOpen((open) => !open)}
              className="flex size-9 items-center justify-center rounded-full border border-white/15 text-white lg:hidden"
              aria-label={menuOpen ? 'Close navigation' : 'Open navigation'}
              aria-expanded={menuOpen}
            >
              {menuOpen ? (
                <X className="size-4" />
              ) : (
                <Menu className="size-4" />
              )}
            </button>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-0 z-[90] flex flex-col bg-[#10100f] px-5 pt-28 pb-8 text-[#f1efe8] lg:hidden"
            role="dialog"
            aria-modal="true"
            aria-label="Site navigation"
          >
            <nav className="flex flex-col border-t border-white/15">
              {navigation.map((item, index) => {
                const content = (
                  <>
                    <span className="font-display text-5xl tracking-[-0.03em]">
                      {item.label}
                    </span>
                    <span className="font-mono text-[10px] text-white/30">
                      0{index + 1}
                    </span>
                  </>
                )

                return item.kind === 'route' ? (
                  <Link
                    key={item.label}
                    to={item.to}
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center justify-between border-b border-white/15 py-5"
                  >
                    {content}
                  </Link>
                ) : (
                  <a
                    key={item.label}
                    href={item.href}
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center justify-between border-b border-white/15 py-5"
                  >
                    {content}
                  </a>
                )
              })}
            </nav>
            <Link
              to="/contact"
              onClick={() => setMenuOpen(false)}
              className="mt-auto flex items-center justify-between rounded-full bg-[#d9ff43] px-6 py-4 text-sm font-bold text-[#10100f]"
            >
              Start a conversation <ArrowUpRight className="size-4" />
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
