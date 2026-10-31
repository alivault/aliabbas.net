import { Link } from '@tanstack/react-router'
import { ArrowRight } from 'lucide-react'
import ScrollReveal from '~/components/ScrollReveal'
import Title from '~/components/Title'
import { ButtonLink } from '~/components/ui/button'

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
              Averno, a side project
            </Title>
            <p className="text-fg-muted mt-3 max-w-2xl text-base leading-7">
              A 3D shooter that runs in the browser on a computer or a phone.
              Three.js and React, light baked in a web worker, and one input
              model for keyboard, gamepad and touch.
            </p>
            {/* As in the work rows: the first action is the primary one. */}
            <div className="mt-6 flex flex-wrap gap-3">
              <ButtonLink to="/play">
                Play the game
                <ArrowRight aria-hidden="true" />
              </ButtonLink>
              <ButtonLink
                to="/notes/$slug"
                params={{
                  slug: 'averno-engineering-a-3d-shooter-for-the-browser',
                }}
                variant="secondary"
              >
                How it’s built
                <ArrowRight aria-hidden="true" />
              </ButtonLink>
            </div>
          </div>
        </div>
      </ScrollReveal>
    </section>
  )
}
