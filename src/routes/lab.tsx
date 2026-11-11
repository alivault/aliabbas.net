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
import PageHeading from '~/components/PageHeading'
import ScrollReveal from '~/components/ScrollReveal'
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

const specimenLinks = specimens.map((specimen, index) => ({
  ...specimen,
  number: `${index + 1}.`,
}))

function LabPage() {
  return (
    <Main>
      <LabMotionProvider>
        <section className="bg-background text-foreground">
          <div className="py-section mx-auto max-w-[1600px] px-5 sm:px-8 lg:px-12">
            <ScrollReveal
              as="header"
              trigger="mount"
              className="grid justify-items-center gap-6 text-center"
            >
              <PageHeading>Every state, on purpose.</PageHeading>
              <p className="text-fg-muted max-w-xl text-base leading-7 text-pretty lg:text-lg lg:leading-8">
                The parts behind this site&apos;s chat. Force any state.
              </p>
            </ScrollReveal>

            <SectionNav
              label="Specimens"
              items={specimenLinks}
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
