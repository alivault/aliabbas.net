import { createFileRoute } from '@tanstack/react-router'
import ColorTokens from '~/components/design/ColorTokens'
import ComponentStates from '~/components/design/ComponentStates'
import DesignSection, { RepoLink } from '~/components/design/DesignSection'
import MotionTokens from '~/components/design/MotionTokens'
import Main from '~/components/Main'
import PageHeading from '~/components/PageHeading'
import ScrollReveal from '~/components/ScrollReveal'
import SectionNav from '~/components/SectionNav'
import Title from '~/components/Title'
import { DESIGN_RULES } from '~/lib/design/rules'
import {
  BODY_SCALE,
  FONTS,
  LAYOUT_TOKENS,
  TEXT_TONES,
  TYPE_SCALE,
} from '~/lib/design/tokens'
import { cn } from 'cn'

export const Route = createFileRoute('/design')({
  head: () => ({
    meta: [
      { title: 'Design System — Ali Abbas' },
      {
        name: 'description',
        content:
          'The design system of this site: rules that tests check, color, type, space and motion tokens, and components in each state. Coding agents read the same tokens as JSON.',
      },
    ],
  }),
  component: DesignPage,
})

const sections = [
  { id: 'rules', label: 'Rules' },
  { id: 'color', label: 'Color' },
  { id: 'type', label: 'Type' },
  { id: 'space', label: 'Space' },
  { id: 'motion', label: 'Motion' },
  { id: 'components', label: 'Components' },
  { id: 'agents', label: 'For agents' },
] as const

const sectionLinks = sections.map((section, index) => ({
  ...section,
  number: `${index + 1}.`,
}))

const number = (id: (typeof sections)[number]['id']) =>
  `${sections.findIndex((section) => section.id === id) + 1}.`

