import { Link } from '@tanstack/react-router'
import { ArrowRight } from 'lucide-react'
import MonoLabel, { monoLabelStyles } from '~/components/MonoLabel'
import ScrollReveal from '~/components/ScrollReveal'
import { cn } from 'cn'

const linkStyles = cn(
  monoLabelStyles('brand'),
  'hover:text-foreground focus-visible:outline-foreground inline-flex min-h-6 items-center gap-1.5 transition-colors focus-visible:outline-2 focus-visible:outline-offset-4',
)

/** Smaller entries below the main work: projects made for fun, not for clients. */
export default function SideProjects() {
  return (
    <section
      aria-labelledby="side-projects"
      className="pb-section mx-auto max-w-[1600px] px-5 sm:px-8 lg:px-12"
    >
      <ScrollReveal className="border-foreground/15 border-t pt-10">
        <MonoLabel as="p" id="side-projects">
          Side project
        </MonoLabel>
        <div className="mt-6 grid gap-6 sm:grid-cols-[minmax(0,240px)_1fr] sm:items-center sm:gap-10">
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
            <h2 className="text-2xl font-semibold">Averno</h2>
            <p className="text-foreground/60 mt-2 max-w-2xl leading-7">
              A 3D shooter that runs in the browser on a computer or a phone.
              Three.js and React, light baked in a web worker, and one input
              model for keyboard, gamepad and touch.
            </p>
            <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2">
              <Link to="/play" className={linkStyles}>
                Play the game <ArrowRight className="size-3.5" />
              </Link>
              <Link
                to="/notes/$slug"
                params={{
                  slug: 'averno-engineering-a-3d-shooter-for-the-browser',
                }}
                className={linkStyles}
              >
                How it’s built <ArrowRight className="size-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </ScrollReveal>
    </section>
  )
}
