import { Suspense, lazy } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { ClientOnly } from '~/components/ClientOnly'

const StackTraceGame = lazy(() => import('~/components/game/StackTraceGame'))

export const Route = createFileRoute('/play')({
  head: () => ({
    meta: [
      { title: 'Stack Trace — Ali Abbas' },
      {
        name: 'description',
        content:
          'Follow the failure, find the root bug, and ship the build in a code-generated 3D labyrinth.',
      },
      { property: 'og:title', content: 'Stack Trace — Ali Abbas' },
      {
        property: 'og:description',
        content: 'A zero-gravity debugging mission through the product stack.',
      },
    ],
  }),
  component: PlayPage,
})

function GameFallback() {
  return (
    <main className="grid h-svh min-h-[320px] place-items-center bg-[#050608] p-5 text-[#f1efe8]">
      <div className="text-center">
        <span className="mx-auto block size-2 animate-pulse rounded-full bg-[#d9ff43] shadow-[0_0_18px_#d9ff43]" />
        <p className="mt-5 font-mono text-[9px] tracking-[0.2em] text-white/35 uppercase">
          Initializing Stack Trace
        </p>
      </div>
    </main>
  )
}

function PlayPage() {
  return (
    <ClientOnly fallback={<GameFallback />}>
      <Suspense fallback={<GameFallback />}>
        <StackTraceGame />
      </Suspense>
    </ClientOnly>
  )
}
