import { useQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import NoteReader, { NoteMissing } from '~/components/reader/NoteReader'
import { articleQuery } from '~/lib/sanity'
import {
  article,
  breadcrumbs,
  jsonLdScript,
  pageHead,
} from '~/lib/structured-data'

export const Route = createFileRoute('/notes_/$slug')({
  loader: async ({ context, params }) => {
    const note = await context.queryClient
      .ensureQueryData(articleQuery(params.slug))
      .catch(() => undefined)
    // undefined: the fetch failed, and the component tries again.
    if (note === undefined) return { slug: params.slug, found: undefined }
    return {
      slug: params.slug,
      found: note
        ? { title: note.title, description: note.description, date: note.date }
        : null,
    }
  },
  head: ({ loaderData }) => {
    const note = loaderData?.found
    if (note === null) {
      return {
        meta: [
          { title: 'Note not found — Ali Abbas' },
          { name: 'robots', content: 'noindex' },
        ],
      }
    }
    if (!note || !loaderData) return {}
    const path = `/notes/${loaderData.slug}`
    return {
      ...pageHead({
        title: `${note.title} — Ali Abbas`,
        description: note.description,
        path,
        type: 'article',
      }),
      scripts: [
        jsonLdScript(
          article({
            title: note.title,
            description: note.description,
            path,
            datePublished: note.date,
          }),
          breadcrumbs([
            { name: 'Notes', path: '/notes' },
            { name: note.title, path },
          ]),
        ),
      ],
    }
  },
  component: NotePage,
})

function NotePage() {
  const { slug } = Route.useParams()
  const { data: note, isLoading } = useQuery(articleQuery(slug))
  if (!note) return <NoteMissing loading={isLoading} />
  return <NoteReader note={note} slug={slug} />
}
