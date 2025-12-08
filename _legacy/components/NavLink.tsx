import Link from 'next/link'

interface Props {
  children: React.ReactNode
  href: string
}

const NavLink: React.FC<Props> = ({ children, href }) => {
  return (
    <Link
      href={href}
      className="-mx-4 rounded-lg p-4 transition-colors hover:bg-foreground/10 active:bg-foreground/20"
    >
      {children}
    </Link>
  )
}

export default NavLink
