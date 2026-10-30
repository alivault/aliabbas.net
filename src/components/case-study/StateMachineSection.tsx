import { MermaidDiagram } from '~/components/MermaidDiagram'
import ScrollReveal from '~/components/ScrollReveal'
import Title from '~/components/Title'
import { toMermaid } from '~/data/case-studies'
import type { StateMachine } from '~/data/case-studies'
import EvidenceList from './EvidenceList'

export default function StateMachineSection({
  machine,
  index,
  evidenceBaseHref,
}: {
  machine: StateMachine
  index: number
  evidenceBaseHref?: string
}) {
  const labels = new Map(machine.states.map((state) => [state.id, state.label]))
  const label = (id: string) =>
    id === 'start' ? 'Start' : (labels.get(id) ?? id)
  const headingId = `${machine.id}-heading`

  return (
    <ScrollReveal className="border-foreground/15 border-t pt-10 sm:pt-12">
      <section aria-labelledby={headingId}>
        <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
          <Title
            as="h3"
            variant="card"
            id={headingId}
            className="max-w-sm text-balance"
          >
            <span className="text-brand tabular-nums">{index + 1}.</span>{' '}
            {machine.title}
          </Title>
          <p className="text-foreground/60 max-w-2xl text-base leading-7">
            {machine.intro}
          </p>
        </div>

        <MermaidDiagram
          value={{
            code: toMermaid(machine),
            caption: `${machine.title}: state diagram. The tables below list the same states and transitions.`,
          }}
        />

        <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
          <div className="min-w-0">
            <Title as="h4" variant="detail">
              States{' '}
              <span className="text-foreground/45 tabular-nums">
                ({machine.states.length})
              </span>
            </Title>
            <dl className="border-foreground/15 mt-4 border-t">
              {machine.states.map((state) => (
                <div
                  key={state.id}
                  className="border-foreground/15 grid gap-1 border-b py-4 sm:grid-cols-[9rem_1fr] sm:gap-6"
                >
                  <dt className="text-sm font-bold">{state.label}</dt>
                  <dd className="text-foreground/60 text-sm leading-6">
                    {state.meaning}
                  </dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="min-w-0">
            <Title as="h4" variant="detail">
              Transitions{' '}
              <span className="text-foreground/45 tabular-nums">
                ({machine.transitions.length})
              </span>
            </Title>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full border-collapse text-left text-sm">
                <caption className="sr-only">
                  Transitions of {machine.title.toLowerCase()}: the state
                  before, the event, and the state after.
                </caption>
                <thead>
                  <tr className="border-foreground/15 border-y">
                    <th
                      scope="col"
                      className="text-foreground/55 py-3 pr-4 text-sm font-semibold"
                    >
                      From
                    </th>
                    <th
                      scope="col"
                      className="text-foreground/55 py-3 pr-4 text-sm font-semibold"
                    >
                      Event
                    </th>
                    <th
                      scope="col"
                      className="text-foreground/55 py-3 text-sm font-semibold"
                    >
                      To
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {machine.transitions.map((transition) => (
                    <tr
                      key={`${transition.from}-${transition.to}-${transition.event}`}
                      className="border-foreground/15 border-b align-top"
                    >
                      <th
                        scope="row"
                        className="py-3 pr-4 font-bold sm:whitespace-nowrap"
                      >
                        {label(transition.from)}
                      </th>
                      <td className="text-foreground/60 py-3 pr-4 leading-6">
                        {transition.event}
                      </td>
                      <td className="py-3 font-bold sm:whitespace-nowrap">
                        {label(transition.to)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="mt-8">
          <Title as="h4" variant="detail">
            In the code
          </Title>
          <EvidenceList
            paths={machine.source}
            baseHref={evidenceBaseHref}
            className="mt-3"
          />
        </div>
      </section>
    </ScrollReveal>
  )
}
