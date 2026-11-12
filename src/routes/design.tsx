import type { ReactNode } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import ColorTokens from '~/components/design/ColorTokens'
import ComponentStates from '~/components/design/ComponentStates'
import { RepoLink } from '~/components/design/DesignSection'
import MotionTokens from '~/components/design/MotionTokens'
import {
  Line,
  Reader,
  ReaderExternal,
  ReaderLink,
  ReaderSection,
  ReaderText,
  ReaderTitle,
  hudText,
} from '~/components/reader/Reader'
import { DESIGN_RULES } from '~/lib/design/rules'
import { FONTS, LAYOUT_TOKENS, TEXT_TONES } from '~/lib/design/tokens'
import { pageHead } from '~/lib/structured-data'
import { cn } from '~/lib/utils'

export const Route = createFileRoute('/design')({
  head: () =>
    pageHead({
      title: 'Design System — Ali Abbas',
      description:
        'The design system of this site: rules that tests check, color, type, space and motion tokens, and components in each state. Coding agents read the same tokens as JSON.',
      path: '/design',
    }),
  component: DesignPage,
})

/** A line in the HUD face, and the text that goes with it. */
function Entry({ label, children }: { label: ReactNode; children: ReactNode }) {
  return (
    <Line className="mt-8">
      <p className={hudText}>{label}</p>
      <div className="text-fg-secondary mt-1 max-w-[60ch] space-y-2 text-base leading-7">
        {children}
      </div>
    </Line>
  )
}

/** The source file of a section, on GitHub. */
function Source({ path }: { path: string }) {
  return (
    <Line className="mt-4">
      <RepoLink path={path} />
    </Line>
  )
}

const tableClass =
  'text-fg-secondary w-full min-w-[32rem] border-collapse text-left text-sm [&_td]:border-hud/20 [&_td]:border-t [&_td]:py-3 [&_td]:pr-4 [&_thead_th]:font-hud [&_thead_th]:text-hud [&_thead_th]:pb-3 [&_thead_th]:pr-4 [&_thead_th]:font-normal [&_thead_th]:tracking-[0.2em] [&_thead_th]:whitespace-nowrap [&_thead_th]:uppercase'

