import Title from './Title'

interface ProjectItemProps {
  href: string
  title: string
  description: string
  image?: string
}

export default function ProjectItem({
  href,
  title,
  description,
  image,
}: ProjectItemProps) {
  return (
    <li>
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="border-border bg-card text-card-foreground flex flex-col gap-2 rounded-2xl border p-4 transition-all hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0"
      >
        <div className="flex items-center gap-3">
          {image && (
            <img
              src={image}
              alt={title}
              width={24}
              height={24}
              className="size-6 flex-shrink-0"
            />
          )}
          <Title as="span" variant="subsection">
            {title}
          </Title>
        </div>
        <span className="text-card-foreground/50 text-sm leading-6">
          {description}
        </span>
      </a>
    </li>
  )
}
