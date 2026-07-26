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
  const startYear = new Date(startDate).getFullYear()
  const endYear = endDate ? new Date(endDate).getFullYear() : 'Present'
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
    <li className="grid gap-5 border-b border-black/20 py-10 sm:grid-cols-[60px_180px_1fr] sm:py-14 lg:grid-cols-[80px_240px_1fr]">
      <span className="font-mono text-[9px] text-black/30">0{index + 1}</span>
      <div>
        <span className="font-mono text-[9px] tracking-[0.12em] text-black/40 uppercase">
          {formatDateRange(startDate, endDate)}
        </span>
        {url ? (
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 block text-sm font-bold hover:text-[#335cff]"
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
        <p className="mt-5 max-w-2xl text-sm leading-7 text-black/55 sm:text-base">
          {description}
        </p>
      </div>
    </li>
  )
}
