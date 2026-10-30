import Meta from './Meta'
import ScrollReveal from './ScrollReveal'
import Title from './Title'

interface ExperienceItemProps {
  index: number
  title: string
  company: string
  url?: string
  startDate: string
  endDate: string | null
  description: string
}

function formatDateRange(startDate: string, endDate: string | null): string {
  const startYear = new Date(startDate).getUTCFullYear()
  const endYear = endDate ? new Date(endDate).getUTCFullYear() : 2026
  return `${startYear} — ${endYear}`
}

export default function ExperienceItem({
  index,
  title,
  company,
  url,
  startDate,
  endDate,
  description,
}: ExperienceItemProps) {
  return (
    <ScrollReveal
      as="li"
      delay={index * 0.05}
      className="border-foreground/20 grid gap-5 border-b py-10 sm:grid-cols-[180px_1fr] sm:py-14 lg:grid-cols-[240px_1fr]"
    >
      <div>
        <Meta as="span">{formatDateRange(startDate, endDate)}</Meta>
        {url ? (
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-brand mt-3 block text-sm font-bold"
          >
            {company} ↗
          </a>
        ) : (
          <span className="mt-3 block text-sm font-bold">{company}</span>
        )}
      </div>
      <div>
        <Title as="h2" variant="card">
          {title}
        </Title>
        <p className="text-fg-muted mt-5 max-w-2xl text-sm leading-7 sm:text-base">
          {description}
        </p>
      </div>
    </ScrollReveal>
  )
}
