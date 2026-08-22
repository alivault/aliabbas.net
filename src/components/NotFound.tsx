import { Link } from '@tanstack/react-router'
import { ArrowUpRight } from 'lucide-react'
import Main from './Main'

export function NotFound() {
  return (
    <Main>
      <section className="mx-auto flex min-h-[75svh] max-w-[1600px] flex-col justify-center px-5 py-20 sm:px-8 lg:px-12">
        <p className="text-brand font-mono text-[10px] tracking-[0.2em] uppercase">
          Error / 404
        </p>
        <h1 className="font-display mt-5 text-[clamp(7rem,22vw,20rem)] leading-[0.62] tracking-[-0.08em]">
          Lost?
        </h1>
        <div className="border-foreground/20 mt-12 flex flex-col gap-6 border-t pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-foreground/50 max-w-md text-sm leading-6">
            This page doesn’t exist, but the rest of the work is right where it
            should be.
          </p>
          <Link
            to="/"
            className="flex items-center gap-2 text-xs font-bold uppercase"
          >
            Return home <ArrowUpRight className="size-4" />
          </Link>
        </div>
      </section>
    </Main>
  )
}
