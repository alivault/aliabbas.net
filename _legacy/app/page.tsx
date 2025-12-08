import type { Metadata } from 'next'
import ArticlesSection from '@/components/ArticleSection'
import ExperienceSection from '@/components/ExperienceSection'
import HeroSection from '@/components/HeroSection'
import Main from '@/components/Main'
import PortfolioSection from '@/components/PortfolioSection'
import ProjectsSection from '@/components/ProjectsSection'

export const metadata: Metadata = {
  title: 'Ali Abbas',
  description: 'Designer and front-end developer.',
  openGraph: {
    title: 'Ali Abbas',
    description: 'Designer and front-end developer.',
    url: 'https://aliabbas.dev',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'Ali Abbas',
    description: 'Designer and front-end developer.',
  },
  other: {
    'darkreader-lock': 'true',
  },
}

export default function Home() {
  return (
    <Main>
      <HeroSection />
      <PortfolioSection />
      <ProjectsSection />
      <ArticlesSection />
      <ExperienceSection />
    </Main>
  )
}
