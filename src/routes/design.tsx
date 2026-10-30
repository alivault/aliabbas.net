import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/design')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/design"!</div>
}
