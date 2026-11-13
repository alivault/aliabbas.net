import { PortableText } from '@portabletext/react'
import type { PortableTextComponents } from '@portabletext/react'
import { createImageUrlBuilder } from '@sanity/image-url'
import { CodeBlock } from '~/components/CodeBlock'
import SmartLink from '~/components/chat/SmartLink'
import { MermaidDiagram } from '~/components/MermaidDiagram'
import getFormattedDate from '~/lib/getFormattedDate'
import { sanityClient } from '~/lib/sanity'
import type { SanityNote } from '~/lib/sanity'
import { cn } from '~/lib/utils'
import NoteComments from './NoteComments'
import {
  Line,
  Reader,
  ReaderFigure,
  ReaderLink,
  ReaderLinks,
  ReaderMeta,
  ReaderText,
  ReaderTitle,
  hudText,
} from './Reader'

const builder = createImageUrlBuilder(sanityClient)

/** The width and height of a Sanity image, from its asset id. */
function imageSize(ref: string) {
  const match = /-(\d+)x(\d+)-/.exec(ref)
  return match
    ? { width: Number(match[1]), height: Number(match[2]) }
    : { width: 1600, height: 1000 }
}

const paragraph = 'text-fg-secondary mt-6 max-w-[60ch] text-base leading-7'

/**
 * The text of a note, in the style of the readers: headings in the HUD
 * face, body text in sentence case, code in mono. Links to this site go
 * through the router.
 */
const components: PortableTextComponents = {
  block: {
    normal: ({ children }) => <p className={paragraph}>{children}</p>,
    // The note title is the h1 of the page. The notes use h2 and h3 for
    // their parts: both are parts here, h2 in the HUD face.
    h1: ({ children }) => <h2 className={cn(hudText, 'mt-16')}>{children}</h2>,
    h2: ({ children }) => <h2 className={cn(hudText, 'mt-16')}>{children}</h2>,
    h3: ({ children }) => <h2 className={cn(hudText, 'mt-16')}>{children}</h2>,
    h4: ({ children }) => (
      <h3 className="text-foreground mt-10 max-w-[60ch] text-base font-semibold">
        {children}
      </h3>
    ),
    blockquote: ({ children }) => (
      <blockquote className="border-hud/50 text-fg-secondary mt-6 max-w-[60ch] border-l pl-5 text-base leading-7">
        {children}
      </blockquote>
    ),
  },
  list: {
    bullet: ({ children }) => (
      <ul className="marker:text-hud mt-6 flex max-w-[60ch] list-disc flex-col gap-2 pl-5">
        {children}
      </ul>
    ),
    number: ({ children }) => (
      <ol className="marker:text-hud mt-6 flex max-w-[60ch] list-decimal flex-col gap-2 pl-5">
        {children}
      </ol>
    ),
  },
  listItem: ({ children }) => (
    <li className="text-fg-secondary pl-1 text-base leading-7">{children}</li>
  ),
  marks: {
    code: ({ children }) => (
      <code className="bg-foreground/10 text-foreground px-1.5 py-0.5 font-mono text-sm">
        {children}
      </code>
    ),
    link: ({ children, value }) => (
      <SmartLink
        href={(value as { href?: string } | undefined)?.href}
        className="text-foreground decoration-hud/60 hover:decoration-hud underline underline-offset-4 transition-colors"
      >
        {children}
      </SmartLink>
    ),
  },
  types: {
    code: ({ value }) => (
      <div className="mt-8">
        <CodeBlock value={value} />
      </div>
    ),
    mermaidDiagram: MermaidDiagram,
    image: ({
      value,
    }: {
      value: { asset: { _ref: string }; alt?: string }
    }) => (
      <ReaderFigure
        src={builder.image(value).width(1600).auto('format').url()}
        alt={value.alt || ''}
        caption={value.alt}
        {...imageSize(value.asset._ref)}
      />
    ),
  },
}

/** A note, read beside the icon of the notes. */
export default function NoteReader({
  note,
  slug,
}: {
  note: SanityNote
  slug: string
}) {
  return (
    <Reader>
      <ReaderTitle>{note.title}</ReaderTitle>
      <ReaderMeta>
        <time dateTime={note.date}>({getFormattedDate(note.date)})</time>
      </ReaderMeta>
      {note.description ? <ReaderText>{note.description}</ReaderText> : null}
      {/* One block for the whole text: a long note must not fade in line
          by line. */}
      <Line>
        <PortableText value={note.content} components={components} />
      </Line>
      <NoteComments articleSlug={slug} />
      <ReaderLinks>
        <ReaderLink to="/notes">All notes</ReaderLink>
      </ReaderLinks>
    </Reader>
  )
}

/** While the note loads, or when there is no note at this address. */
export function NoteMissing({ loading }: { loading: boolean }) {
  return (
    <Reader>
      {loading ? (
        <ReaderMeta>Loading</ReaderMeta>
      ) : (
        <>
          <ReaderTitle>Note not found</ReaderTitle>
          <ReaderText>There is no note at this address.</ReaderText>
          <ReaderLinks>
            <ReaderLink to="/notes">All notes</ReaderLink>
          </ReaderLinks>
        </>
      )}
    </Reader>
  )
}
