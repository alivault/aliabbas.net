import type { ReactNode } from 'react'

export default function PageHeading({ children }: { children: ReactNode }) {
  return (
    <h1 className="font-display max-w-5xl text-[clamp(4rem,10vw,9rem)] leading-[0.82] tracking-[-0.055em]">
      {children}
    </h1>
  )
}
