import ExperienceItem from './ExperienceItem'
import type { SanityExperience } from '~/lib/sanity'

interface ExperienceListProps {
  experiences: Array<SanityExperience>
}

export default function ExperienceList({ experiences }: ExperienceListProps) {
  return (
    <ul>
      {experiences.map((item, index) => (
        <ExperienceItem
          key={item._id}
          index={index}
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
