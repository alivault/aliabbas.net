import { createFileRoute } from '@tanstack/react-router'
import { pageHead } from '~/lib/structured-data'
import CitationDrawerSpecimen from '~/components/lab/CitationDrawerSpecimen'
import {
  LabMotionProvider,
  ReducedMotionSwitch,
} from '~/components/lab/lab-motion'
import ResizerSpecimen from '~/components/lab/ResizerSpecimen'
import StreamingSpecimen from '~/components/lab/StreamingSpecimen'
import TransitionSpecimen from '~/components/lab/TransitionSpecimen'
import Main from '~/components/Main'
import SectionNav from '~/components/SectionNav'

export const Route = createFileRoute('/lab')({
  head: () =>
    pageHead({
      title: 'Lab — Interface Primitives — Ali Abbas',
      description:
        'Live specimens of the parts behind this site’s chat: streaming, citations, a resizer and a move that keeps state.',
      path: '/lab',
    }),
  component: LabPage,
})

const specimens = [
  { id: 'streaming-list', label: 'Streaming answer' },
  { id: 'citation-drawer', label: 'Citation drawer' },
  { id: 'fluid-resizer', label: 'Fluid resizer' },
  { id: 'state-transition', label: 'A move that keeps state' },
] as const

function LabPage() {
  return (
    <Main overWorld hideFooter>
      <LabMotionProvider>
        <section data-hud className="text-foreground">
          <div className="mx-auto max-w-[1600px] px-6 pt-[14svh] pb-48 sm:px-16">
            <header>
              <h1 className="font-hud text-hud text-lg leading-[1.9] tracking-[0.42em] uppercase">
                Lab
              </h1>
              <p className="text-fg-secondary mt-6 max-w-[60ch] text-base leading-7">
                Every state, on purpose. The parts behind the chat of this site,
                each with its real code and a fake stream. Force any state.
              </p>
            </header>

            <SectionNav
              label="Specimens"
              items={specimens}
              trailing={<ReducedMotionSwitch />}
              className="mt-12"
            />

            <div className="mt-10 flex flex-col gap-20 lg:gap-32">
              <StreamingSpecimen />
              <CitationDrawerSpecimen />
              <ResizerSpecimen />
              <TransitionSpecimen />
            </div>
          </div>
        </section>
      </LabMotionProvider>
    </Main>
  )
}
