import { Link } from '@tanstack/react-router'
import { ArrowRight } from 'lucide-react'
import { metaStyles } from '~/components/Meta'
import ScrollReveal from '~/components/ScrollReveal'
import Title from '~/components/Title'
import { cn } from 'cn'

const linkStyles = cn(
  metaStyles('brand'),
  'hover:text-foreground focus-visible:outline-foreground inline-flex min-h-6 items-center font-medium gap-1.5 transition-colors focus-visible:outline-2 focus-visible:outline-offset-4',
)

/** Smaller entries below the main work: projects made for fun, not for clients. */
export default function SideProjects() {
  return (
    <section
      aria-labelledby="side-projects"
      className="pb-section mx-auto max-w-[1600px] px-5 sm:px-8 lg:px-12"
    >
      <ScrollReveal className="border-foreground/15 border-t pt-10">
        <div className="grid gap-6 sm:grid-cols-[minmax(0,240px)_1fr] sm:items-center sm:gap-10">
          <Link
            to="/play"
            tabIndex={-1}
            aria-hidden="true"
            className="block overflow-hidden rounded-[2px] bg-black"
          >
            <img
              src="/play/averno-crucible-core.webp"
              alt=""
              width={1600}
              height={900}
              loading="lazy"
              className="aspect-video w-full object-cover transition-transform duration-500 hover:scale-[1.04]"
            />
          </Link>
          <div>
            <Title as="h2" variant="card" id="side-projects">
              Averno<span className="text-foreground/55">, a side project</span>
            </Title>
            <p className="text-foreground/60 mt-3 max-w-2xl text-base leading-7">
              A 3D shooter that runs in the browser on a computer or a phone.
              Three.js and React, light baked in a web worker, and one input
              model for keyboard, gamepad and touch.
            </p>
            <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2">
              <Link to="/play" className={linkStyles}>
                Play the game{' '}
                <ArrowRight aria-hidden="true" className="size-4" />
              </Link>
              <Link
                to="/notes/$slug"
                params={{
                  slug: 'averno-engineering-a-3d-shooter-for-the-browser',
                }}
                className={linkStyles}
              >
                How it’s built{' '}
                <ArrowRight aria-hidden="true" className="size-4" />
              </Link>
            </div>
          </div>
        </div>
      </ScrollReveal>
    </section>
  )
}
