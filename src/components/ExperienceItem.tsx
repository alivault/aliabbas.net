interface ExperienceItemProps {
  title: string
  company: string
  url?: string
  date: string
  description: string
}

export default function ExperienceItem({
  title,
  company,
  url,
  date,
  description,
}: ExperienceItemProps) {
  return (
    <li className="flex flex-col items-start gap-2 py-4">
      <span className="opacity-50">{date}</span>
      <span className="text-lg font-medium">{title}</span>
      {url ? (
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="opacity-50 hover:underline"
        >
          {company}
        </a>
      ) : (
        <span className="opacity-50">{company}</span>
      )}
      <p className="prose max-w-none dark:prose-invert">{description}</p>
    </li>
  )
}

