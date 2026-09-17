import type { ReactNode } from 'react'

export default function Section({ children }: { children: ReactNode }) {
  return (
    <section className="py-section mx-auto flex w-full max-w-[1440px] flex-col px-5 sm:px-8 lg:px-12">
      {children}
    </section>
  )
}
