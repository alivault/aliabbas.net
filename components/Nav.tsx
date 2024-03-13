import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'

export default function Nav({}) {
  return (
    <nav className="mx-auto flex w-full flex-col gap-5">
      <Link
        href="/"
        className="-mx-4 flex items-center gap-2 rounded-lg p-4 font-mono transition-colors hover:bg-foreground/10 active:bg-foreground/20"
      >
        <ChevronLeft />
        Ali Abbas
      </Link>
    </nav>
  )
}
