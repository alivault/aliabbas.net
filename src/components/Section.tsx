import type { ReactNode } from 'react'

export default function Section({ children }: { children: ReactNode }) {
  return (
    <section className="flex flex-col border-b border-border px-5 py-5">
      {children}
    </section>
  )
}

