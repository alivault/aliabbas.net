import type { ReactNode } from 'react'

interface SectionHeadingProps {
  children: ReactNode
}

export default function SectionHeading({ children }: SectionHeadingProps) {
  return <h2 className="-mx-4 px-4 py-4 font-heading text-4xl">{children}</h2>
}

