import type { ReactNode } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import Main from '~/components/Main'
import MonoLabel from '~/components/MonoLabel'
import PageHeading from '~/components/PageHeading'
import VitalsPanel from '~/components/performance/VitalsPanel'
import ScrollReveal from '~/components/ScrollReveal'
import Title from '~/components/Title'
import { lcpFix, liveLighthouse } from '~/data/performance-lab'
import { formatMetric, rate } from '~/lib/vitals'
import type { MetricName } from '~/lib/vitals'
import { getVitalsSummary } from '~/lib/vitals-server'
import { cn } from '~/lib/utils'

export const Route = createFileRoute('/performance')({
  head: () => ({
    meta: [
      { title: 'Performance — Ali Abbas' },
      {
        name: 'description',
        content:
          'Core Web Vitals of aliabbas.net from real visits, lab numbers for Ali’s projects, and how he measured them.',
      },
    ],
  }),
  loader: () => getVitalsSummary(),
  component: PerformancePage,
})

const RATING_TEXT = {
  good: 'text-verified',
  'needs-improvement': 'text-partial',
  poor: 'text-contradicted',
} as const

function Value({ name, value }: { name: MetricName; value: number }) {
  return (
    <span className={cn('tabular-nums', RATING_TEXT[rate(name, value)])}>
      {formatMetric(name, value)}
    </span>
  )
}

function Section({
  children,
  description,
  id,
  label,
  title,
}: {
  children?: ReactNode
  description: ReactNode
  id: string
  label: string
  title: string
}) {
  return (
    <ScrollReveal
      as="section"
      className="border-foreground/15 pt-section-divider mt-section-content border-t"
    >
      <div>
        <MonoLabel tone="brand">{label}</MonoLabel>
        <Title as="h2" id={id} variant="subsection" className="mt-4 max-w-xl">
          {title}
        </Title>
        <div className="text-foreground/55 mt-4 max-w-2xl space-y-3 text-sm leading-6">
          {description}
        </div>
        {children && <div className="mt-8">{children}</div>}
      </div>
    </ScrollReveal>
  )
}

const tableClass =
  'w-full min-w-[640px] border-collapse text-left text-sm [&_td]:border-foreground/10 [&_td]:border-t [&_td]:py-3 [&_td]:pr-4 [&_th]:text-foreground/45 [&_th]:pb-3 [&_th]:pr-4 [&_th]:text-xs [&_th]:font-semibold'

