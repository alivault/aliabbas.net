import type { ReactNode } from 'react'
import Footer from './Footer'
import PageAnimation from './PageAnimation'
import SiteHeader from './SiteHeader'

export default function Main({
  children,
  hideFooterOnMobile = false,
}: {
  children: ReactNode
  hideFooterOnMobile?: boolean
}) {
  return (
    <div className="bg-background text-foreground min-h-svh overflow-x-hidden">
      <SiteHeader />
      <PageAnimation>
        <main className="min-h-[70svh] [&>:first-child]:border-t-[72px] [&>:first-child]:border-t-transparent">
          {children}
        </main>
      </PageAnimation>
      {hideFooterOnMobile ? (
        <div className="hidden lg:block">
          <Footer />
        </div>
      ) : (
        <Footer />
      )}
    </div>
  )
}
