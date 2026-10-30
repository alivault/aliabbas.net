import { createFileRoute, notFound } from '@tanstack/react-router'
import CaseStudyPage from '~/components/case-study/CaseStudyPage'
import { getCaseStudy } from '~/data/case-studies'
import {
  article,
  breadcrumbs,
  jsonLdScript,
  pageHead,
} from '~/lib/structured-data'

export const Route = createFileRoute('/work_/$slug')({
  loader: ({ params }) => {
    const study = getCaseStudy(params.slug)
    if (!study) throw notFound()
    return { slug: study.slug }
  },
  head: ({ loaderData }) => {
    const study = loaderData ? getCaseStudy(loaderData.slug) : undefined
    if (!study) return {}
    const path = `/work/${study.slug}`
    const title = `${study.title} case study — Ali Abbas`
    return {
      ...pageHead({ title, description: study.summary, path }),
      scripts: [
        jsonLdScript(
          article({
            type: 'TechArticle',
            title: `${study.title} case study`,
            description: study.summary,
            path,
          }),
          breadcrumbs([
            { name: 'Work', path: '/work' },
            { name: study.title, path },
          ]),
        ),
      ],
    }
  },
  component: CaseStudyRoute,
})

function CaseStudyRoute() {
  const { slug } = Route.useLoaderData()
  const study = getCaseStudy(slug)
  if (!study) return null
  return <CaseStudyPage study={study} />
}
