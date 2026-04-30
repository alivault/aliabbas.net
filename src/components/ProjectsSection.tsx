import ProjectItem from './ProjectItem'
import Section from './Section'
import SectionHeading from './SectionHeading'

const projects = [
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
