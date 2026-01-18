import { Link } from '@tanstack/react-router'
import { Button } from './ui/button'

export function NotFound() {
  return (
    <main className="mx-auto flex min-h-[60vh] w-full max-w-2xl flex-col items-center justify-center gap-4 px-4">
      <h1 className="font-serif text-6xl">404</h1>
      <p className="text-muted-foreground">
        The page you're looking for doesn't exist.
      </p>
      <Link to="/">
        <Button>Go Home</Button>
      </Link>
    </main>
  )
}
