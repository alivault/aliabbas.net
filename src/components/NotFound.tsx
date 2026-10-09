import { Link } from '@tanstack/react-router'
import { ArrowUpRight } from 'lucide-react'
import Main from './Main'
import MonoLabel from './MonoLabel'
import PageHeading from './PageHeading'

export function NotFound() {
  return (
    <Main>
      <section className="py-section mx-auto flex min-h-[75svh] max-w-[1600px] flex-col justify-center px-5 sm:px-8 lg:px-12">
        <MonoLabel tone="brand">Error / 404</MonoLabel>
        <PageHeading className="mt-5">Lost?</PageHeading>
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
