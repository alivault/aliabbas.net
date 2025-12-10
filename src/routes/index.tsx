import { createFileRoute } from '@tanstack/react-router'
import ArticlesSection from '~/components/ArticleSection'
import ExperienceSection from '~/components/ExperienceSection'
import HeroSection from '~/components/HeroSection'
import Main from '~/components/Main'
import PortfolioSection from '~/components/PortfolioSection'
import ProjectsSection from '~/components/ProjectsSection'

export const Route = createFileRoute('/')({
  head: () => ({
    meta: [
      { title: 'Ali Abbas' },
      { name: 'description', content: 'Designer and front-end developer.' },
      { property: 'og:title', content: 'Ali Abbas' },
      { property: 'og:description', content: 'Designer and front-end developer.' },
      { property: 'og:url', content: 'https://aliabbas.dev' },
      { property: 'og:type', content: 'website' },
      { name: 'twitter:card', content: 'summary' },
      { name: 'twitter:title', content: 'Ali Abbas' },
      { name: 'twitter:description', content: 'Designer and front-end developer.' },
    ],
  }),
  component: Home,
})

function Home() {
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

