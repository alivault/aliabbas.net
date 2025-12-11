import ExperienceItem from './ExperienceItem'
import type { SanityExperience } from '~/lib/sanity'

interface ExperienceListProps {
  experiences: Array<SanityExperience>
}

export default function ExperienceList({ experiences }: ExperienceListProps) {
  return (
    <ul className="flex flex-col gap-4">
      {experiences.map((item) => (
        <ExperienceItem
          key={item._id}
          title={item.title}
          company={item.company}
          url={item.url}
          startDate={item.startDate}
          endDate={item.endDate}
          description={item.description}
        />
      ))}
    </ul>
  )
}
