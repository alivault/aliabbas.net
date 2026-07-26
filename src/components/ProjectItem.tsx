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
        className="flex flex-col gap-2 rounded-2xl border border-black/8 bg-white p-4 transition-all hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0"
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
          <span className="text-lg font-semibold">{title}</span>
        </div>
        <span className="text-sm leading-6 text-black/50">{description}</span>
      </a>
    </li>
  )
}
