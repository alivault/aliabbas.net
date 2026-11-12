import { useQuery } from '@tanstack/react-query'
import Footer from './Footer'
import HomeCapabilitiesSection from './home/HomeCapabilitiesSection'
import { HomeHero } from './home/HomeHero'
import HomeNotesSection from './home/HomeNotesSection'
import SiteHeader from './SiteHeader'
import WorkSection from './WorkSection'
import { getRecentArticles } from '~/lib/sanity'

export default function HomeExperience() {
  const { data: articles = [] } = useQuery({
    queryKey: ['recentArticles'],
    queryFn: () => getRecentArticles(3),
  })
  // The has() variant gives <html> smooth scrolling, on this page only.
  return (
    <div className="bg-background text-foreground overflow-x-clip [html:has(&)]:scroll-smooth">
      <SiteHeader />
      <main>
        <div className="flex min-h-svh flex-col">
          <HomeHero />
        </div>
        <WorkSection />
        <HomeCapabilitiesSection />
        <HomeNotesSection articles={articles} />
      </main>
      <Footer />
    </div>
  )
}