function DesignPage() {
  return (
    <Reader>
      <ReaderTitle>Design system</ReaderTitle>
      <ReaderText>
        One source, read by people and agents. This page reads the tokens from
        the CSS and the code, so it cannot show a value that the site does not
        use. Coding agents read the same tokens and rules as{' '}
        <ReaderExternal href="/design/tokens.json">JSON</ReaderExternal>.
      </ReaderText>

      <ReaderSection id="rules" title="1. Rules">
        <ReaderText>
          Each rule says what to do and why. Where a test checks the rule, the
          test is named. The other rules are checked in review.
        </ReaderText>
        <Source path="src/lib/design/rules.ts" />
        {DESIGN_RULES.map((rule, index) => (
          <Entry key={rule.id} label={`${index + 1}. ${rule.id}`}>
            <p>{rule.rule}</p>
            <p className="text-fg-muted text-sm leading-6">{rule.why}</p>
            {rule.checkedBy ? (
              <p className="text-fg-muted flex flex-wrap items-baseline gap-x-3 text-sm leading-6">
                <span>Checked by</span>
                {rule.checkedBy.split(', ').map((path) => (
                  <RepoLink key={path} path={path} />
                ))}
              </p>
            ) : null}
          </Entry>
        ))}
      </ReaderSection>

      <ReaderSection id="color" title="2. Color">
        <ReaderText>
          Colors are OKLCH custom properties. The site is dark only: the root
          gives every token its dark value. The world has its own tokens, for
          the HUD, the sky and the ground. A test checks the APCA contrast of
          the text tones.
        </ReaderText>
        <Source path="src/styles/globals.css" />
        <Line className="mt-8">
          <ColorTokens />
        </Line>
      </ReaderSection>

      <ReaderSection id="type" title="3. Type">
        <ReaderText>
          Two faces. A wide face in spaced capitals for everything short, and a
          plain face for everything long. 14px is the smallest size.
        </ReaderText>
        <Entry label={`${FONTS.hud.family} · HUD`}>
          <p>{FONTS.hud.use}</p>
          <p className="font-hud text-hud text-lg leading-[1.9] tracking-[0.42em] uppercase">
            On purpose
          </p>
          <p className={hudText}>A label, a list line or a link</p>
        </Entry>
        <Entry label={FONTS.sans.family}>
          <p>{FONTS.sans.use}</p>
          <p className="text-foreground">
            The answer streams in, and each claim links to its source.
          </p>
        </Entry>
        <Entry label={FONTS.mono.family}>
          <p>{FONTS.mono.use}</p>
          <p className="text-foreground font-mono text-sm">
            src/lib/design/tokens.ts
          </p>
        </Entry>
        {TEXT_TONES.map((tone) => (
          <Entry key={tone.name} label={`Tone · ${tone.name}`}>
            <p className={cn('text-base leading-7', tone.className)}>
              {tone.use}
            </p>
          </Entry>
        ))}
        <Source path="src/components/reader/Reader.tsx" />
      </ReaderSection>

      <ReaderSection id="space" title="4. Space and shape">
        <ReaderText>
          Spacing follows the Tailwind scale of 4px steps. Two tokens set the
          rhythm of sections in the old page layout, and they grow at the sm
          (40rem) and lg (64rem) breakpoints. Controls in the HUD style have
          square corners.
        </ReaderText>
        <Line className="mt-8 overflow-x-auto">
          <table className={tableClass}>
            <thead>
              <tr>
                <th scope="col">Token</th>
                <th scope="col">Phone</th>
                <th scope="col">From 40rem</th>
                <th scope="col">From 64rem</th>
              </tr>
            </thead>
            <tbody>
              {LAYOUT_TOKENS.map((token) => (
                <tr key={token.name} className="align-top">
                  <td>
                    <span className="text-foreground block font-mono">
                      --{token.name}
                    </span>
                    <span className="text-fg-muted block leading-6">
                      {token.use}
                    </span>
                  </td>
                  <td className="tabular-nums">{token.base}</td>
                  <td className="tabular-nums">{token.sm ?? '—'}</td>
                  <td className="tabular-nums">{token.lg ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Line>
      </ReaderSection>

      <ReaderSection id="motion" title="5. Motion">
        <ReaderText>
          In the world, the zoom of the camera to an icon is the movement into a
          page. Text only fades in, one line after the other. Springs for things
          that move, because a spring can stop and turn back with the pointer.
          Eases for things that fade. With reduced motion on, only opacity
          changes.
        </ReaderText>
        <Source path="src/lib/design/motion.ts" />
        <Line className="mt-8">
          <MotionTokens />
        </Line>
      </ReaderSection>

      <ReaderSection id="components" title="6. Components">
        <ReaderText>
          In the world, a control is text in the HUD face. On hover and on
          keyboard focus, the HUD color fills it from the bottom (hud-fill). Try
          these.
        </ReaderText>
        <Line className={cn(hudText, 'mt-8 flex flex-wrap gap-x-10 gap-y-3')}>
          <button type="button" className="hud-fill uppercase">
            A button
          </button>
          <ReaderLink to="/design" hash="components">
            A link
          </ReaderLink>
          <button
            type="button"
            disabled
            className="hud-fill uppercase opacity-50"
          >
            Disabled
          </button>
        </Line>
        <ReaderText>
          The old page layout (the lab and the claim checker) uses the shadcn/ui
          components below, in each state.
        </ReaderText>
        <Source path="src/components/ui" />
        <Line className="mt-8">
          <ComponentStates />
        </Line>
      </ReaderSection>

      <ReaderSection id="agents" title="7. For agents">
        <ReaderText>
          Coding agents work on this site. They read the same system as people
          do, from the files below, before they change the interface.
        </ReaderText>
        <Entry label="Tokens and rules as JSON">
          <p>
            Colors with their values and Tailwind names, type, space, motion and
            all rules. Built from the same modules as this page.
          </p>
          <p>
            <ReaderExternal href="/design/tokens.json">
              /design/tokens.json
            </ReaderExternal>
          </p>
        </Entry>
        <Entry label="Instructions">
          <p>
            The commands, the code style and a pointer to these rules. Agents
            read this file first.
          </p>
          <p>
            <RepoLink path="AGENTS.md" />
          </p>
        </Entry>
        <Entry label="Checks">
          <p>
            A unit test fails when a color in the CSS has no description, or a
            rule names a test that does not exist. The end-to-end tests check
            text sizes, focus and stream states.
          </p>
          <p>
            <RepoLink path="src/lib/design/tokens.test.ts" />
          </p>
        </Entry>
      </ReaderSection>
    </Reader>
  )
}
