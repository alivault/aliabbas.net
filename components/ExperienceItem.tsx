interface WorkItemProps {
  title: string
  company: string
  url?: string
  date: string
  description: string
}

const WorkItem: React.FC<WorkItemProps> = ({
  title,
  company,
  url,
  date,
  description,
}) => {
  return (
    <li className="flex flex-col items-start gap-2 py-4">
      <span className="text-sm opacity-50">{date}</span>
      <span>{title}</span>
      {url ? (
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-start gap-1 text-sm hover:underline"
        >
          {company}
        </a>
      ) : (
        <span className="text-sm opacity-50">{company}</span>
      )}
      <p className="text-sm opacity-50">{description}</p>
    </li>
  )
}

export default WorkItem
