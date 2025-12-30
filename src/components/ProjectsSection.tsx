import ProjectItem from './ProjectItem'
import Section from './Section'
import SectionHeading from './SectionHeading'

const projects = [
  {
    href: 'https://flooswise.com/',
    title: '💸 Flooswise',
    description:
      'Flooswise is a powerful and easy to use tool to help you manage your finances.',
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
