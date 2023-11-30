import ArticlesSection from '@/components/ArticlesSection'
import Avatar from '@/components/Avatar'
import ExperienceSection from '@/components/ExperienceSection'
import ProjectsSection from '@/components/ProjectsSection'
import Section from '@/components/Section'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export const revalidate = 86400 // 24 hours

export default function Home() {
  return (
    <main className='flex flex-col gap-8'>
      <Section>
        <Avatar size='2xl' />
        <div className='flex flex-col'>
          <h1 className='text-3xl font-bold'>Ali Abbas</h1>
          <p className='opacity-50'>Designer. Developer. Team Player.</p>
        </div>
        <p>
          Hi there! I'm a web developer in Los Angeles with a passion for
          front-end development. This site showcases my journey and projects in
          design and development, highlighting my dedication to innovation and
          user-friendly solutions. Interested in collaborating or have
          questions? Feel free to reach out anytime!
        </p>
        <div className='grid grid-cols-2 gap-2'>
          <Button asChild>
            <Link href='/subscribe'>Subscribe</Link>
          </Button>
          <Button asChild variant={'secondary'}>
            <Link href='/message'>Message</Link>
          </Button>
        </div>
      </Section>
      <ArticlesSection />
      <ProjectsSection />
      <ExperienceSection />
    </main>
  )
}
