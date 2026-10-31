import { useState } from 'react'
import { Link, useLocation } from '@tanstack/react-router'
import { ArrowUpRight } from 'lucide-react'
import { motion, useReducedMotion, useScroll, useTransform } from 'motion/react'
import type { Variants } from 'motion/react'
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from '~/components/ui/sheet'
import { cn } from '~/lib/utils'
import Logo from './Logo'
import Meta from './Meta'
import Title from './Title'
import { buttonVariants } from './ui/button'
import { DURATIONS, EASE_IN, EASE_OUT } from '~/lib/design/motion'

const navigation = [
  { label: 'Work', to: '/work' as const },
  { label: 'Skills', to: '/skills' as const },
  { label: 'Experience', to: '/experience' as const },
  { label: 'Lab', to: '/lab' as const },
  { label: 'Notes', to: '/notes' as const },
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
      duration: DURATIONS.reveal,
      ease: EASE_OUT,
    },
  },
  closed: {
    y: '110%',
    transition: {
      duration: DURATIONS.exit,
      ease: EASE_IN,
    },
  },
}

const mobileContactVariants: Variants = {
  open: {
    y: 0,
    transition: {
      duration: DURATIONS.reveal,
      ease: EASE_OUT,
    },
  },
  closed: {
    y: 'calc(100% + 2rem)',
    transition: {
      duration: DURATIONS.exit,
      ease: EASE_IN,
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
                  duration: DURATIONS.exit,
                  ease: EASE_OUT,
                }
              : {
                  duration: DURATIONS.exit,
                  ease: EASE_IN,
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
                      duration: DURATIONS.exit,
                      ease: EASE_OUT,
                    },
                  }
                : {
                    y: { delay: 0.25, duration: 0.1, ease: 'easeIn' },
                    rotate: {
                      duration: DURATIONS.exit,
                      ease: EASE_IN,
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
  // The claim checker is the second mode of Ask AI.
  const onCheck = useLocation({
    select: (location) => location.pathname.startsWith('/check'),
  })
  const { scrollY } = useScroll()
  const headerChromeOpacity = useTransform(scrollY, [0, 96], [0, 1])

  return (
    <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
      {/*
        The blur and border sit outside the header. During page transitions
        the header gets its own snapshot, but this layer stays in the page
        snapshot, so it moves out with the old page.
      */}
      <motion.div
        aria-hidden="true"
        className="site-header-chrome border-foreground/10 bg-background/80 pointer-events-none fixed inset-x-0 top-0 z-[100] h-[72px] border-b backdrop-blur-[12px] backdrop-saturate-[1.8]"
        style={{ opacity: headerChromeOpacity }}
      />
      <header className="site-header text-foreground fixed inset-x-0 top-0 z-[100] h-[72px]">
        <div className="relative mx-auto grid h-full max-w-[1600px] grid-cols-[1fr_auto] items-center px-5 sm:px-8 lg:grid-cols-[1fr_auto_1fr] lg:px-12">
          <Link
            to="/"
            className="group flex items-center gap-3 justify-self-start"
            aria-label="Ali Abbas — home"
          >
            <Logo className="text-foreground h-7 w-8" />
            <span className="text-sm font-semibold">Ali Abbas</span>
          </Link>

          <nav className="text-fg-muted hidden items-center gap-7 justify-self-center text-sm font-medium lg:flex">
            {navigation.map((item) => (
              <Link
                key={item.label}
                to={item.to}
                className={cn(
                  'hover:text-foreground transition-colors',
                  item.to === '/chat' && onCheck && 'text-foreground',
                )}
                activeProps={{ className: 'text-foreground' }}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-3 justify-self-end">
            <Link
              to="/contact"
              className={buttonVariants({
                variant: 'secondary',
                size: 'pill',
                className: 'hidden sm:inline-flex',
              })}
            >
              Contact <ArrowUpRight aria-hidden="true" className="size-4" />
            </Link>
            <SheetTrigger
              className={buttonVariants({
                variant: 'ghost',
                size: 'icon-pill',
                className: 'lg:hidden',
              })}
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
        overlayClassName="top-[72px] lg:hidden"
        viewportClassName="fixed inset-x-0 top-[72px] bottom-0 z-[90] overflow-hidden [transform:translateZ(0)] lg:hidden"
        className="bg-background/80 text-foreground z-[90] h-full max-h-none gap-0 overflow-y-auto overscroll-contain border-0 px-5 shadow-none backdrop-blur-[12px] backdrop-saturate-[1.8] duration-500 ease-[cubic-bezier(0.76,0,0.24,1)] data-ending-style:delay-300 data-[side=top]:h-full data-[side=top]:border-b-0 data-[side=top]:data-ending-style:translate-y-[-100%] data-[side=top]:data-starting-style:translate-y-[-100%] lg:hidden"
      >
        <SheetTitle className="sr-only">Site navigation</SheetTitle>
        <motion.div
          initial="closed"
          animate={menuOpen ? 'open' : 'closed'}
          variants={mobileMenuVariants}
          className="flex min-h-full flex-none flex-col"
        >
          <nav className="flex flex-col">
            {navigation.map((item, index) => (
              <div
                key={item.label}
                className="border-foreground/15 overflow-hidden border-b"
              >
                <motion.div variants={mobileLinkVariants}>
                  <Link
                    to={item.to}
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center justify-between py-4"
                  >
                    <Title as="span" variant="card">
                      {item.label}
                    </Title>
                    <Meta as="span" aria-hidden="true" className="tabular-nums">
                      0{index + 1}
                    </Meta>
                  </Link>
                </motion.div>
              </div>
            ))}
          </nav>
          <div className="mt-auto shrink-0 overflow-hidden py-8">
            <motion.div variants={mobileContactVariants}>
              <Link
                to="/contact"
                onClick={() => setMenuOpen(false)}
                className={buttonVariants({
                  size: 'pill-lg',
                  className: 'w-full justify-between',
                })}
              >
                Start a conversation{' '}
                <ArrowUpRight aria-hidden="true" className="size-4" />
              </Link>
            </motion.div>
          </div>
        </motion.div>
      </SheetContent>
    </Sheet>
  )
}
