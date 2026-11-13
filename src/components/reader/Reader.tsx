import { useEffect, useId, useRef, useState, useSyncExternalStore } from 'react'
import type { ComponentProps, ReactNode } from 'react'
import { createLink } from '@tanstack/react-router'
import { motion } from 'motion/react'
import type { Variants } from 'motion/react'
import { isHydrated } from '~/components/world/store'
import { LightboxProvider, useLightbox } from './Lightbox'
import { cn } from '~/lib/utils'
import { DURATIONS, EASE_OUT } from '~/lib/design/motion'

/**
 * The text of a page in the world: it shows on the left while the icon of
 * the page floats on the right. The zoom to the icon is the movement, so
 * the text does not move: each line fades in after the one above it.
 * Short lines (titles, labels, lists, links) use the HUD face in spaced
 * capitals. Long text uses the body face, so it stays easy to read.
 */

const container: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07, delayChildren: 0.05 } },
}

const item: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { duration: DURATIONS.reveal, ease: EASE_OUT },
  },
}

/** Spaced capitals in the HUD face. */
export const hudText =
  'font-hud text-hud text-xs tracking-[0.28em] sm:tracking-[0.42em] uppercase leading-[2.2]'

/**
 * The first state of the fade. A page in the server HTML, or in the
 * hydration of it, starts visible: text hidden until the scripts run would
 * delay the first paint. A page opened later fades in.
 */
function useEnterFrom(): 'hidden' | false {
  // While React hydrates, this is the server's answer (false), also for a
  // route that hydrates after the flag is set: the markup must match.
  const [from] = useState(isHydrated)
  const hydrating = !useSyncExternalStore(
    noSubscribe,
    () => true,
    () => false,
  )
  return from && !hydrating ? 'hidden' : false
}

const noSubscribe = () => () => {}

/**
 * The same staggered fade for a page that does not use Reader (the lab):
 * each StaggerItem fades in after the one before it.
 */
