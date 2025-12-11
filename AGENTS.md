# Agent Instructions for aliabbas.dev

## Commands
- **Build**: `pnpm run build` or `vite build`
- **Dev**: `pnpm dev` or `vite`
- **Deploy**: `pnpm run build && wrangler deploy`
- **Lint**: `npx eslint src/` (fix with `--fix`)
- **Type check**: `npx tsc --noEmit`
- **No test framework configured**

## Code Style
- **TypeScript**: Strict mode enabled, no unused locals/parameters
- **Formatting**: Prettier with no semicolons, single quotes, trailing commas
- **Imports**: Sorted with React first, then local (~/*), then third-party
- **Components**: PascalCase, default exports, shadcn/ui "new-york" style
- **Styling**: Tailwind CSS with `cn()` utility for class merging
- **Icons**: Lucide React
- **Path aliases**: `~/*` → `./src/*`
- **Error handling**: TypeScript strict mode, no explicit patterns defined</content>
<parameter name="filePath">/Users/Ali/code/aliabbas.dev/AGENTS.md