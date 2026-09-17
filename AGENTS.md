# Agent Instructions for aliabbas.dev

## Commands

- **Build**: `vp build`
- **Dev**: `vp dev`
- **Deploy**: `vp run deploy`
- **Check**: `vp check` (fix with `vp check --fix`)
- **Type check**: `vp check --no-fmt --no-lint`
- **No test framework configured**

## Workflow

- Commit after each completed change, after running the relevant checks.
- Only include files related to the change in each commit.

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
