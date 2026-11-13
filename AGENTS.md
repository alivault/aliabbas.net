# Agent Instructions for aliabbas.net

The site is a 3D world (React Three Fiber) on TanStack Start, on a Cloudflare Worker. Each page floats in the world as an icon. A click flies the camera to the icon, and the page opens as a "reader": text on the left, the icon on the right. The site is dark only.

## Commands

- **Dev**: `vp dev`. Add `?gl=force` to a URL to draw the world in a browser without a GPU.
- **AI in dev**: `vp run dev:ai` starts a bridge to the AI (port 8790).
- **Check**: `vp check --fix` (format, lint and types)
- **Unit tests**: `vp test run`
- **End-to-end tests**: `vp run test:e2e`
- **Build**: `vp build`
- **Deploy**: a push to `master` deploys. Do not push unless the user asks.

## Where things are

- `src/components/world/`: the world. `World.tsx` (scene), `WorldShell.tsx` (connects the router and the camera), `Player.tsx` (camera and flights), `sheets.ts` (the pages and their icons), `store.ts` (state that the DOM shares), `Hud.tsx` (the four corners).
- `src/components/reader/`: the page layout. `Reader.tsx` has the parts (`ReaderTitle`, `ReaderText`, `ReaderSection`, `ReaderLink`, `ReaderFigure` and more). Build a new page from them.
- `src/lib/sound.ts`: the drone and the interface sounds. Give an element a sound with `data-sound`.
- `src/lib/orb.ts`: the orb of the chat page.

## Design

- Read `src/lib/design/rules.ts` before you change the interface. The rules are also on `/design`.
- Colors: use the tokens in `src/styles/globals.css` through their Tailwind names. Describe a new color in `COLOR_ROLES` in `src/lib/design/tokens.ts`; a unit test fails until you do.
- Motion: use `SPRINGS`, `EASE_OUT`, `EASE_IN` and `DURATIONS` from `src/lib/design/motion.ts`. A page enters only by the camera zoom and an opacity fade: no slides.
- HUD text: short labels in `font-hud`, spaced capitals, HUD orange (`hudText` in `Reader.tsx`). Only inside `data-hud`.
- Text size: 12px (`text-xs`) is the smallest, for short labels only. Body text: sentence case, 16px (`text-base`); controls and hints 14px (`text-sm`). Mono only for code, paths and ids.
- Every link and button in the HUD style uses `hud-fill` for its hover and focus.

## Tests

- Add an end-to-end test for each new state or keyboard path. The AI is mocked in `e2e/fixtures.ts`.
- Tests run at 1440px. Tag a test `{ tag: '@mobile' }` when it depends on the phone layout; those also run at 390px.
- Set `CHROMIUM_PATH` to use a system Chromium.

## Workflow

- Run the checks, then commit each finished change. Put only the files of that change in the commit.

## Code style

- TypeScript strict. Components: PascalCase, default export.
- Imports: React first, then local (`~/*`), then third-party.
- UI: Tailwind with `cn()`, shadcn/ui on Base UI, Lucide icons, Motion (`motion/react`).
