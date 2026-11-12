import type { ReactNode } from 'react'
import Footer from './Footer'
import HeaderBlur from './HeaderBlur'

export default function Main({
  children,
  hideFooter = false,
  hideFooterOnMobile = false,
}: {
  children: ReactNode
  hideFooter?: boolean
  hideFooterOnMobile?: boolean
}) {
  return (
    <div className="bg-background text-foreground relative z-10 min-h-svh overflow-x-clip">
      {/* The HUD of the world is the navigation: no site header, only a
          blur behind the HUD. */}
      <HeaderBlur />
      <main className="min-h-[70svh] [&>:first-child]:border-t-[length:var(--header-height)] [&>:first-child]:border-t-transparent">
        {children}
      </main>
      {hideFooter ? null : hideFooterOnMobile ? (
        <div className="hidden lg:block">
          <Footer />
        </div>
      ) : (
        <Footer />
      )}
    </div>
  )
}
