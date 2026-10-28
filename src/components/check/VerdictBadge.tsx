import {
  BadgeCheck,
  CircleMinus,
  CircleQuestionMark,
  CircleX,
  Contrast,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { VERDICT_INFO } from '~/lib/check/verdicts'
import type { Verdict } from '~/lib/check/verdicts'
import { cn } from '~/lib/utils'

export const VERDICT_STYLE: Record<
  Verdict,
  { icon: LucideIcon; text: string; ring: string; fill: string }
> = {
  verified: {
    icon: BadgeCheck,
    text: 'text-verified',
    ring: 'border-verified/40',
    fill: 'bg-verified/10',
  },
  partly_verified: {
    icon: Contrast,
    text: 'text-partial',
    ring: 'border-partial/45',
    fill: 'bg-partial/10',
  },
  not_supported: {
    icon: CircleMinus,
    text: 'text-foreground/70',
    ring: 'border-foreground/25',
    fill: 'bg-foreground/[0.04]',
  },
  contradicted: {
    icon: CircleX,
    text: 'text-contradicted',
    ring: 'border-contradicted/40',
    fill: 'bg-contradicted/10',
  },
  unknown: {
    icon: CircleQuestionMark,
    text: 'text-foreground/55',
    ring: 'border-foreground/20 border-dashed',
    fill: 'bg-transparent',
  },
}

/** A grade as an icon and a label. The label is real text, never color only. */
export default function VerdictBadge({
  className,
  size = 'sm',
  verdict,
}: {
  className?: string
  size?: 'sm' | 'lg'
  verdict: Verdict
}) {
  const style = VERDICT_STYLE[verdict]
  const Icon = style.icon
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center gap-1.5 rounded-full border font-semibold whitespace-nowrap',
        style.text,
        style.ring,
        style.fill,
        size === 'lg' ? 'h-10 px-4 text-base' : 'h-7 px-2.5 text-xs',
        className,
      )}
    >
      <Icon
        aria-hidden="true"
        className={size === 'lg' ? 'size-5' : 'size-3.5'}
        strokeWidth={2}
      />
      {VERDICT_INFO[verdict].label}
    </span>
  )
}
