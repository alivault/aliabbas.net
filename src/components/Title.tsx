import { createElement } from 'react'
import type { ComponentProps } from 'react'
import { cn } from 'cn'

const titleStyles = {
  page: 'text-4xl font-light tracking-tight text-pretty lg:text-5xl',
  section: 'text-[clamp(2rem,1.5rem+2vw,3.5rem)] leading-[1.15]',
  card: 'text-[clamp(1.5rem,1.25rem+1vw,2rem)] leading-[1.2]',
  subsection: 'text-[clamp(1.25rem,1.125rem+0.5vw,1.5rem)] leading-[1.3]',
  detail: 'text-lg leading-[1.4]',
  // The size and weight of the page title, in three set lines.
  hero: 'text-4xl font-light tracking-tight lg:text-5xl',
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
