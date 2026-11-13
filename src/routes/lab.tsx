import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { AnimatePresence, motion } from 'motion/react'
import { pageHead } from '~/lib/structured-data'
import CitationDrawerSpecimen from '~/components/lab/CitationDrawerSpecimen'
import LabTabs from '~/components/lab/LabTabs'
import {
  LabMotionProvider,
  ReducedMotionSwitch,
} from '~/components/lab/lab-motion'
import ResizerSpecimen from '~/components/lab/ResizerSpecimen'
import { isSpecimenId, SPECIMENS } from '~/components/lab/specimens'
import type { SpecimenId } from '~/components/lab/specimens'
import StreamingSpecimen from '~/components/lab/StreamingSpecimen'
import TransitionSpecimen from '~/components/lab/TransitionSpecimen'
import Main from '~/components/Main'
import { Stagger, StaggerItem } from '~/components/reader/Reader'
import CubeHandle from '~/components/world/CubeHandle'
import { DURATIONS, EASE_OUT } from '~/lib/design/motion'

type LabSearch = { demo?: SpecimenId }

export const Route = createFileRoute('/lab')({
  validateSearch: (search: Record<string, unknown>): LabSearch =>
    isSpecimenId(search.demo) && search.demo !== SPECIMENS[0].id
      ? { demo: search.demo }
      : {},
  head: () =>
    pageHead({
      title: 'Lab — Interface Primitives — Ali Abbas',
      description:
        'Live specimens of the parts behind this site’s chat: streaming, citations, a resizer and a move that keeps state.',
      path: '/lab',
    }),
  component: LabPage,
})

const DEMOS: Record<SpecimenId, () => React.JSX.Element> = {
  'streaming-list': StreamingSpecimen,
  'citation-drawer': CitationDrawerSpecimen,
  'fluid-resizer': ResizerSpecimen,
  'state-transition': TransitionSpecimen,
}

function LabPage() {
  const { demo = SPECIMENS[0].id } = Route.useSearch()
  const navigate = useNavigate({ from: '/lab' })
  const Demo = DEMOS[demo]

  return (
    <Main overWorld hideFooter>
      <LabMotionProvider>
        <section data-hud className="text-foreground">
          {/* The page fades in line by line, as the readers do. */}
          <Stagger className="mx-auto max-w-[1440px] px-6 pt-[14svh] pb-48 sm:px-16">
            <header className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <StaggerItem className="flex items-center gap-6">
                  {/* The cube of the lab rests here (iconSlot.ts). A drag
                      on the square spins it. */}
                  <CubeHandle sheetId="lab" className="size-16 shrink-0" />
                  <h1 className="font-hud text-hud text-lg leading-[1.9] tracking-[0.42em] uppercase">
                    Lab
                  </h1>
                </StaggerItem>
                <StaggerItem>
                  <p className="text-fg-secondary mt-4 max-w-[52ch] text-base leading-7">
                    The parts behind the chat of this site, each with its real
                    code and a fake stream. Force any state.
                  </p>
                </StaggerItem>
              </div>
              <StaggerItem>
                <ReducedMotionSwitch />
              </StaggerItem>
            </header>

            <StaggerItem className="border-hud/20 mt-12 border-b pb-3">
              <LabTabs
                value={demo}
                onChange={(id) =>
                  void navigate({
                    search: id === SPECIMENS[0].id ? {} : { demo: id },
                    replace: true,
                    resetScroll: false,
                  })
                }
              />
            </StaggerItem>

            <StaggerItem>
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={demo}
                  className="mt-12"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{
                    opacity: 0,
                    transition: { duration: DURATIONS.exit },
                  }}
                  transition={{ duration: DURATIONS.enter, ease: EASE_OUT }}
                >
                  <Demo />
                </motion.div>
              </AnimatePresence>
            </StaggerItem>
          </Stagger>
        </section>
      </LabMotionProvider>
    </Main>
  )
}
