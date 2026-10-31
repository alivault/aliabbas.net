import { cn } from 'cn'

/**
 * A chip: a small rounded link or button in a row, such as the section
 * links and the example questions. 32px high on one line, as the pill
 * buttons. A long label wraps, and the chip grows. The active chip has a
 * light brand fill. The border takes 1px of the padding.
 */
export function chipStyles({
  active = false,
  className,
}: { active?: boolean; className?: string } = {}) {
  return cn(
    'focus-visible:ring-brand/70 inline-flex min-h-8 max-w-full items-center rounded-2xl border px-[13px] py-[5px] text-left text-sm leading-5 font-medium transition-colors outline-none focus-visible:ring-2 disabled:pointer-events-none disabled:opacity-50',
    active
      ? 'border-brand/25 bg-brand/10 text-brand'
      : 'border-border bg-card text-fg-secondary hover:text-foreground',
    className,
  )
}
