import Link from 'next/link'
import { ChevronRight } from 'lucide-react'

interface SectionHeadingProps {
  children: React.ReactNode
  href?: string
}

export default function SectionHeading({
  children,
  href,
}: SectionHeadingProps) {
  return href ? (
    <Link
      href={href}
      className="-mx-4 flex items-center gap-2 rounded-lg px-4 py-3 transition-colors hover:bg-secondary active:bg-secondary/50"
    >
      <h2 className="font-mono text-lg font-bold">{children}</h2>
      <ChevronRight />
    </Link>
  ) : (
    <h2 className="-mx-4 px-4 py-3 font-mono text-lg font-bold ">{children}</h2>
  )
}
