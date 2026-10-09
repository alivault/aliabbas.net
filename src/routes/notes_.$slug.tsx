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
import MonoLabel, { monoLabelStyles } from '~/components/MonoLabel'
import PageHeading from '~/components/PageHeading'
import ScrollReveal from '~/components/ScrollReveal'
import Title from '~/components/Title'
import getFormattedDate from '~/lib/getFormattedDate'
import { cn } from '~/lib/utils'
import { getArticleBySlug, sanityClient } from '~/lib/sanity'

const builder = createImageUrlBuilder(sanityClient)

const portableTextComponents: PortableTextComponents = {
  block: {
    h1: ({ children }) => (
      <Title as="h1" variant="section">
        {children}
      </Title>
    ),
    h2: ({ children }) => (
      <Title as="h2" variant="card">
        {children}
      </Title>
    ),
    h3: ({ children }) => (
      <Title as="h3" variant="subsection">
        {children}
      </Title>
    ),
    h4: ({ children }) => (
      <Title as="h4" variant="detail">
        {children}
      </Title>
    ),
    h5: ({ children }) => (
      <Title as="h5" variant="detail">
        {children}
      </Title>
    ),
    h6: ({ children }) => (
      <Title as="h6" variant="detail">
        {children}
      </Title>
    ),
  },
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
            className="border-foreground/10 w-full border"
          />
          {value.alt && (
            <MonoLabel as="figcaption" className="mt-3">
              {value.alt}
            </MonoLabel>
          )}
        </figure>
      )
    },
  },
  marks: {
    code: ({ children }) => (
      <code className="bg-brand/10 text-brand px-1.5 py-0.5 font-mono text-sm">
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
        <div className="py-section mx-auto max-w-5xl px-5 sm:px-8">
          <div className="bg-foreground/5 h-96 animate-pulse" />
        </div>
      </Main>
    )
  }

  if (!note) {
    return (
      <Main>
        <section className="mx-auto flex min-h-[70svh] max-w-5xl flex-col items-center justify-center gap-5 px-5 text-center">
          <MonoLabel tone="brand">Missing note</MonoLabel>
          <PageHeading>Note not found.</PageHeading>
          <Link
            to="/notes"
            className="hover:text-brand text-xs font-bold uppercase"
          >
            ← Back to notes
          </Link>
        </section>
      </Main>
    )
  }

  return (
    <Main>
      <article className="py-section mx-auto max-w-[1440px] px-5 sm:px-8 lg:px-12">
        <Link
          to="/notes"
          className={cn(
            monoLabelStyles(),
            'hover:text-brand mb-section-content inline-flex items-center gap-2 transition-colors',
          )}
        >
          <ArrowLeft className="size-4" /> Back to field notes
        </Link>
        <ScrollReveal
          as="header"
          className="border-foreground/20 pb-section-divider mx-auto max-w-3xl border-b"
        >
          <MonoLabel as="time" tone="brand" dateTime={note.date}>
            {getFormattedDate(note.date)}
          </MonoLabel>
          <PageHeading className="mt-5">{note.title}</PageHeading>
          {note.description && (
            <p className="text-foreground/50 mt-7 max-w-2xl text-base leading-7 sm:text-lg sm:leading-8">
              {note.description}
            </p>
          )}
        </ScrollReveal>
        <ScrollReveal
          trigger="mount"
          delay={0.2}
          className="prose prose-lg prose-neutral prose-a:text-brand prose-pre:p-0 dark:prose-invert mt-section-divider mx-auto max-w-3xl"
        >
          <PortableText
            value={note.content}
            components={portableTextComponents}
          />
        </ScrollReveal>
      </article>
      <ScrollReveal className="pb-section mx-auto max-w-3xl px-5 sm:px-8">
        <Comments articleSlug={slug} />
      </ScrollReveal>
    </Main>
  )
}
