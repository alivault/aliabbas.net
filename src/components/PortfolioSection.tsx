import ProjectItem from './ProjectItem'
import Section from './Section'
import SectionHeading from './SectionHeading'

const portfolio = [
  {
    href: 'https://blackhole.xyz/',
    title: 'BlackHole',
    description: 'RainbowKit, Next.js, TypeScript, Tailwind CSS, Shadcn UI',
    image: '/blackhole.svg',
  },
  {
    href: 'https://superverse.co/',
    title: 'SuperVerse',
    description:
      'GSAP Animations, Sanity CMS, Next.js, TypeScript, Tailwind CSS, Shadcn UI',
    image: '/superverse.svg',
  },
  {
    href: 'https://impostors-3-preview.superfarm.workers.dev/',
    title: 'Impostors',
    description: 'motion.dev, Next.js, TypeScript, Tailwind CSS, Shadcn UI',
    image: '/impostors.svg',
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
