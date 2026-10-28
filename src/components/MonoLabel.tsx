import { createElement } from 'react'
import type { ComponentProps } from 'react'
import { cn } from 'cn'

const monoLabelTones = {
  muted: 'text-foreground/40',
  brand: 'text-brand',
} as const

type MonoLabelTone = keyof typeof monoLabelTones

/** Shared style for small mono uppercase labels. Use it on elements that cannot render MonoLabel, such as Link or FieldLabel. */
export function monoLabelStyles(tone: MonoLabelTone = 'muted') {
  return cn('font-mono text-[11px] uppercase', monoLabelTones[tone])
}

type MonoLabelElement = 'p' | 'span' | 'div' | 'time' | 'figcaption'

type MonoLabelProps<T extends MonoLabelElement> = {
  as?: T
  tone?: MonoLabelTone
} & Omit<ComponentProps<T>, 'as'>

export default function MonoLabel<T extends MonoLabelElement = 'p'>({
  as,
  tone = 'muted',
  className,
  ...props
}: MonoLabelProps<T>) {
  return createElement(as ?? 'p', {
    'data-slot': 'mono-label',
    className: cn(monoLabelStyles(tone), className),
    ...props,
  })
}
