import type { Metadata } from 'next'
import Link from 'next/link'
import ArticlesSection from '@/components/ArticleSection'
import ExperienceSection from '@/components/ExperienceSection'
import Footer from '@/components/Footer'
import Logo from '@/components/Logo'
import Main from '@/components/Main'
import ProjectsSection from '@/components/ProjectsSection'
import { Button } from '@/components/ui/button'

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
      <section className="flex flex-col items-center text-center">
        <Logo className="mb-4 w-[64px]" />
        <h1 className="mb-2 font-mono text-3xl font-bold">Ali Abbas</h1>
        <p className="prose mb-4 max-w-none leading-relaxed dark:prose-invert">
          Front-end developer currently working at Super Studios, Inc.
        </p>
        <Button asChild variant="secondary" className="w-[110px]">
          <Link href="/contact">Contact</Link>
        </Button>
      </section>
      <ArticlesSection />
      <ProjectsSection />
      <ExperienceSection />
      <Footer />
    </Main>
  )
}
