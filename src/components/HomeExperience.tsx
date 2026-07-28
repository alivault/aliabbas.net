import { useQuery } from '@tanstack/react-query'
import Footer from './Footer'
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
    <div className="home-page overflow-x-hidden bg-[#f1efe8] text-[#151513]">
      <SiteHeader />
      <main>
        <div className="flex min-h-svh flex-col">
          <HomeHero />
          <StackMarquee />
        </div>
        <HomeWorkSection />
        <HomeCapabilitiesSection />
        <StackMarquee />
        <HomeAboutSection currentRole={experiences[0]} />
        <HomeNotesSection articles={articles} />
      </main>
      <Footer />
    </div>
  )
}
