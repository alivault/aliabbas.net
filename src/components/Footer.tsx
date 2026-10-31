import { Link, useLocation } from '@tanstack/react-router'
import { ArrowUpRight, MessageCircle } from 'lucide-react'
import Title from './Title'
import { buttonVariants } from './ui/button'

const linkGroups = [
  {
    label: 'Portfolio',
    links: [
      { label: 'Work', to: '/work' },
      { label: 'Skills', to: '/skills' },
      { label: 'Experience', to: '/experience' },
      { label: 'Notes', to: '/notes' },
    ],
  },
  {
    label: 'This site',
    links: [
      { label: 'Lab', to: '/lab' },
      { label: 'Design', to: '/design' },
      { label: 'Performance', to: '/performance' },
      { label: 'Play', to: '/play' },
      { label: 'Privacy', to: '/privacy' },
    ],
  },
  {
    label: 'Reach me',
    links: [
      { label: 'Contact', to: '/contact' },
      { label: 'Ask AI', to: '/chat' },
    ],
  },
] as const

const linkStyles =
  'text-fg-secondary hover:text-foreground focus-visible:outline-foreground inline-flex items-center gap-1 rounded-sm text-sm leading-6 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2'

/**
 * The end of each page: a closing call to action in the page title style,
 * with the two actions of the homepage hero, then a quiet footer in the
 * colors of the page. The contact page does not repeat the call to action.
 */
export default function Footer() {
  const onContact = useLocation({
    select: (location) => location.pathname === '/contact',
  })

  return (
    <>
      {!onContact && (
        <section
          aria-labelledby="closing-title"
          className="pb-section mx-auto max-w-[1600px] px-5 sm:px-8 lg:px-12"
        >
          <div className="border-border pt-section flex flex-col items-center border-t text-center">
            <Title
              as="h2"
              variant="page"
              id="closing-title"
              className="max-w-3xl"
            >
              Hard problem, high bar? That’s my favorite kind.
            </Title>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link
                to="/contact"
                className={buttonVariants({ size: 'pill-lg' })}
              >
                Contact
                <ArrowUpRight aria-hidden="true" />
              </Link>
              <Link
                to="/chat"
                className={buttonVariants({
                  variant: 'secondary',
                  size: 'pill-lg',
                })}
              >
                <MessageCircle aria-hidden="true" />
                Ask AI about me
              </Link>
            </div>
          </div>
        </section>
      )}

      <footer className="site-footer border-border border-t">
        <div className="mx-auto grid max-w-[1600px] gap-10 px-5 py-12 sm:px-8 lg:grid-cols-[1fr_auto] lg:gap-16 lg:px-12">
          <div className="max-w-sm">
            <Link
              to="/"
              className="text-foreground focus-visible:outline-foreground rounded-sm text-base font-semibold focus-visible:outline-2 focus-visible:outline-offset-2"
            >
              Ali Abbas
            </Link>
            <p className="text-fg-muted mt-2 text-sm leading-6">
              Senior frontend engineer for interactive and streaming interfaces.
            </p>
            <p className="text-fg-secondary mt-4 flex items-center gap-2 text-sm leading-6">
              <span
                aria-hidden="true"
                className="bg-verified size-2 shrink-0 rounded-full"
              />
              Open to senior frontend roles · US / Remote
            </p>
          </div>

          <nav
            aria-label="Footer"
            className="grid grid-cols-2 gap-x-12 gap-y-8 sm:grid-cols-3"
          >
            {linkGroups.map((group) => (
              <div key={group.label}>
                <h2 className="text-foreground text-sm leading-6 font-semibold">
                  {group.label}
                </h2>
                <ul className="mt-2 space-y-1">
                  {group.links.map((item) => (
                    <li key={item.to}>
                      <Link to={item.to} className={linkStyles}>
                        {item.label}
                      </Link>
                    </li>
                  ))}
                  {group.label === 'Reach me' && (
                    <li>
                      <a
                        href="https://github.com/alivault"
                        target="_blank"
                        rel="noreferrer"
                        className={linkStyles}
                      >
                        GitHub
                        <ArrowUpRight aria-hidden="true" className="size-3.5" />
                        <span className="sr-only">(opens in a new tab)</span>
                      </a>
                    </li>
                  )}
                </ul>
              </div>
            ))}
          </nav>
        </div>

        <div className="mx-auto max-w-[1600px] px-5 sm:px-8 lg:px-12">
          <div className="border-border text-fg-muted flex flex-col gap-1 border-t py-6 text-sm leading-6 sm:flex-row sm:justify-between">
            <span>© {new Date().getFullYear()} Ali Abbas</span>
            <span>Designed and engineered with intent.</span>
          </div>
        </div>
      </footer>
    </>
  )
}
