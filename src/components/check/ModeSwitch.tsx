import { Link } from '@tanstack/react-router'
import { MessageSquareText, ScanSearch } from 'lucide-react'
import { motion } from 'motion/react'
import { cn } from '~/lib/utils'
import { SPRINGS } from '~/lib/design/motion'

export type AssistantMode = 'chat' | 'check'

const modes = [
  {
    mode: 'chat' as const,
    to: '/chat' as const,
    label: 'Ask a question',
    icon: MessageSquareText,
  },
  {
    mode: 'check' as const,
    to: '/check' as const,
    label: 'Check a claim',
    icon: ScanSearch,
  },
]

/**
 * Switch between the two ways to query Ali's record. Each mode has its own
 * URL, but the layout stays, and the active pill slides to its tab.
 */
export default function ModeSwitch({
  claim,
  className,
  current,
}: {
  /** The last checked claim. The Check tab keeps it in its link. */
  claim?: string
  className?: string
  current: AssistantMode
}) {
  return (
    <nav
      aria-label="Assistant mode"
      className={cn(
        'border-border bg-card isolate inline-flex rounded-full border p-1',
        className,
      )}
    >
      {modes.map(({ mode, to, label, icon: Icon }) => {
        const active = mode === current
        return (
          <Link
            key={to}
            to={to}
            search={mode === 'check' && claim ? { claim } : {}}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'focus-visible:ring-brand/70 relative inline-flex h-8 items-center gap-2 rounded-full px-3.5 text-sm font-semibold transition-colors duration-300 outline-none focus-visible:ring-2',
              active ? 'text-brand' : 'text-fg-muted hover:text-foreground',
            )}
          >
            {active && (
              <motion.span
                layoutId="assistant-mode-pill"
                aria-hidden="true"
                className="border-brand/25 bg-brand/10 absolute inset-0 -z-10 rounded-full border"
                transition={SPRINGS.settle}
              />
            )}
            <Icon aria-hidden="true" className="size-4" />
            {label}
          </Link>
        )
      })}
    </nav>
  )
}
