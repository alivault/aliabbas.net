/**
 * The design rules, for people and for coding agents. AGENTS.md points
 * here, and /design/tokens.json includes them. `checkedBy` names the test
 * or tool that fails when the rule is broken. A rule without it is checked
 * in review.
 */
export type DesignRule = {
  id: string
  rule: string
  why: string
  checkedBy?: string
}

export const DESIGN_RULES: Array<DesignRule> = [
  {
    id: 'tokens-only',
    rule: 'Use the color tokens (bg-background, text-fg-muted, border-border, text-brand). Do not write a color value in a component.',
    why: 'One edit to a token then changes the whole site, and the colors stay in one scheme.',
  },
  {
    id: 'text-size',
    rule: 'No text under 12px, and no capitals made with CSS. Use text-xs (12px) as the smallest size, for short labels only; text-sm (14px) for controls and hints. The one exception to the capitals is the HUD of the world (data-hud): spaced capitals in font-hud, at 12px, because the face is wide. Its fields stay at 14px.',
    why: 'Small capital labels are hard to read and add noise without meaning.',
    checkedBy: 'e2e/pages.spec.ts',
  },
  {
    id: 'no-eyebrows',
    rule: 'Do not put a small label above a heading. Put the meaning in the heading, or number the heading.',
    why: 'A label above a heading repeats it, and screen readers read it as a separate line.',
  },
  {
    id: 'mono-for-code',
    rule: 'Use the mono font only for code, file paths and ids, at 14px or more.',
    why: 'Mono marks text that a reader can copy into a terminal or an editor.',
  },
  {
    id: 'titles',
    rule: 'In a reader, make headings with ReaderTitle and ReaderSection (src/components/reader/Reader.tsx). In the old page layout, use Title, PageHeading or SectionHeading. Use className for layout only, not for size, weight or color. A title has one color: do not give some of its words or its number another shade.',
    why: 'One scale for each layout. To change a size, change the component. A second shade in a title makes one title read as two.',
  },
  {
    id: 'text-tones',
    rule: 'Show less important text with text-fg-secondary or text-fg-muted. Do not lower the opacity of text-foreground. Use text-fg-faint only for decoration and disabled text.',
    why: 'One opacity looks much dimmer on a dark background. Each tone has its own light and dark value, tested for APCA contrast in both schemes.',
    checkedBy: 'src/lib/design/tokens.test.ts',
  },
  {
    id: 'color-not-alone',
    rule: 'Never show a state with color alone. Add an icon and a text label.',
    why: 'WCAG 1.4.1. The claim checker grades each have an icon, a label and a color.',
  },
  {
    id: 'focus',
    rule: 'Every control shows focus: the focus ring, or the fill of hud-fill. When an overlay closes, focus goes back to the control that opened it.',
    why: 'Keyboard users must always know where they are.',
    checkedBy: 'e2e/lab.spec.ts',
  },
  {
    id: 'states',
    rule: 'A view that waits for the network has these states: idle, pending, streaming, complete, stopped and failed. Esc stops it, and the text that arrived stays.',
    why: 'A stream can be slow, stop or fail at any point. Each case needs a clear screen.',
    checkedBy: 'e2e/chat.spec.ts, e2e/check.spec.ts, e2e/lab.spec.ts',
  },
  {
    id: 'stale-events',
    rule: 'Every stream event carries the attempt it belongs to. A reducer ignores events from an attempt that is not active.',
    why: 'A stopped answer must not write into a new one.',
    checkedBy: 'src/lib/chat/chat-machine.test.ts',
  },
  {
    id: 'motion-tokens',
    rule: 'Animate with a spring, ease and duration from src/lib/design/motion.ts. Do not write new values in a component.',
    why: 'The same kind of change then moves the same way on every page.',
  },
  {
    id: 'hud-controls',
    rule: 'A link or button in the HUD style uses the hud-fill utility: the HUD color fills it from the bottom on hover and on keyboard focus, and the label turns dark. Do not add another hover style to it.',
    why: 'Every control in the world answers the same way, so a visitor learns it once.',
  },
  {
    id: 'one-movement',
    rule: 'In the world, the zoom of the camera to an icon is the only movement into a page. Text fades in, one line after the other, and does not slide.',
    why: 'Two movements at once fight for the eye. The zoom already says where the visitor goes.',
  },
  {
    id: 'reduced-motion',
    rule: 'Respect reduced motion. Motion does this through MotionConfig at the root. CSS animations need a prefers-reduced-motion block.',
    why: 'Large movement can make some people feel sick.',
  },
  {
    id: 'targets',
    rule: 'Make click and touch targets at least 24 by 24px. Buttons are 32px high.',
    why: 'WCAG 2.5.8. Small targets are hard to hit on a phone.',
  },
  {
    id: 'buttons',
    rule: 'Buttons have four variants (primary, secondary, ghost, destructive) and four sizes (md, lg, icon, icon-lg), all round. Use at most one primary button in a view or group, with secondary next to it. Use destructive only to delete. A link that looks like a button is a ButtonLink or a ButtonAnchor, never a Button with a link in render.',
    why: 'Few buttons that look the same everywhere make the site read as one product. Button with a link in render gives the link role="button".',
    checkedBy: 'src/components/ui/button.test.ts',
  },
  {
    id: 'dividers',
    rule: 'Separate sections, and a heading from its content, with space (py-section, mb-section, pb-section-content), not with a line. Use a line only between the rows of a list or a table: put divide-y on the list, so there is no line above the first row or below the last. Lines use the default border color.',
    why: 'A line at every edge makes every edge equal, so the page reads as a stack of boxes. Space groups content, and a line then means "more of the same".',
  },
  {
    id: 'components',
    rule: 'Build on the shadcn/ui base-nova components in src/components/ui, on Base UI. Merge classes with cn from the cn package. Use Lucide icons.',
    why: 'The primitives handle focus, keyboard and ARIA. Do not rebuild them.',
  },
]
