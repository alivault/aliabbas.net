import ProjectItem from '@/components/ProjectItem'
import Section from '@/components/Section'
import SectionHeading from '@/components/SectionHeading'

const projects = [
  {
    href: 'https://floos.aliabbas.dev/',
    title: '💸 Floos',
    description:
      'Floos is a simple and easy to use tool to help you manage your finances.',
  },
  {
    href: 'https://chromagine.aliabbas.dev/',
    title: '🎨 Chromagine',
    description: 'Craft harmonious color palettes using colorspace.',
  },
]

export default function ProjectsSection() {
  return (
    <Section>
      <SectionHeading>Personal Projects</SectionHeading>
      <ul className="flex flex-col">
        {projects.map((project, index) => (
          <ProjectItem key={index} {...project} />
        ))}
      </ul>
    </Section>
  )
}
