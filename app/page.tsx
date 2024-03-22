import type { Metadata } from 'next'
import Link from 'next/link'
import ArticlesSection from '@/components/ArticleSection'
import ExperienceSection from '@/components/ExperienceSection'
import Logo from '@/components/Logo'
import Main from '@/components/Main'
import ProjectsSection from '@/components/ProjectsSection'
import Section from '@/components/Section'
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
        <Logo className="mb-4" />
        <h1 className="mb-2 font-mono text-3xl font-bold">Ali Abbas</h1>
        <p className="prose mb-4 max-w-none leading-relaxed dark:prose-invert">
          Designer and front-end developer currently working at Super Studios,
          Inc.
        </p>

        <div className="grid grid-cols-2 gap-2">
          <Button asChild>
            <Link href="/subscribe">Subscribe</Link>
          </Button>
          <Button asChild variant="secondary">
            <Link href="/contact">Contact</Link>
          </Button>
        </div>
      </section>
      <ArticlesSection />
      <ExperienceSection />
      <ProjectsSection />
    </Main>
  )
}
