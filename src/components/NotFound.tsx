import { Link } from '@tanstack/react-router'
import { ArrowUpRight } from 'lucide-react'
import Main from './Main'
import PageHeading from './PageHeading'

export function NotFound() {
  return (
    <Main>
      <section className="py-section mx-auto flex min-h-[75svh] max-w-[1600px] flex-col justify-center px-5 sm:px-8 lg:px-12">
        <PageHeading>Lost?</PageHeading>
        <div className="border-foreground/20 mt-12 flex flex-col gap-6 border-t pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-fg-muted max-w-md text-base leading-7">
            Error 404: this page doesn’t exist, but the rest of the work is
            right where it should be.
          </p>
          <Link
            to="/"
            className="hover:text-brand flex items-center gap-2 text-base font-medium transition-colors"
          >
            Return home <ArrowUpRight aria-hidden="true" className="size-4" />
          </Link>
        </div>
      </section>
    </Main>
  )
}
