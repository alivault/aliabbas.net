import { Link } from '@tanstack/react-router'
import { ArrowUp, ArrowUpRight } from 'lucide-react'
import { buttonVariants } from './ui/button'

const links = [
  { label: 'Work', to: '/work' },
  { label: 'Lab', to: '/lab' },
  { label: 'Design', to: '/design' },
  { label: 'Notes', to: '/notes' },
  { label: 'Ask AI', to: '/chat' },
  { label: 'Skills', to: '/skills' },
  { label: 'Experience', to: '/experience' },
  { label: 'Play', to: '/play' },
  { label: 'Performance', to: '/performance' },
  { label: 'Privacy', to: '/privacy' },
] as const

const bigLink =
  'footer-link focus-visible:outline-foreground inline-flex items-center gap-2 py-0.5 focus-visible:outline-2 focus-visible:outline-offset-4'

function scrollToTop() {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' })
}

export default function Footer() {
  return (
    <footer className="site-footer scheme-inverted bg-background text-foreground relative">
      <div className="mx-auto flex max-w-[1600px] flex-col px-5 pt-24 pb-5 sm:px-8 sm:pt-28 sm:pb-6 lg:px-12 lg:pt-24">
        <div className="grid gap-10 xl:grid-cols-[1fr_auto] xl:items-end">
          <h2 className="text-[clamp(2.25rem,1.5rem+3.5vw,5rem)] leading-[1.05] font-normal text-balance">
            <span className="block text-balance">Hard problem, high bar?</span>{' '}
            <span className="block text-balance">That’s my favorite kind.</span>
          </h2>
          <Link
            to="/contact"
            className={buttonVariants({
              size: 'pill-lg',
              className: 'justify-self-start xl:justify-self-auto',
            })}
          >
            Start a conversation
            <ArrowUpRight aria-hidden="true" />
          </Link>
        </div>

        <div className="flex flex-col gap-8 pt-12 lg:flex-row lg:items-start lg:justify-between">
          <nav aria-label="Footer">
            <ul className="grid grid-flow-col grid-rows-5 gap-x-10 gap-y-1 text-[clamp(1.25rem,1rem+0.8vw,1.75rem)] leading-tight sm:grid-rows-3 sm:gap-x-14">
              {links.map((item) => (
                <li key={item.to}>
                  <Link to={item.to} className={bigLink}>
                    {item.label}
                  </Link>
                </li>
              ))}
              <li>
                <a
                  href="https://github.com/alivault"
                  target="_blank"
                  rel="noreferrer"
                  className={bigLink}
                >
                  GitHub
                  <ArrowUpRight
                    className="size-[0.8em] opacity-60"
                    aria-hidden="true"
                  />
                  <span className="sr-only">(opens in a new tab)</span>
                </a>
              </li>
            </ul>
          </nav>
          <button
            type="button"
            onClick={scrollToTop}
            className={buttonVariants({
              variant: 'secondary',
              size: 'pill',
              className: 'self-start',
            })}
          >
            Back to top
            <ArrowUp aria-hidden="true" />
          </button>
        </div>

        <div className="site-footer-wordmark-box mt-8 sm:mt-10">
          <Link
            to="/"
            aria-label="Ali Abbas — home"
            className="site-footer-wordmark focus-visible:outline-foreground block w-fit focus-visible:outline-2 focus-visible:outline-offset-4"
          >
            <span aria-hidden="true">Ali Abbas</span>
          </Link>
        </div>

        <div className="text-fg-muted border-border mt-4 flex flex-col gap-1 border-t pt-4 text-sm sm:flex-row sm:justify-between">
          <span>© {new Date().getFullYear()} Ali Abbas</span>
          <span>Designed and engineered with intent.</span>
        </div>
      </div>
    </footer>
  )
}
