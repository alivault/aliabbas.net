import { ArrowUpRight } from 'lucide-react'
import { cn } from 'cn'

const PI_DURABLE_PREFIX = 'node_modules/@earendil-works/pi-durable'
const PI_DURABLE_HREF =
  'https://www.npmjs.com/package/@earendil-works/pi-durable'

function evidenceHref(path: string, baseHref?: string) {
  if (path.startsWith(PI_DURABLE_PREFIX)) return PI_DURABLE_HREF
  return baseHref ? `${baseHref}${path}` : undefined
}

function evidenceLabel(path: string) {
  return path.startsWith(PI_DURABLE_PREFIX)
    ? '@earendil-works/pi-durable · README'
    : path
}

export default function EvidenceList({
  paths,
  baseHref,
  className,
}: {
  paths: ReadonlyArray<string>
  baseHref?: string
  className?: string
}) {
  return (
    <ul className={cn('flex flex-wrap gap-2', className)}>
      {paths.map((path) => {
        const href = evidenceHref(path, baseHref)
        const label = evidenceLabel(path)
        const chip =
          'border-foreground/15 inline-flex max-w-full items-center gap-1.5 rounded-full border px-3.5 py-1.5 font-mono text-sm break-all'

        return (
          <li key={path} className="max-w-full">
            {href ? (
              <a
                href={href}
                target="_blank"
                rel="noreferrer"
                className={cn(
                  chip,
                  'hover:border-brand hover:text-brand focus-visible:outline-foreground transition-colors focus-visible:outline-2 focus-visible:outline-offset-2',
                )}
              >
                {label}
                <ArrowUpRight
                  className="size-3.5 shrink-0"
                  aria-hidden="true"
                />
                <span className="sr-only">(opens in a new tab)</span>
              </a>
            ) : (
              <code className={cn(chip, 'text-foreground/55')}>{label}</code>
            )}
          </li>
        )
      })}
    </ul>
  )
}
