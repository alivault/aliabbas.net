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
    <div className="min-h-svh overflow-x-hidden bg-[#f1efe8] text-[#151513]">
      <SiteHeader />
      <PageAnimation>
        <main className="min-h-[70svh] pt-[72px]">{children}</main>
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
