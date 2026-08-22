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
      render={<Link to={href} />}
      variant="ghost"
      className="border-foreground/8 mt-4 h-10 justify-between rounded-full border px-4 text-left"
    >
      {children}
      <ChevronsRight size={16} className="opacity-40" />
    </Button>
  )
}
