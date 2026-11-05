import ScrollReveal from '~/components/ScrollReveal'
import SectionHeading from '~/components/SectionHeading'
import type { CaseStudyMedia, ThemedImage } from '~/data/case-studies'
import { cn } from 'cn'

const frame = 'border-border overflow-hidden rounded-lg border'

/** A screenshot that follows the color scheme of the reader. */
export function ThemedPicture({
  image,
  className,
  loading = 'lazy',
}: {
  image: ThemedImage
  className?: string
  loading?: 'lazy' | 'eager'
}) {
  return (
    <picture>
      <source srcSet={image.dark} media="(prefers-color-scheme: dark)" />
      <img
        src={image.light}
        alt={image.alt}
        width={image.width}
        height={image.height}
        loading={loading}
        decoding="async"
        className={cn('block h-auto w-full', className)}
      />
    </picture>
  )
}

export function CaseStudyHero({ image }: { image: ThemedImage }) {
  return (
    <ScrollReveal trigger="mount" className={frame}>
      <ThemedPicture image={image} loading="eager" />
    </ScrollReveal>
  )
}

/** The demo video and the phone screenshot, side by side on wide screens. */
export function CaseStudyDemo({
  media,
  id,
  className,
}: {
  media: CaseStudyMedia
  id: string
  className?: string
}) {
  const { demo, phone } = media
  if (!demo) return null
  const headingId = `${id}-heading`

  return (
    <section
      id={id}
      aria-labelledby={headingId}
      className={cn('scroll-mt-21 lg:scroll-mt-36', className)}
    >
      <ScrollReveal className="pb-section-divider">
        <SectionHeading id={headingId}>{demo.title}</SectionHeading>
      </ScrollReveal>
      <ScrollReveal className="grid items-start gap-10 lg:grid-cols-[minmax(0,1fr)_auto] lg:gap-12">
        <figure className="min-w-0">
          <video
            src={demo.video}
            poster={demo.poster}
            width={demo.width}
            height={demo.height}
            controls
            muted
            playsInline
            preload="metadata"
            aria-describedby={`${id}-caption`}
            className={cn(frame, 'block h-auto w-full bg-black')}
          />
          <figcaption
            id={`${id}-caption`}
            className="text-fg-muted mt-4 max-w-2xl text-base leading-7"
          >
            {demo.caption}
          </figcaption>
        </figure>
        {phone && (
          <figure className="mx-auto w-full max-w-xs lg:w-72">
            <div className={cn(frame, 'rounded-2xl')}>
              <ThemedPicture image={phone} />
            </div>
            <figcaption className="text-fg-muted mt-4 text-base leading-7">
              {phone.caption}
            </figcaption>
          </figure>
        )}
      </ScrollReveal>
    </section>
  )
}
