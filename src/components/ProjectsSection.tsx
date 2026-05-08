import ProjectItem from './ProjectItem'
import Section from './Section'
import SectionHeading from './SectionHeading'

const projects = [
  {
    href: 'https://github.com/alivault/pico',
    title: 'Pico',
    description:
      'A local, keyboard-friendly browser workspace for Pi coding-agent sessions.',
    image: '/pico.svg',
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
