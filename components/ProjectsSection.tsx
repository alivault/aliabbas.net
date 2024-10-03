import ProjectItem from '@/components/ProjectItem'
import Section from '@/components/Section'
import SectionHeading from '@/components/SectionHeading'

const projects = [
  {
    href: 'https://alivault.github.io/color-palette-maker/',
    title: '🎨 Color Palette Maker',
    description: 'Craft harmonious color palettes using the OKLCH colorspace.',
  },
  {
    href: 'https://cash-flow-monthly.vercel.app/',
    title: '💸 Cash Flow',
    description:
      'Evaluate your cash flow effortlessly with this simple calculator.',
  },
]

export default function ProjectsSection() {
  return (
    <Section>
      <SectionHeading>Projects</SectionHeading>
      <ul className="flex flex-col">
        {projects.map((project, index) => (
          <ProjectItem key={index} {...project} />
        ))}
      </ul>
    </Section>
  )
}
