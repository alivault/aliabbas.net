import { useQuery } from '@tanstack/react-query'
import Footer from './Footer'
import ScrollReveal from './ScrollReveal'
import HomeAboutSection from './home/HomeAboutSection'
import HomeCapabilitiesSection from './home/HomeCapabilitiesSection'
import { HomeHero } from './home/HomeHero'
import HomeNotesSection from './home/HomeNotesSection'
import StackMarquee from './home/StackMarquee'
import HomeWorkSection from './home/HomeWorkSection'
import SiteHeader from './SiteHeader'
import { getRecentArticles } from '~/lib/sanity'

export default function HomeExperience() {
  const { data: articles = [] } = useQuery({
    queryKey: ['recentArticles'],
    queryFn: () => getRecentArticles(3),
  })
  return (
    <div className="home-page bg-background text-foreground overflow-x-hidden">
      <SiteHeader />
      <main>
        <div className="flex min-h-svh flex-col">
          <HomeHero />
        </div>
        <div id="stack-marquee" className="scroll-mt-[72px]">
          <ScrollReveal amount={0.4}>
            <StackMarquee />
          </ScrollReveal>
        </div>
        <HomeWorkSection />
        <HomeCapabilitiesSection />
        <HomeAboutSection />
        <HomeNotesSection articles={articles} />
      </main>
      <Footer />
    </div>
  )
}
