import { useEffect, useState, type ComponentType } from 'react'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/admin')({
  component: RouteComponent,
})

function LoadingFallback() {
  return (
    <div className="flex h-screen items-center justify-center bg-neutral-950 text-white">
      Loading Sanity Studio...
    </div>
  )
}

function RouteComponent() {
  const [Studio, setStudio] = useState<ComponentType | null>(null)

  useEffect(() => {
    // Use a variable path to prevent static analysis
    const modulePath = './SanityStudio'
    import(/* @vite-ignore */ `~/components${modulePath.slice(1)}`).then(
      (mod) => {
        setStudio(() => mod.default)
      },
    )
  }, [])

  if (!Studio) {
    return <LoadingFallback />
  }

  return (
    <div className="h-screen max-h-dvh overscroll-none">
      <Studio />
    </div>
  )
}
