import Section from '@/components/Section'
import SectionHeading from '@/components/SectionHeading'

export default function ProjectsSection({}) {
  return (
    <Section>
      <SectionHeading>Projects</SectionHeading>
      <ul className="flex flex-col gap-4">
        <li>
          <a
            href="https://alivault.github.io/color-palette-maker/"
            target="blank"
            rel="noopener noreferrer"
            className="-mx-4 flex flex-col gap-1 rounded-lg p-4 transition-colors hover:bg-foreground/10 active:bg-foreground/20"
          >
            Color Palette Maker
            <span className="text-xs opacity-50">
              Craft harmonius color palettes using the OKLCH colorspace.
            </span>
          </a>
        </li>
      </ul>
    </Section>
  )
}
