import ProjectItem from '@/components/ProjectItem'
import Section from '@/components/Section'
import SectionHeading from '@/components/SectionHeading'

const portfolio = [
  {
    href: 'https://superverse.co/',
    title: 'SuperVerse',
    description:
      'Next.js, TypeScript, Tailwind CSS, Shadcn UI, Sanity CMS, GSAP Animations',
    image: '/superverse.svg',
  },
  {
    href: 'https://impostors.gg/',
    title: 'Impostors',
    description: 'motion.dev, Next.js, TypeScript, Tailwind CSS, Shadcn UI',
    image: '/impostors.png',
  },
]

export default function PortfolioSection() {
  return (
    <Section>
      <SectionHeading>Recent Work</SectionHeading>
      <ul className="flex flex-col">
        {portfolio.map((item, index) => (
          <ProjectItem key={index} {...item} />
        ))}
      </ul>
    </Section>
  )
}
