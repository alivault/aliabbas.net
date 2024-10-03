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
      className="-mx-4 flex items-center gap-2 rounded-lg px-4 py-3 transition-colors hover:bg-foreground/10 active:bg-foreground/20"
    >
      <h2 className="pb-1 font-heading text-4xl">{children}</h2>
      <ChevronRight />
    </Link>
  ) : (
    <h2 className="-mx-4 h-[68px] px-4 py-3 font-heading text-4xl">
      {children}
    </h2>
  )
}
