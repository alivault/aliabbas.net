import type { ComponentProps, ReactNode } from 'react'
import { createLink } from '@tanstack/react-router'
import { motion } from 'motion/react'
import type { Variants } from 'motion/react'
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
  'font-hud text-hud text-sm tracking-[0.42em] uppercase leading-[2.2]'

export function Reader({ children }: { children: ReactNode }) {
  return (
    <main
      data-hud
      className="relative z-10 min-h-svh px-6 pt-[44svh] pb-48 sm:px-16 lg:w-[54vw] lg:max-w-[820px] lg:pt-[18svh]"
    >
      <motion.div
        initial="hidden"
        animate="show"
        variants={container}
        className="flex flex-col"
      >
        {children}
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
  return (
    <motion.section
      id={id}
      initial="hidden"
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
  return (
    <motion.figure variants={item} className="mt-10">
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
          aria-label={alt}
          className="border-hud/25 h-auto max-h-[80svh] w-auto max-w-full border"
        />
      ) : (
        <img
          src={src}
          alt={alt}
          width={width}
          height={height}
          loading="lazy"
          decoding="async"
          className="border-hud/25 h-auto max-h-[80svh] w-auto max-w-full border"
        />
      )}
      {caption ? (
        <figcaption className="text-fg-muted mt-3 text-sm leading-6">
          {caption}
        </figcaption>
      ) : null}
    </motion.figure>
  )
}