function DesignPage() {
  return (
    <Main>
      <section className="bg-background text-foreground">
        <div className="py-section mx-auto max-w-[1600px] px-5 sm:px-8 lg:px-12">
          <ScrollReveal as="header" trigger="mount" className="grid gap-6">
            <PageHeading>One source, read by people and agents.</PageHeading>
            <p className="text-fg-muted max-w-xl text-base leading-7 lg:text-lg lg:leading-8">
              The design system of this site. This page reads the tokens from
              the CSS and the code, so it cannot show a value that the site does
              not use. Coding agents read the same tokens and rules as{' '}
              <a
                href="/design/tokens.json"
                className="text-foreground hover:text-brand underline decoration-current/30 underline-offset-4 transition-colors"
              >
                JSON
              </a>
              .
            </p>
          </ScrollReveal>

          <div className="border-foreground/15 mt-12 border-t" />
          <SectionNav label="Sections" items={sectionLinks} className="mt-2" />

          <div className="mt-10 flex flex-col gap-20 lg:gap-32">
            <DesignSection
              id="rules"
              number={number('rules')}
              title="Rules"
              description={
                <>
                  <p>
                    Each rule says what to do and why. Where a test checks the
                    rule, the test is named. The other rules are checked in
                    review.
                  </p>
                  <p>
                    <RepoLink path="src/lib/design/rules.ts" />
                  </p>
                </>
              }
            >
              <ol className="border-foreground/10 border-t">
                {DESIGN_RULES.map((rule, index) => (
                  <li
                    key={rule.id}
                    className="border-foreground/10 grid gap-2 border-b py-5 sm:grid-cols-[2.5rem_minmax(0,1fr)]"
                  >
                    <span
                      aria-hidden="true"
                      className="text-brand text-base tabular-nums"
                    >
                      {index + 1}.
                    </span>
                    <div className="space-y-2">
                      <p className="text-foreground text-base leading-7">
                        {rule.rule}
                      </p>
                      <p className="text-fg-muted text-sm leading-6">
                        {rule.why}
                      </p>
                      {rule.checkedBy && (
                        <p className="text-fg-muted flex flex-wrap items-baseline gap-x-2 text-sm leading-6">
                          <span>Checked by</span>
                          {rule.checkedBy.split(', ').map((path) => (
                            <RepoLink key={path} path={path} />
                          ))}
                        </p>
                      )}
                    </div>
                  </li>
                ))}
              </ol>
            </DesignSection>

            <DesignSection
              id="color"
              number={number('color')}
              title="Color"
              description={
                <>
                  <p>
                    Colors are OKLCH custom properties. Dark mode changes the
                    values, not the names. Text colors have their own value in
                    each scheme, because one opacity looks much dimmer on a dark
                    background. A test checks their APCA contrast.
                  </p>
                  <p>
                    <RepoLink path="src/styles/globals.css" />
                  </p>
                </>
              }
            >
              <ColorTokens />
            </DesignSection>

            <DesignSection
              id="type"
              number={number('type')}
              title="Type"
              description={
                <>
                  <p>
                    {FONTS.sans.family} for all text, at weight 300 for page
                    titles and 400 for the other titles. {FONTS.mono.family} for
                    code, paths and ids only. The other title sizes are fluid
                    and scale with the reader’s font settings.
                  </p>
                  <p>
                    <RepoLink path="src/components/Title.tsx" />
                  </p>
                </>
              }
            >
              <div className="space-y-12">
                <ul className="border-foreground/10 border-t">
                  {TYPE_SCALE.map((step) => (
                    <li
                      key={step.variant}
                      className="border-foreground/10 grid gap-3 border-b py-6 sm:grid-cols-[12rem_minmax(0,1fr)] sm:items-baseline sm:gap-6"
                    >
                      <div>
                        <p className="text-foreground font-mono text-sm">
                          {step.variant}
                        </p>
                        <p className="text-fg-muted text-sm leading-6">
                          {step.role} · {step.size} · {step.lineHeight}
                        </p>
                      </div>
                      <Title as="p" variant={step.variant}>
                        On purpose
                      </Title>
                    </li>
                  ))}
                </ul>

                <div>
                  <h3 className="text-foreground text-base font-semibold">
                    Body
                  </h3>
                  <ul className="border-foreground/10 mt-4 border-t">
                    {BODY_SCALE.map((step) => (
                      <li
                        key={step.className}
                        className="border-foreground/10 grid gap-3 border-b py-5 sm:grid-cols-[12rem_minmax(0,1fr)] sm:items-baseline sm:gap-6"
                      >
                        <div>
                          <p className="text-foreground font-mono text-sm">
                            {step.className}
                          </p>
                          <p className="text-fg-muted text-sm leading-6">
                            {step.size} on {step.lineHeight}
                          </p>
                        </div>
                        <p className={cn('text-foreground', step.className)}>
                          {step.use} The answer streams in, and each claim links
                          to its source.
                        </p>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h3 className="text-foreground text-base font-semibold">
                    Tones
                  </h3>
                  <ul className="border-foreground/10 mt-4 border-t">
                    {TEXT_TONES.map((tone) => (
                      <li
                        key={tone.name}
                        className="border-foreground/10 grid gap-3 border-b py-5 sm:grid-cols-[12rem_minmax(0,1fr)] sm:items-baseline sm:gap-6"
                      >
                        <p className="text-foreground font-mono text-sm">
                          {tone.className}
                        </p>
                        <p
                          className={cn('text-base leading-7', tone.className)}
                        >
                          {tone.name}. {tone.use}
                        </p>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </DesignSection>

            <DesignSection
              id="space"
              number={number('space')}
              title="Space and shape"
              description={
                <p>
                  Spacing follows the Tailwind scale of 4px steps. Two tokens
                  set the rhythm of sections, and they grow at the sm (40rem)
                  and lg (64rem) breakpoints.
                </p>
              }
            >
              <div className="border-foreground/10 overflow-x-auto border-t">
                <table className="w-full min-w-[32rem] text-left text-sm">
                  <thead>
                    <tr className="text-fg-muted border-foreground/10 border-b">
                      <th scope="col" className="py-3 pr-4 font-normal">
                        Token
                      </th>
                      <th scope="col" className="py-3 pr-4 font-normal">
                        Phone
                      </th>
                      <th scope="col" className="py-3 pr-4 font-normal">
                        From 40rem
                      </th>
                      <th scope="col" className="py-3 font-normal">
                        From 64rem
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {LAYOUT_TOKENS.map((token) => (
                      <tr
                        key={token.name}
                        className="border-foreground/10 border-b align-top"
                      >
                        <th scope="row" className="py-4 pr-4 font-normal">
                          <span className="text-foreground block font-mono">
                            --{token.name}
                          </span>
                          <span className="text-fg-muted block leading-6">
                            {token.use}
                          </span>
                        </th>
                        <td className="text-foreground py-4 pr-4 tabular-nums">
                          {token.base}
                        </td>
                        <td className="text-foreground py-4 pr-4 tabular-nums">
                          {token.sm ?? '—'}
                        </td>
                        <td className="text-foreground py-4 tabular-nums">
                          {token.lg ?? '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </DesignSection>

            <DesignSection
              id="motion"
              number={number('motion')}
              title="Motion"
              description={
                <>
                  <p>
                    Springs for things that move, because a spring can stop and
                    turn back with the pointer. Eases for things that fade. With
                    reduced motion on, the dots jump, and only opacity changes
                    on the rest of the site.
                  </p>
                  <p>
                    <RepoLink path="src/lib/design/motion.ts" />
                  </p>
                </>
              }
            >
              <MotionTokens />
            </DesignSection>

            <DesignSection
              id="components"
              number={number('components')}
              title="Components"
              description={
                <>
                  <p>
                    The real components, in each state. Hover and focus are
                    shown with the same classes that the states use.
                  </p>
                  <p>
                    <RepoLink path="src/components/ui" />
                  </p>
                </>
              }
            >
              <ComponentStates />
            </DesignSection>

            <DesignSection
              id="agents"
              number={number('agents')}
              title="For agents"
              description={
                <p>
                  Coding agents work on this site. They read the same system as
                  people do, from the files below, before they change the
                  interface.
                </p>
              }
            >
              <ol className="border-foreground/10 border-t">
                {[
                  {
                    title: 'Tokens and rules as JSON',
                    body: 'Colors with light and dark values and Tailwind names, type, space, motion and all rules. Built from the same modules as this page.',
                    link: (
                      <a
                        href="/design/tokens.json"
                        className="text-fg-secondary hover:text-brand font-mono text-sm underline decoration-current/30 underline-offset-4 transition-colors"
                      >
                        /design/tokens.json
                      </a>
                    ),
                  },
                  {
                    title: 'Instructions',
                    body: 'The commands, the code style and a pointer to these rules. Agents read this file first.',
                    link: <RepoLink path="AGENTS.md" />,
                  },
                  {
                    title: 'Checks',
                    body: 'A unit test fails when a color in the CSS has no description, or a rule names a test that does not exist. The end-to-end tests check text sizes, focus and stream states.',
                    link: <RepoLink path="src/lib/design/tokens.test.ts" />,
                  },
                ].map((item, index) => (
                  <li
                    key={item.title}
                    className="border-foreground/10 grid gap-2 border-b py-5 sm:grid-cols-[2.5rem_minmax(0,1fr)]"
                  >
                    <span
                      aria-hidden="true"
                      className="text-brand text-base tabular-nums"
                    >
                      {index + 1}.
                    </span>
                    <div className="space-y-2">
                      <h3 className="text-foreground text-base font-semibold">
                        {item.title}
                      </h3>
                      <p className="text-fg-muted text-base leading-7">
                        {item.body}
                      </p>
                      <p>{item.link}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </DesignSection>
          </div>
        </div>
      </section>
    </Main>
  )
}
