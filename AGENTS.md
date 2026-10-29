# Agent Instructions for aliabbas.dev

## Commands

- **Build**: `vp build`
- **Dev**: `vp dev`
- **Deploy**: `vp run deploy`
- **Check**: `vp check` (fix with `vp check --fix`)
- **Type check**: `vp check --no-fmt --no-lint`

## Workflow

- Commit after each completed change, after running the relevant checks.
- Only include files related to the change in each commit.

## Design System

- Read the rules in `src/lib/design/rules.ts` before you change the interface. They are also on `/design` and in `/design/tokens.json`.
- Colors: use the tokens in `src/styles/globals.css` through their Tailwind names. Describe a new color in `COLOR_ROLES` in `src/lib/design/tokens.ts`; a unit test fails until you do.
- Motion: use `SPRINGS`, `EASE_OUT`, `EASE_IN` and `DURATIONS` from `src/lib/design/motion.ts`.
- Text: 14px (`text-sm`) is the smallest size. No CSS capitals, no eyebrow labels. Mono only for code, paths and ids.
- Headings: `Title`, `PageHeading` or `SectionHeading` (see `docs/typography.md`).

## Tests

- **Unit**: `vp test run` (files `src/**/*.test.ts`)
- **End-to-end**: `vp run test:e2e` (Playwright, 1440px and 390px, AI mocked in `e2e/fixtures.ts`). Set `CHROMIUM_PATH` to use a system Chromium.
- Add an end-to-end test for each new state or keyboard path.

## Code Style

- **TypeScript**: Strict mode enabled, no unused locals/parameters
- **Formatting and linting**: Vite+ with Oxfmt and Oxlint
- **Imports**: Sorted with React first, then local (`~/*`), then third-party
- **Components**: PascalCase, default exports, shadcn/ui `base-nova` style
- **Primitives**: Base UI for shadcn/ui components
- **Styling**: Tailwind CSS with `cn()` utility for class merging
- **Icons**: Lucide React
- **Animations**: Motion for React (`motion/react`)
- **Path aliases**: `~/*` → `./src/*`
- **Error handling**: TypeScript strict mode, no explicit patterns defined
