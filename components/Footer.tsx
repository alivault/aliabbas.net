import Link from 'next/link'
import GitHubIcon from '@/components/GitHubIcon'
import Logo from './Logo'

export default function Footer() {
  return (
    <footer className="flex items-center justify-center gap-8">
      <Link
        href="/"
        className="flex items-center gap-4 rounded-lg font-mono text-2xl font-bold"
        title="Ali Abbas"
      >
        <Logo className="w-10" />
      </Link>
      <a
        href="https://github.com/alivault"
        target="_blank"
        aria-label="GitHub Icon"
        title="GitHub"
      >
        <GitHubIcon />
      </a>
    </footer>
  )
}
