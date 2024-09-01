import Link from 'next/link'

interface ProjectItemProps {
  href: string
  title: string
  description: string
}

export default function ProjectItem({
  href,
  title,
  description,
}: ProjectItemProps) {
  return (
    <li>
      <Link
        href={href}
        target="blank"
        rel="noopener noreferrer"
        className="-mx-4 flex flex-col gap-1 rounded-lg p-4 transition-colors hover:bg-secondary active:bg-secondary/50"
      >
        {title}
        <span className="text-xs opacity-50">{description}</span>
      </Link>
    </li>
  )
}