function PerformancePage() {
  const summary = Route.useLoaderData()

  return (
    <Main>
      <section className="bg-background text-foreground">
        <div className="py-section mx-auto max-w-[1600px] px-5 sm:px-8 lg:px-12">
          <ScrollReveal
            as="header"
            className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-end"
          >
            <PageHeading>
              Measured,
              <br />
              <span className="text-brand">not claimed.</span>
            </PageHeading>
            <p className="text-foreground/55 max-w-lg text-base leading-7 lg:justify-self-end lg:text-lg lg:leading-8">
              Fast is a number. This page shows the Core Web Vitals of this site
              from real visits, lab numbers for my projects, and the fix the
              numbers led to.
            </p>
          </ScrollReveal>

          <Section
            id="real-visits"
            label="Real visits"
            title="Core Web Vitals of aliabbas.net"
            description={
              <>
                <p>
                  Each page load in production reports its metrics once, when
                  the tab is hidden. The number is the 75th percentile (p75), as
                  Google uses: three of four visits are this fast or faster.
                  Colors use Google’s thresholds.
                </p>
              </>
            }
          >
            <VitalsPanel summary={summary} />
          </Section>

          <Section
            id="lcp-fix"
            label="What the numbers changed"
            title="The page waited for JavaScript to show itself"
            description={
              <>
                <p>
                  Lighthouse showed a long delay between the first paint and the
                  largest paint. The cause: the entrance animations ran in
                  JavaScript. The server sent each page at opacity 0, so the
                  heading stayed hidden until the scripts loaded and hydrated.
                </p>
                <p>
                  The fix moves the entrances to CSS. The server now sends the
                  page visible, and the animation starts with the first paint.
                  Content below the fold still reveals on scroll: the browser
                  hides it before its first paint, while it is off screen. I
                  also self-host the mono font, so no stylesheet from another
                  origin blocks the first paint.
                </p>
              </>
            }
          >
            <div className="overflow-x-auto">
              <table className={tableClass}>
                <caption className="sr-only">
                  Largest Contentful Paint before and after the fix
                </caption>
                <thead>
                  <tr>
                    <th scope="col">Page</th>
                    <th scope="col">LCP before</th>
                    <th scope="col">LCP after</th>
                    <th scope="col">Change</th>
                    <th scope="col">FCP before → after</th>
                  </tr>
                </thead>
                <tbody>
                  {lcpFix.results.map((row) => (
                    <tr key={row.path}>
                      <td className="font-mono text-xs">{row.path}</td>
                      <td>
                        <Value name="LCP" value={row.beforeLcpMs} />
                      </td>
                      <td>
                        <Value name="LCP" value={row.afterLcpMs} />
                      </td>
                      <td className="font-semibold tabular-nums">
                        −
                        {Math.round(
                          (1 - row.afterLcpMs / row.beforeLcpMs) * 100,
                        )}
                        %
                      </td>
                      <td className="text-foreground/55 tabular-nums">
                        {formatMetric('FCP', row.beforeFcpMs)} →{' '}
                        {formatMetric('FCP', row.afterFcpMs)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-foreground/40 mt-4 max-w-2xl text-xs leading-5">
              Measured {lcpFix.measuredOn}. Both production builds ran in the
              local Workers runtime, which does not compress files, so all
              numbers are slower than live. Headless Chromium with real
              throttling: 150 ms latency, 1.6 Mbps, 4× slower CPU, a 412 × 823
              phone viewport, no cache. LCP and FCP come from the browser’s
              PerformanceObserver. Median of three loads per page.
            </p>
          </Section>

          <Section
            id="lab"
            label="Lab"
            title="Lighthouse on the live sites"
            description={
              <p>
                The same test for this site and two of my projects: Lighthouse
                {liveLighthouse.tool.replace('Lighthouse', '')}, on{' '}
                {liveLighthouse.measuredOn}. For this site, “before” rows ran
                before the fix shipped and “after” rows ran after it, on the
                same day.
              </p>
            }
          >
            <div className="overflow-x-auto">
              <table className={tableClass}>
                <caption className="sr-only">
                  Lighthouse lab results for the live sites
                </caption>
                <thead>
                  <tr>
                    <th scope="col">Site</th>
                    <th scope="col">Score</th>
                    <th scope="col">LCP</th>
                    <th scope="col">FCP</th>
                    <th scope="col">CLS</th>
                    <th scope="col">Blocking time</th>
                  </tr>
                </thead>
                <tbody>
                  {liveLighthouse.results.map((row) => (
                    <tr key={row.label} className="align-top">
                      <td>
                        <a
                          href={row.url}
                          target="_blank"
                          rel="noreferrer"
                          className="font-semibold underline decoration-current/30 underline-offset-2 hover:decoration-current"
                        >
                          {row.label}
                        </a>
                        {row.note && (
                          <p className="text-foreground/45 mt-1 max-w-sm text-xs leading-5">
                            {row.note}
                          </p>
                        )}
                      </td>
                      <td className="tabular-nums">{row.score}</td>
                      <td>
                        <Value name="LCP" value={row.lcpMs} />
                      </td>
                      <td>
                        <Value name="FCP" value={row.fcpMs} />
                      </td>
                      <td>
                        <Value name="CLS" value={row.cls} />
                      </td>
                      <td className="tabular-nums">
                        {row.tbtMs === null ? (
                          <span className="text-foreground/40">Not shown</span>
                        ) : (
                          `${row.tbtMs} ms`
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>

          <Section
            id="method"
            label="Method"
            title="How I measure"
            description={
              <ul className="list-disc space-y-2 pl-4">
                <li>
                  Real visits use Google’s web-vitals library. It loads when the
                  browser is idle, after the page, and sends one small request
                  when the tab is hidden. It never slows the page that it
                  measures.
                </li>
                <li>
                  The server stores the metric, its value, the route (for
                  example /notes/$slug, never the full URL), and mobile or
                  desktop. It stores no IP address and no browser details, and
                  deletes rows after 90 days. See the{' '}
                  <a
                    href="/privacy"
                    className="underline decoration-current/30 underline-offset-2"
                  >
                    privacy page
                  </a>
                  .
                </li>
                <li>
                  The server rates each value itself, with Google’s thresholds,
                  and rejects values that cannot be real. The page shows a p75
                  only from 20 samples, because with fewer samples one slow
                  visit moves the number too much.
                </li>
                <li>
                  Lab numbers are the median of three runs. A single run can be
                  off by hundreds of milliseconds.
                </li>
              </ul>
            }
          />
        </div>
      </section>
    </Main>
  )
}
