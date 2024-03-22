import Link from 'next/link'
import Logo from './Logo'

export default function Nav({}) {
  return (
    <nav className="mx-auto flex w-full flex-col items-start gap-5">
      <Link
        href="/"
        className="flex items-center gap-4 rounded-lg font-mono text-2xl font-bold"
      >
        <Logo className="w-10" />
        Ali Abbas
      </Link>
    </nav>
  )
}
