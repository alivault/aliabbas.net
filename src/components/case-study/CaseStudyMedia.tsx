import ScrollReveal from '~/components/ScrollReveal'
import SectionHeading from '~/components/SectionHeading'
import type {
  CaseStudyFigure,
  CaseStudyImage,
  CaseStudyMedia,
} from '~/data/case-studies'
import { cn } from 'cn'

const frame = 'border-border overflow-hidden rounded-lg border'
const caption = 'text-fg-muted mt-4 text-base leading-7'

/** A screenshot. With a dark version, it follows the color scheme of the
 * reader. */
export function CaseStudyPicture({
  image,
  className,
  loading = 'lazy',
}: {
  image: CaseStudyImage
  className?: string
  loading?: 'lazy' | 'eager'
}) {
  return (
    <picture>
      {image.dark && (
        <source srcSet={image.dark} media="(prefers-color-scheme: dark)" />
      )}
      <img
        src={image.src}
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

export function CaseStudyHero({ image }: { image: CaseStudyImage }) {
  return (
    <ScrollReveal trigger="mount" className={frame}>
      <CaseStudyPicture image={image} loading="eager" />
    </ScrollReveal>
  )
}

/** A screenshot with its caption, for example in a failure mode. */
export function CaseStudyFigureBlock({
  figure,
  className,
}: {
  figure: CaseStudyFigure
  className?: string
}) {
  return (
    <figure className={cn('min-w-0', className)}>
      <div className={frame}>
        <CaseStudyPicture image={figure.image} />
      </div>
      <figcaption className={caption}>{figure.caption}</figcaption>
    </figure>
  )
}

function PhoneFigure({ figure }: { figure: CaseStudyFigure }) {
  return (
    <figure className="mx-auto w-full max-w-xs lg:w-72">
      <div className={cn(frame, 'rounded-2xl')}>
        <CaseStudyPicture image={figure.image} />
      </div>
      <figcaption className={caption}>{figure.caption}</figcaption>
    </figure>
  )
}

/** The label of the media section in the section nav, if the study has
 * one. */
export function mediaSectionLabel(media?: CaseStudyMedia) {
  if (media?.demo) return 'Demo'
  if (media?.gallery) return 'Screens'
  return undefined
}

/** The demo video or the screenshots, with the phone screenshot beside
 * them on wide screens. */
export function CaseStudyDemo({
  media,
  id,
  className,
}: {
  media: CaseStudyMedia
  id: string
  className?: string
}) {
  const { demo, phone, gallery } = media
  const title = demo?.title ?? gallery?.title
  if (!title) return null
  const headingId = `${id}-heading`

  return (
    <section
      id={id}
      aria-labelledby={headingId}
      className={cn('scroll-mt-21 lg:scroll-mt-36', className)}
    >
      <ScrollReveal className="pb-section-divider">
        <SectionHeading id={headingId}>{title}</SectionHeading>
        {gallery?.intro && (
          <p className="text-fg-muted mt-4 max-w-2xl text-base leading-7">
            {gallery.intro}
          </p>
        )}
      </ScrollReveal>
      <ScrollReveal className="grid items-start gap-10 lg:grid-cols-[minmax(0,1fr)_auto] lg:gap-12">
        {demo ? (
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
              className={cn(caption, 'max-w-2xl')}
            >
              {demo.caption}
            </figcaption>
          </figure>
        ) : (
          gallery && (
            <div className="grid min-w-0 gap-10 sm:grid-cols-2 sm:gap-x-8">
              {gallery.figures.map((figure) => (
                <CaseStudyFigureBlock key={figure.image.src} figure={figure} />
              ))}
            </div>
          )
        )}
        {phone && <PhoneFigure figure={phone} />}
      </ScrollReveal>
    </section>
  )
}
