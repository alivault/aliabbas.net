import { Link } from '@tanstack/react-router'
import Logo from './Logo'

export default function Nav() {
  return (
    <nav className="mx-auto flex w-full flex-col items-start gap-5 p-5 pt-10">
      <Link
        to="/"
        className="flex items-center gap-4 rounded-lg font-heading text-2xl"
      >
        <Logo className="w-10" />
        Ali Abbas
      </Link>
    </nav>
  )
}

