import type { ReactNode } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import Main from '~/components/Main'
import PageHeading from '~/components/PageHeading'
import VitalsPanel from '~/components/performance/VitalsPanel'
import ScrollReveal from '~/components/ScrollReveal'
import Title from '~/components/Title'
import { avernoFix, lcpFix, liveLighthouse } from '~/data/performance-lab'
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
  number,
  title,
}: {
  children?: ReactNode
  description: ReactNode
  id: string
  number: number
  title: string
}) {
  return (
    <ScrollReveal
      as="section"
      className="border-foreground/15 pt-section-divider mt-section-content border-t"
    >
      <div>
        <Title as="h2" id={id} variant="subsection" className="max-w-xl">
          <span className="tabular-nums">{number}.</span> {title}
        </Title>
        <div className="text-fg-muted mt-4 max-w-2xl space-y-3 text-sm leading-6">
          {description}
        </div>
        {children && <div className="mt-8">{children}</div>}
      </div>
    </ScrollReveal>
  )
}

const tableClass =
  'w-full min-w-[640px] border-collapse text-left text-sm [&_td]:border-foreground/10 [&_td]:border-t [&_td]:py-3 [&_td]:pr-4 [&_th]:text-fg-muted [&_th]:pb-3 [&_th]:pr-4 [&_th]:text-sm [&_th]:font-medium'

function PerformancePage() {
  const summary = Route.useLoaderData()

  return (
    <Main>
      <section className="bg-background text-foreground">
        <div className="py-section mx-auto max-w-[1600px] px-5 sm:px-8 lg:px-12">
          <ScrollReveal as="header" className="grid gap-6">
            <PageHeading>Measured, not claimed.</PageHeading>
            <p className="text-fg-muted max-w-xl text-base leading-7 lg:text-lg lg:leading-8">
              Fast is a number. This page shows the Core Web Vitals of this site
              from real visits, lab numbers for my projects, and the fixes the
              numbers led to.
            </p>
          </ScrollReveal>

          <Section
            id="real-visits"
            number={1}
            title="Core Web Vitals of aliabbas.net, from real visits"
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
            number={2}
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
                      <td className="font-mono text-sm">{row.path}</td>
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
                      <td className="text-fg-muted tabular-nums">
                        {formatMetric('FCP', row.beforeFcpMs)} →{' '}
                        {formatMetric('FCP', row.afterFcpMs)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-fg-muted mt-4 max-w-2xl text-sm leading-6">
              Measured {lcpFix.measuredOn}. Both production builds ran in the
              local Workers runtime, which does not compress files, so all
              numbers are slower than live. Headless Chromium with real
              throttling: 150 ms latency, 1.6 Mbps, 4× slower CPU, a 412 × 823
              phone viewport, no cache. LCP and FCP come from the browser’s
              PerformanceObserver. Median of three loads per page.
            </p>
          </Section>

          <Section
            id="averno-fix"
            number={3}
            title="A browser game downloaded too much, every time"
            description={
              <>
                <p>
                  I measured{' '}
                  <a
                    href="/play"
                    className="underline decoration-current/30 underline-offset-2"
                  >
                    Averno
                  </a>
                  , my 3D browser game, and two problems stood out. The 3D
                  models were the largest part of the download, because they
                  were stored uncompressed and Cloudflare does not compress glTF
                  files. And every file had a fixed name, so the browser had to
                  ask the server about each one again on every visit.
                </p>
                <p>
                  The models now use meshopt compression. Positions stay exact;
                  normals move by 0.3° on average and 1.1° at most. When a model
                  loads, the game unpacks it back into the format that its code
                  expects. Screenshots of the same scene before and after differ
                  in fewer than 0.03% of pixels. Each model and texture now has
                  a content hash in its name, so the browser keeps it for a year
                  and asks for nothing on a repeat visit. The cost: 16 KB more
                  JavaScript for the decoder.
                </p>
              </>
            }
          >
            <div className="overflow-x-auto">
              <table className={tableClass}>
                <caption className="sr-only">
                  Averno download before and after the fix
                </caption>
                <thead>
                  <tr>
                    <th scope="col">What</th>
                    <th scope="col">Before</th>
                    <th scope="col">After</th>
                    <th scope="col">Change</th>
                  </tr>
                </thead>
                <tbody>
                  {avernoFix.results.map((row) => (
                    <tr key={row.label}>
                      <td>{row.label}</td>
                      <td className="tabular-nums">{row.before}</td>
                      <td className="tabular-nums">{row.after}</td>
                      <td className="font-semibold tabular-nums">
                        {row.change ?? '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-fg-muted mt-4 max-w-2xl text-sm leading-6">
              Measured {avernoFix.measuredOn}, on the live game, before and
              after the deploy. Headless Chromium, empty cache, bytes over the
              network, three runs per profile. The phone is an emulated touch
              device, which starts on medium quality. For the repeat visit, the
              old version ran in the local Workers runtime, which sends the same
              cache headers as Cloudflare. Frame rate is not measured: the test
              machine draws WebGL in software.
            </p>
          </Section>

          <Section
            id="lab"
            number={4}
            title="Lighthouse lab scores on the live sites"
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
                          <p className="text-fg-muted mt-1 max-w-sm text-sm leading-6">
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
                          <span className="text-fg-muted">Not shown</span>
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
            number={5}
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
