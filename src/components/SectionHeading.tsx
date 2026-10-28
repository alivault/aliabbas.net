import type { ComponentProps } from 'react'
import Title from '~/components/Title'
import { cn } from 'cn'

type SectionHeadingProps = ComponentProps<'h2'> & {
  size?: 'default' | 'compact'
}

export default function SectionHeading({
  className,
  size = 'default',
  ...props
}: SectionHeadingProps) {
  return (
    <Title
      as="h2"
      variant={size === 'compact' ? 'card' : 'section'}
      data-slot="section-heading"
      className={cn('text-balance', className)}
      {...props}
    />
  )
}
