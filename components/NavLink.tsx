import Link from 'next/link'
import React from 'react'

interface Props {
  children: React.ReactNode
  href: string
}

const NavLink: React.FC<Props> = ({ children, href }) => {
  return (
    <Link href={href} className='text-link hover:underline'>
      {children}
    </Link>
  )
}

export default NavLink
