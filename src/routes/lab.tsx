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
        'Live specimens of the interface primitives behind this site: a streamed answer with citations, a citation drawer, a fluid resizer and a move that keeps state.',
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
                These are the parts behind the chat on this site, as live
                specimens. A local fake stream drives them. It makes no network
                calls and runs the same way each time. Use the controls to force
                each state.
              </p>
            </ScrollReveal>

            <div className="border-foreground/15 mt-12 border-t" />
            <SectionNav
              label="Specimens"
              items={specimenLinks}
              trailing={<ReducedMotionSwitch />}
              className="mt-2"
            />

            <div className="mt-10 flex flex-col gap-20 lg:gap-32">
              <StreamingSpecimen />
              <CitationDrawerSpecimen />
              <ResizerSpecimen />
              <TransitionSpecimen />
            </div>

            <p className="text-fg-muted mt-16 max-w-2xl text-base leading-7">
              The demo answer and its sources describe the code of this
              site&apos;s chat. The text is fixed, and the timings are fixed in
              src/lib/lab/fake-stream.ts. The renderer, the citation filter and
              the state machine are the same code that runs the chat.
            </p>
          </div>
        </section>
      </LabMotionProvider>
    </Main>
  )
}
