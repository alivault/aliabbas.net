import type { ReactNode } from 'react'

export default function PageHeading({ children }: { children: ReactNode }) {
  return <h1 className="mb-4 font-heading text-4xl">{children}</h1>
}

