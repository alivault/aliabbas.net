import { createFileRoute } from '@tanstack/react-router'
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
import { scrollToSection } from '~/lib/scroll-to-section'

export const Route = createFileRoute('/lab')({
  head: () => ({
    meta: [
      { title: 'Lab — Interface Primitives — Ali Abbas' },
      {
        name: 'description',
        content:
          'Live specimens of the interface primitives behind this site: a streamed answer with citations, a citation drawer, a fluid resizer and a move that keeps state.',
      },
    ],
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
    <Main>
      <LabMotionProvider>
        <section className="bg-background text-foreground">
          <div className="py-section mx-auto max-w-[1600px] px-5 sm:px-8 lg:px-12">
            <ScrollReveal
              as="header"
              trigger="mount"
              className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-end"
            >
              <PageHeading>
                Every state,
                <br />
                <em className="text-brand">on purpose.</em>
              </PageHeading>
              <p className="text-foreground/55 max-w-lg text-base leading-7 lg:justify-self-end lg:text-lg lg:leading-8">
                These are the parts behind the chat on this site, as live
                specimens. A local fake stream drives them. It makes no network
                calls and runs the same way each time. Use the controls to force
                each state.
              </p>
            </ScrollReveal>

            <div className="border-foreground/15 mt-12 flex flex-col gap-5 border-t pt-5 lg:flex-row lg:items-center lg:justify-between">
              <nav aria-label="Specimens">
                <ol className="flex flex-wrap gap-2">
                  {specimens.map((specimen, index) => (
                    <li key={specimen.id}>
                      <a
                        href={`#${specimen.id}`}
                        onClick={scrollToSection}
                        className="bg-foreground/5 hover:bg-foreground/10 focus-visible:ring-brand/70 inline-flex rounded-full px-4 py-2 text-sm font-medium transition-colors outline-none focus-visible:ring-2"
                      >
                        <span className="text-foreground/45 mr-1.5 tabular-nums">
                          {index + 1}.
                        </span>
                        {specimen.label}
                      </a>
                    </li>
                  ))}
                </ol>
              </nav>
              <ReducedMotionSwitch />
            </div>

            <div className="mt-12 flex flex-col gap-16 lg:gap-24">
              <StreamingSpecimen />
              <CitationDrawerSpecimen />
              <ResizerSpecimen />
              <TransitionSpecimen />
            </div>

            <p className="text-foreground/55 mt-16 max-w-2xl text-base leading-7">
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
