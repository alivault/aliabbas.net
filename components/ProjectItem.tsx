import Image from 'next/image'
import Link from 'next/link'

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
      <Link
        href={href}
        target="blank"
        rel="noopener noreferrer"
        className="-mx-4 flex flex-col gap-1 rounded-lg p-4 transition-colors hover:bg-foreground/10 active:bg-foreground/20"
      >
        <div className="flex items-center gap-3">
          {image && (
            <Image
              src={image}
              alt={title}
              width={24}
              height={24}
              className="flex-shrink-0"
            />
          )}
          <span className="text-lg font-medium">{title}</span>
        </div>
        <span className="prose dark:prose-invert">{description}</span>
      </Link>
    </li>
  )
}
