import { createElement } from 'react'
import type { ComponentProps } from 'react'
import { cn } from 'cn'

const metaTones = {
  muted: 'text-foreground/55',
  brand: 'text-brand',
} as const

type MetaTone = keyof typeof metaTones

/**
 * Style for metadata: dates, counts, field labels and captions. 14px, normal
 * case. Use it on elements that cannot render Meta, such as Link or FieldLabel.
 */
export function metaStyles(tone: MetaTone = 'muted') {
  return cn('text-sm leading-6', metaTones[tone])
}

type MetaElement = 'p' | 'span' | 'div' | 'time' | 'figcaption'

type MetaProps<T extends MetaElement> = {
  as?: T
  tone?: MetaTone
} & Omit<ComponentProps<T>, 'as'>

/** Metadata text. Not a label above a heading: put that in the heading. */
export default function Meta<T extends MetaElement = 'p'>({
  as,
  tone = 'muted',
  className,
  ...props
}: MetaProps<T>) {
  return createElement(as ?? 'p', {
    'data-slot': 'meta',
    className: cn(metaStyles(tone), className),
    ...props,
  })
}
