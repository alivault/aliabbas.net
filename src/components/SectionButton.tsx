import { Link } from '@tanstack/react-router'
import { ChevronsRight } from 'lucide-react'
import { Button } from './ui/button'
import type { ReactNode } from 'react'

interface SectionButtonProps {
  href: string
  children: ReactNode
}

export default function SectionButton({ href, children }: SectionButtonProps) {
  return (
    <Button
      asChild
      variant="ghost"
      className="-mx-4 justify-start rounded-lg px-4 py-8 text-left"
    >
      <Link to={href}>
        {children}
        <ChevronsRight size={20} className="opacity-50" />
      </Link>
    </Button>
  )
}

