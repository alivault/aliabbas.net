import ScrollReveal from './ScrollReveal'

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
  const endYear = endDate ? new Date(endDate).getUTCFullYear() : 'Present'
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
      className="border-foreground/20 grid gap-5 border-b py-10 sm:grid-cols-[60px_180px_1fr] sm:py-14 lg:grid-cols-[80px_240px_1fr]"
    >
      <span className="text-foreground/30 font-mono text-[9px]">
        0{index + 1}
      </span>
      <div>
        <span className="text-foreground/40 font-mono text-[9px] tracking-[0.12em] uppercase">
          {formatDateRange(startDate, endDate)}
        </span>
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
        <h2 className="font-display text-4xl leading-none tracking-[-0.035em] sm:text-5xl">
          {title}
        </h2>
        <p className="text-foreground/55 mt-5 max-w-2xl text-sm leading-7 sm:text-base">
          {description}
        </p>
      </div>
    </ScrollReveal>
  )
}
