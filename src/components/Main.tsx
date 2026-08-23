import type { ReactNode } from 'react'
import Footer from './Footer'
import PageAnimation from './PageAnimation'
import SiteHeader from './SiteHeader'

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
    <div className="bg-background text-foreground min-h-svh overflow-x-hidden">
      <SiteHeader />
      <PageAnimation>
        <main className="min-h-[70svh] [&>:first-child]:border-t-[72px] [&>:first-child]:border-t-transparent">
          {children}
        </main>
      </PageAnimation>
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
