import type { ReactNode } from 'react'

interface SectionHeadingProps {
  children: ReactNode
}

export default function SectionHeading({ children }: SectionHeadingProps) {
  return <h2 className="font-display text-4xl tracking-tight">{children}</h2>
}
