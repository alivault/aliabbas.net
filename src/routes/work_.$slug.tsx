import { createFileRoute, notFound } from '@tanstack/react-router'
import CaseStudyPage from '~/components/case-study/CaseStudyPage'
import { getCaseStudy } from '~/data/case-studies'

export const Route = createFileRoute('/work_/$slug')({
  loader: ({ params }) => {
    const study = getCaseStudy(params.slug)
    if (!study) throw notFound()
    return { slug: study.slug }
  },
  head: ({ loaderData }) => {
    const study = loaderData ? getCaseStudy(loaderData.slug) : undefined
    if (!study) return {}
    return {
      meta: [
        { title: `${study.title} case study — Ali Abbas` },
        { name: 'description', content: study.summary },
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
