import { PortableText } from '@portabletext/react'
import type {
  PortableTextBlock,
  PortableTextComponents,
} from '@portabletext/react'
import { createImageUrlBuilder } from '@sanity/image-url'
import { useQuery } from '@tanstack/react-query'
import { Link, createFileRoute } from '@tanstack/react-router'
import { ArrowLeft } from 'lucide-react'
import { CodeBlock } from '~/components/CodeBlock'
import { Comments } from '~/components/Comments'
import Main from '~/components/Main'
import { MermaidDiagram } from '~/components/MermaidDiagram'
import ScrollReveal from '~/components/ScrollReveal'
import getFormattedDate from '~/lib/getFormattedDate'
import { getArticleBySlug, sanityClient } from '~/lib/sanity'

const builder = createImageUrlBuilder(sanityClient)

const portableTextComponents: PortableTextComponents = {
  types: {
    code: CodeBlock,
    mermaidDiagram: MermaidDiagram,
    image: ({
      value,
    }: {
      value: { asset: { _ref: string }; alt?: string }
    }) => {
      const imageUrl = builder.image(value).url()
      return (
        <figure className="my-10">
          <img
            src={imageUrl}
            alt={value.alt || ''}
            className="w-full border border-black/10"
          />
          {value.alt && (
            <figcaption className="mt-3 font-mono text-[9px] tracking-[0.12em] text-black/40 uppercase">
              {value.alt}
            </figcaption>
          )}
        </figure>
      )
    },
  },
  marks: {
    code: ({ children }) => (
      <code className="bg-[#335cff]/10 px-1.5 py-0.5 font-mono text-sm text-[#18339f]">
        {children}
      </code>
    ),
  },
}

export const Route = createFileRoute('/notes_/$slug')({
  component: NotePage,
})

type NoteData = {
  _id: string
  title: string
  slug: { current: string }
  date: string
  description: string
  content: Array<PortableTextBlock>
}

function NotePage() {
  const { slug } = Route.useParams()
  const { data: note, isLoading } = useQuery({
    queryKey: ['article', slug],
    queryFn: () => getArticleBySlug(slug) as Promise<NoteData | null>,
  })

  if (isLoading) {
    return (
      <Main>
        <div className="mx-auto max-w-5xl px-5 py-16 sm:px-8 sm:py-24">
          <div className="h-96 animate-pulse bg-black/5" />
        </div>
      </Main>
    )
  }

  if (!note) {
    return (
      <Main>
        <section className="mx-auto flex min-h-[70svh] max-w-5xl flex-col items-center justify-center gap-5 px-5 text-center">
          <p className="font-mono text-[9px] tracking-[0.2em] text-[#335cff] uppercase">
            Missing note
          </p>
          <h1 className="font-display text-6xl tracking-[-0.04em]">
            Note not found.
          </h1>
          <Link
            to="/notes"
            className="text-xs font-bold uppercase hover:text-[#335cff]"
          >
            ← Back to notes
          </Link>
        </section>
      </Main>
    )
  }

  return (
    <Main>
      <article className="mx-auto max-w-[1440px] px-5 py-14 sm:px-8 sm:py-20 lg:px-12 lg:py-28">
        <Link
          to="/notes"
          className="mb-12 inline-flex items-center gap-2 font-mono text-[9px] tracking-[0.15em] text-black/45 uppercase transition-colors hover:text-[#335cff]"
        >
          <ArrowLeft className="size-4" /> Back to field notes
        </Link>
        <ScrollReveal
          as="header"
          className="mx-auto max-w-3xl border-b border-black/20 pb-12 sm:pb-16"
        >
          <time
            className="font-mono text-[9px] tracking-[0.18em] text-[#335cff] uppercase"
            dateTime={note.date}
          >
            {getFormattedDate(note.date)}
          </time>
          <h1 className="font-display mt-5 text-[clamp(4rem,6.5vw,6.5rem)] leading-[1.1] tracking-[-0.04em]">
            {note.title}
          </h1>
          {note.description && (
            <p className="mt-7 max-w-2xl text-base leading-7 text-black/50 sm:text-lg sm:leading-8">
              {note.description}
            </p>
          )}
        </ScrollReveal>
        <ScrollReveal
          trigger="mount"
          delay={0.2}
          className="prose prose-lg prose-neutral prose-headings:font-display prose-headings:tracking-[-0.03em] prose-a:text-[#335cff] prose-pre:p-0 mx-auto mt-12 max-w-3xl sm:mt-16"
        >
          <PortableText
            value={note.content}
            components={portableTextComponents}
          />
        </ScrollReveal>
      </article>
      <ScrollReveal className="mx-auto max-w-3xl px-5 pb-20 sm:px-8 sm:pb-28">
        <Comments articleSlug={slug} />
      </ScrollReveal>
    </Main>
  )
}
