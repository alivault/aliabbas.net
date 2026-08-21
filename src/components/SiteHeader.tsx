import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { ArrowUpRight } from 'lucide-react'
import { motion, useReducedMotion } from 'motion/react'
import type { Variants } from 'motion/react'
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from '~/components/ui/sheet'
import Logo from './Logo'

const navigation = [
  { label: 'Work', to: '/work' as const },
  { label: 'Capabilities', to: '/capabilities' as const },
  { label: 'Experience', to: '/experience' as const },
  { label: 'Notes', to: '/notes' as const },
  { label: 'Play', to: '/play' as const },
  { label: 'Ask AI', to: '/chat' as const },
] as const

const mobileMenuVariants: Variants = {
  open: {
    transition: {
      delayChildren: 0.36,
      staggerChildren: 0.075,
    },
  },
  closed: {
    transition: {
      staggerChildren: 0.04,
      staggerDirection: -1,
    },
  },
}

const mobileLinkVariants: Variants = {
  open: {
    y: 0,
    transition: {
      duration: 0.68,
      ease: [0.22, 1, 0.36, 1],
    },
  },
  closed: {
    y: '110%',
    transition: {
      duration: 0.2,
      ease: [0.64, 0, 0.78, 0],
    },
  },
}

const mobileContactVariants: Variants = {
  open: {
    y: 0,
    transition: {
      duration: 0.68,
      ease: [0.22, 1, 0.36, 1],
    },
  },
  closed: {
    y: 'calc(100% + 2rem)',
    transition: {
      duration: 0.2,
      ease: [0.64, 0, 0.78, 0],
    },
  },
}

function SpinMenuIcon({ open }: { open: boolean }) {
  const reduceMotion = useReducedMotion()
  const instantTransition = { duration: 0 }

  return (
    <span aria-hidden="true" className="relative block h-[14px] w-[18px]">
      <motion.span
        animate={{ rotate: open ? 225 : 0 }}
        transition={
          reduceMotion
            ? instantTransition
            : open
              ? {
                  delay: 0.12,
                  duration: 0.22,
                  ease: [0.215, 0.61, 0.355, 1],
                }
              : {
                  duration: 0.22,
                  ease: [0.55, 0.055, 0.675, 0.19],
                }
        }
        className="absolute top-[6px] left-0 block h-[1.5px] w-full rounded-full bg-current"
      >
        <motion.span
          animate={{ y: open ? 5 : 0, opacity: open ? 0 : 1 }}
          transition={
            reduceMotion
              ? instantTransition
              : open
                ? {
                    y: { duration: 0.1, ease: 'easeOut' },
                    opacity: { delay: 0.12, duration: 0.1, ease: 'easeOut' },
                  }
                : {
                    y: { delay: 0.25, duration: 0.1, ease: 'easeIn' },
                    opacity: { duration: 0.1, ease: 'easeIn' },
                  }
          }
          className="absolute -top-[5px] left-0 block h-[1.5px] w-full rounded-full bg-current"
        />
        <motion.span
          animate={{ y: open ? -5 : 0, rotate: open ? -90 : 0 }}
          transition={
            reduceMotion
              ? instantTransition
              : open
                ? {
                    y: { duration: 0.1, ease: 'easeOut' },
                    rotate: {
                      delay: 0.12,
                      duration: 0.22,
                      ease: [0.215, 0.61, 0.355, 1],
                    },
                  }
                : {
                    y: { delay: 0.25, duration: 0.1, ease: 'easeIn' },
                    rotate: {
                      duration: 0.22,
                      ease: [0.55, 0.055, 0.675, 0.19],
                    },
                  }
          }
          className="absolute -bottom-[5px] left-0 block h-[1.5px] w-full rounded-full bg-current"
        />
      </motion.span>
    </span>
  )
}

export default function SiteHeader() {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
      <header className="fixed inset-x-0 top-0 z-[100] h-[72px] border-b border-white/10 bg-[#10100f]/90 text-[#f1efe8] backdrop-blur-xl">
        <div className="mx-auto grid h-full max-w-[1600px] grid-cols-[1fr_auto] items-center px-5 sm:px-8 lg:grid-cols-[1fr_auto_1fr] lg:px-12">
          <Link
            to="/"
            className="group flex items-center gap-3 justify-self-start"
            aria-label="Ali Abbas — home"
          >
            <Logo className="h-7 w-8 text-[#f1efe8]" />
            <span className="text-sm font-semibold tracking-[-0.02em]">
              Ali Abbas
            </span>
          </Link>

          <nav className="hidden items-center gap-8 justify-self-center text-[12px] font-semibold text-white/55 lg:flex">
            {navigation.map((item) => (
              <Link
                key={item.label}
                to={item.to}
                className="transition-colors hover:text-white"
                activeProps={{ className: 'text-white' }}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-3 justify-self-end">
            <Link
              to="/contact"
              className="hidden h-9 items-center gap-2 rounded-full bg-[#f1efe8] px-4 text-[11px] font-bold text-[#10100f] transition-colors hover:bg-[#d9ff43] sm:flex"
            >
              Let’s talk <ArrowUpRight className="size-3.5" />
            </Link>
            <SheetTrigger
              className="flex size-9 items-center justify-center rounded-full border border-white/15 text-white lg:hidden"
              aria-label={menuOpen ? 'Close navigation' : 'Open navigation'}
            >
              <SpinMenuIcon open={menuOpen} />
            </SheetTrigger>
          </div>
        </div>
      </header>

      <SheetContent
        side="top"
        showCloseButton={false}
        className="z-[90] h-dvh max-h-none gap-0 overflow-y-auto overscroll-contain border-0 bg-[#10100f] px-5 pt-28 pb-8 text-[#f1efe8] shadow-none duration-500 ease-[cubic-bezier(0.76,0,0.24,1)] data-ending-style:delay-300 data-[side=top]:h-dvh data-[side=top]:border-b-0 data-[side=top]:data-ending-style:translate-y-[-100%] data-[side=top]:data-starting-style:translate-y-[-100%] lg:hidden"
      >
        <SheetTitle className="sr-only">Site navigation</SheetTitle>
        <motion.div
          initial="closed"
          animate={menuOpen ? 'open' : 'closed'}
          variants={mobileMenuVariants}
          className="flex min-h-0 flex-1 flex-col"
        >
          <nav className="flex flex-col border-t border-white/15">
            {navigation.map((item, index) => (
              <div
                key={item.label}
                className="overflow-hidden border-b border-white/15"
              >
                <motion.div variants={mobileLinkVariants}>
                  <Link
                    to={item.to}
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center justify-between py-4"
                  >
                    <span className="font-display text-4xl tracking-[-0.03em]">
                      {item.label}
                    </span>
                    <span className="font-mono text-[10px] text-white/30">
                      0{index + 1}
                    </span>
                  </Link>
                </motion.div>
              </div>
            ))}
          </nav>
          <div className="mt-auto">
            <motion.div variants={mobileContactVariants}>
              <Link
                to="/contact"
                onClick={() => setMenuOpen(false)}
                className="flex items-center justify-between rounded-full bg-[#d9ff43] px-6 py-4 text-sm font-bold text-[#10100f]"
              >
                Start a conversation <ArrowUpRight className="size-4" />
              </Link>
            </motion.div>
          </div>
        </motion.div>
      </SheetContent>
    </Sheet>
  )
}
