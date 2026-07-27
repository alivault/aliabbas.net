import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { ArrowUpRight, Menu, X } from 'lucide-react'
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from '~/components/ui/sheet'
import Logo from './Logo'

const navigation = [
  { label: 'Work', kind: 'anchor', href: '/#work' },
  { label: 'Capabilities', kind: 'anchor', href: '/#capabilities' },
  { label: 'Experience', kind: 'route', to: '/experience' as const },
  { label: 'Notes', kind: 'route', to: '/notes' as const },
] as const

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
            <Logo className="h-7 w-8 text-[#d9ff43] transition-transform duration-500 group-hover:-rotate-6" />
            <span className="text-sm font-semibold tracking-[-0.02em]">
              Ali Abbas
            </span>
          </Link>

          <nav className="hidden items-center gap-8 justify-self-center text-[12px] font-semibold text-white/55 lg:flex">
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

          <div className="flex items-center gap-3 justify-self-end">
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
            <SheetTrigger
              className="flex size-9 items-center justify-center rounded-full border border-white/15 text-white lg:hidden"
              aria-label={menuOpen ? 'Close navigation' : 'Open navigation'}
            >
              {menuOpen ? (
                <X className="size-4" />
              ) : (
                <Menu className="size-4" />
              )}
            </SheetTrigger>
          </div>
        </div>
      </header>

      <SheetContent
        side="top"
        showCloseButton={false}
        className="z-[90] h-dvh max-h-none gap-0 overflow-y-auto overscroll-contain border-0 bg-[#10100f] px-5 pt-28 pb-8 text-[#f1efe8] shadow-none data-[side=top]:h-dvh lg:hidden"
      >
        <SheetTitle className="sr-only">Site navigation</SheetTitle>
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
      </SheetContent>
    </Sheet>
  )
}
