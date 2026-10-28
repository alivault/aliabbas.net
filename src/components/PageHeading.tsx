import type { ComponentProps } from 'react'
import Title from '~/components/Title'
import { cn } from 'cn'

const pageVariants = {
  default: 'page',
  compact: 'card',
  hero: 'hero',
} as const

type PageHeadingProps = ComponentProps<'h1'> & {
  size?: keyof typeof pageVariants
}

export default function PageHeading({
  className,
  size = 'default',
  ...props
}: PageHeadingProps) {
  return (
    <Title
      as="h1"
      variant={pageVariants[size]}
      data-slot="page-heading"
      className={cn('max-w-5xl text-balance', className)}
      {...props}
    />
  )
}
