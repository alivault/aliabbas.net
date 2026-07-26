import type { ReactNode } from 'react'

export default function Section({ children }: { children: ReactNode }) {
  return (
    <section className="mx-auto flex w-full max-w-[1440px] flex-col px-5 py-14 sm:px-8 sm:py-20 lg:px-12 lg:py-28">
      {children}
    </section>
  )
}