export function Stagger({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  const from = useEnterFrom()
  return (
    <motion.div
      initial={from}
      animate="show"
      variants={container}
      className={className}
    >
      {children}
    </motion.div>
  )
}

export function StaggerItem({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <motion.div variants={item} className={className}>
      {children}
    </motion.div>
  )
}

export function Reader({ children }: { children: ReactNode }) {
  const from = useEnterFrom()
  return (
    <main
      data-hud
      // The space above the text lets touches through to the world, so the
      // orb of the chat can be played with on a phone too.
      className="pointer-events-none relative z-10 min-h-svh px-6 pt-[44svh] pb-48 sm:px-16 lg:ml-[var(--frame-inset)] lg:w-[var(--reader-width)] lg:pt-[18svh]"
    >
      <motion.div
        initial={from}
        animate="show"
        variants={container}
        className="pointer-events-auto flex flex-col"
      >
        <LightboxProvider>{children}</LightboxProvider>
      </motion.div>
    </main>
  )
}

/** One block of the reader. It fades in after the block before it. */
export function Line({
  className,
  children,
}: {
  className?: string
  children: ReactNode
}) {
  return (
    <motion.div variants={item} className={className}>
      {children}
    </motion.div>
  )
}

export function ReaderTitle({ children }: { children: ReactNode }) {
  return (
    <motion.h1
      variants={item}
      className="font-hud text-hud text-lg leading-[1.9] tracking-[0.42em] text-balance uppercase"
    >
      {children}
    </motion.h1>
  )
}

/** A short line under the title, like the year or the kind of project. */
export function ReaderMeta({ children }: { children: ReactNode }) {
  return (
    <motion.p variants={item} className={cn(hudText, 'mt-6')}>
      {children}
    </motion.p>
  )
}

/** Body text, in sentence case. */
export function ReaderText({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <motion.p
      variants={item}
      className={cn(
        'text-fg-secondary mt-6 max-w-[60ch] text-base leading-7 text-pretty',
        className,
      )}
    >
      {children}
    </motion.p>
  )
}

/**
 * A titled part of the reader. Its lines fade in when it scrolls into view.
 */
export function ReaderSection({
  title,
  children,
  id,
}: {
  title: ReactNode
  children: ReactNode
  id?: string
}) {
  const from = useEnterFrom()
  return (
    <motion.section
      id={id}
      initial={from}
      whileInView="show"
      viewport={{ once: true, margin: '0px 0px -15% 0px' }}
      variants={container}
      className="mt-20 flex flex-col"
    >
      <motion.h2 variants={item} className={hudText}>
        {title}
      </motion.h2>
      {children}
    </motion.section>
  )
}

/** Short lines in the HUD face, one under the other. */
export function ReaderList({
  items,
  className,
}: {
  items: Array<ReactNode>
  className?: string
}) {
  return (
    <motion.ul variants={item} className={cn(hudText, 'mt-6', className)}>
      {items.map((entry, index) => (
        <li key={index}>{entry}</li>
      ))}
    </motion.ul>
  )
}

const linkStyle = 'hud-fill decoration-hud/50 underline underline-offset-[10px]'

/** A link inside the site, in the HUD face. Typed like a router Link. */
export const ReaderLink = createLink(function ReaderAnchor({
  className,
  ref,
  ...props
}: ComponentProps<'a'>) {
  return <a ref={ref} {...props} className={cn(linkStyle, className)} />
})

/** A link to another site. It opens in a new tab. */
export function ReaderExternal({
  href,
  children,
  className,
}: {
  href: string
  children: ReactNode
  className?: string
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className={cn(linkStyle, className)}
    >
      {children}
    </a>
  )
}

/** A row of links in the HUD face. */
export function ReaderLinks({ children }: { children: ReactNode }) {
  return (
    <motion.div
      variants={item}
      className={cn(hudText, 'mt-8 flex flex-wrap gap-x-10 gap-y-2')}
    >
      {children}
    </motion.div>
  )
}

/** A picture or a video, with an optional caption. */
export function ReaderFigure({
  src,
  alt,
  width,
  height,
  caption,
  video,
}: {
  src: string
  alt: string
  width: number
  height: number
  caption?: ReactNode
  /** A video to play in a loop, with `src` as its poster. */
  video?: string
}) {
  const id = useId()
  const media = useRef<HTMLButtonElement>(null)
  const lightbox = useLightbox()
  const register = lightbox?.register

  useEffect(() => {
    if (!register) return
    return register(id, {
      item: { src, alt, width, height, caption, video },
      element: media.current,
    })
  }, [register, id, src, alt, width, height, caption, video])

  // While the zoom view shows it, the figure leaves its place empty.
  const zoomed = lightbox?.openId === id
  const mediaClass =
    'border-hud/25 h-auto max-h-[80svh] w-auto max-w-full border'

  return (
    <motion.figure variants={item} className="mt-10">
      <button
        ref={media}
        type="button"
        aria-label={`Zoom: ${alt}`}
        aria-haspopup="dialog"
        onClick={() => lightbox?.open(id)}
        className={cn(
          'focus-visible:outline-hud block max-w-full cursor-zoom-in outline-none focus-visible:outline-1 focus-visible:outline-offset-4',
          zoomed && 'invisible',
        )}
      >
        {video ? (
          <video
            src={video}
            poster={src}
            width={width}
            height={height}
            muted
            loop
            playsInline
            autoPlay
            aria-hidden="true"
            className={mediaClass}
          />
        ) : (
          <img
            src={src}
            alt=""
            width={width}
            height={height}
            loading="lazy"
            decoding="async"
            className={mediaClass}
          />
        )}
      </button>
      {caption ? (
        <figcaption className="text-fg-muted mt-3 text-sm leading-6">
          {caption}
        </figcaption>
      ) : null}
    </motion.figure>
  )
}
