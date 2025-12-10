import { Link } from '@tanstack/react-router'
import GitHubIcon from './GitHubIcon'
import Logo from './Logo'

export default function Footer() {
  return (
    <footer className="flex items-center justify-center gap-8 p-5 pb-10">
      <Link
        to="/"
        className="flex items-center gap-4 rounded-lg font-heading text-2xl font-bold"
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

