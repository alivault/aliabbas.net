import ArticlesSection from '@/components/ArticlesSection'
import Avatar from '@/components/Avatar'
import WorkSection from '@/components/WorkSection'
import ProjectsSection from '@/components/ProjectsSection'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export const revalidate = 86400 // 24 hours

export default function Home() {
  return (
    <main className='flex flex-col gap-8'>
      <section className='flex flex-col gap-4'>
        <Avatar size='2xl' />
        <div className='flex flex-col'>
          <h1 className='text-3xl font-bold'>Ali Abbas</h1>
          <p className='opacity-50'>Designer. Developer. Team Player.</p>
        </div>
        <p>
          I'm a full-stack web developer based in Los Angeles. Welcome to my
          website where I share my thoughts on design, development, and life. If
          you have any questions or comments, feel free to reach out!
        </p>
        <div className='grid grid-cols-2 gap-2'>
          <Button asChild>
            <Link href='/subscribe'>Subscribe</Link>
          </Button>
          <Button asChild variant={'secondary'}>
            <Link href='/message'>Message</Link>
          </Button>
        </div>
      </section>
      <ArticlesSection />
      <ProjectsSection />
      <WorkSection />
    </main>
  )
}
