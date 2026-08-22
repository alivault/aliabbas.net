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
import { getRecentArticles, getRecentExperiences } from '~/lib/sanity'

export default function HomeExperience() {
  const { data: articles = [] } = useQuery({
    queryKey: ['recentArticles'],
    queryFn: () => getRecentArticles(3),
  })
  const { data: experiences = [] } = useQuery({
    queryKey: ['recentExperiences'],
    queryFn: () => getRecentExperiences(1),
  })

  return (
    <div className="home-page bg-background text-foreground overflow-x-hidden">
      <SiteHeader />
      <main>
        <div className="flex min-h-svh flex-col">
          <HomeHero />
        </div>
        <ScrollReveal amount={0.4}>
          <StackMarquee />
        </ScrollReveal>
        <HomeWorkSection />
        <HomeCapabilitiesSection />
        <HomeAboutSection currentRole={experiences[0]} />
        <HomeNotesSection articles={articles} />
      </main>
      <Footer />
    </div>
  )
}
