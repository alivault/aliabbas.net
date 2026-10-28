import { Link } from '@tanstack/react-router'
import { MessageSquareText, ScanSearch } from 'lucide-react'
import { cn } from '~/lib/utils'

const modes = [
  { to: '/chat' as const, label: 'Ask a question', icon: MessageSquareText },
  { to: '/check' as const, label: 'Check a claim', icon: ScanSearch },
]

/** Switch between the two ways to query Ali's record. Each mode is a page. */
export default function ModeSwitch({
  className,
  current,
}: {
  className?: string
  current: '/chat' | '/check'
}) {
  return (
    <nav
      aria-label="Assistant mode"
      className={cn(
        'border-foreground/15 inline-flex rounded-full border p-1',
        className,
      )}
    >
      {modes.map(({ to, label, icon: Icon }) => {
        const active = to === current
        return (
          <Link
            key={to}
            to={to}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'focus-visible:ring-brand/70 inline-flex h-8 items-center gap-2 rounded-full px-3.5 text-sm font-semibold transition-colors outline-none focus-visible:ring-2',
              active
                ? 'bg-foreground text-background'
                : 'text-foreground/55 hover:text-foreground',
            )}
          >
            <Icon aria-hidden="true" className="size-4" />
            {label}
          </Link>
        )
      })}
    </nav>
  )
}
