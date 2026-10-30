import { createElement } from 'react'
import type { ComponentProps } from 'react'
import { cn } from 'cn'

const titleStyles = {
  // Tighter than the hero: at most widths this size is larger, and the same
  // ratio makes the line gap look loose.
  page: 'text-[clamp(2.75rem,2rem+4vw,5.5rem)] leading-[1.02]',
  section: 'text-[clamp(2rem,1.5rem+2vw,3.5rem)] leading-[1.15]',
  card: 'text-[clamp(1.5rem,1.25rem+1vw,2rem)] leading-[1.2]',
  subsection: 'text-[clamp(1.25rem,1.125rem+0.5vw,1.5rem)] leading-[1.3]',
  detail: 'text-lg leading-[1.4]',
  // Fit the animated hero's three-line composition on narrow screens.
  hero: 'text-[clamp(1.65rem,8.25vw,2.75rem)] leading-[1.08] sm:text-[clamp(2.75rem,5vw,5.5rem)]',
} as const

type TitleElement = 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'p' | 'span'

type TitleProps<T extends TitleElement> = {
  as?: T
  variant?: keyof typeof titleStyles
} & Omit<ComponentProps<T>, 'as' | 'variant'>

export default function Title<T extends TitleElement = 'h2'>({
  as,
  variant = 'section',
  className,
  ...props
}: TitleProps<T>) {
  return createElement(as ?? 'h2', {
    'data-slot': 'title',
    'data-variant': variant,
    className: cn(
      'font-sans font-normal wrap-break-word',
      titleStyles[variant],
      className,
    ),
    ...props,
  })
}
