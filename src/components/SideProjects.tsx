import { Link } from '@tanstack/react-router'
import { ArrowRight, ArrowUpRight } from 'lucide-react'
import { motion } from 'motion/react'
import Meta from '~/components/Meta'
import ScrollReveal from '~/components/ScrollReveal'
import SectionHeading from '~/components/SectionHeading'
import Title from '~/components/Title'
import { ButtonAnchor, ButtonLink } from '~/components/ui/button'
import { SPRINGS } from '~/lib/design/motion'

const visualStyles =
  'focus-visible:outline-foreground relative block aspect-video overflow-hidden rounded-[2px] focus-visible:outline-2 focus-visible:outline-offset-4'

const chromaginePetals = [
  '#ff375f',
  '#ff9f0a',
  '#ffd60a',
  '#30d158',
  '#64d2ff',
  '#0a84ff',
  '#bf5af2',
  '#ff2d95',
] as const

/** Eight color petals on the blue of Chromagine. Each petal answers the pointer. */
function ChromagineMark() {
  return (
    <div
      aria-hidden="true"
      className="absolute top-1/2 left-1/2 aspect-square h-[70%] -translate-x-1/2 -translate-y-1/2"
    >
      {chromaginePetals.map((color, petalIndex) => (
        <span
          key={color}
          className="pointer-events-none absolute inset-0"
          style={{ transform: `rotate(${petalIndex * 45}deg)` }}
        >
          <motion.span
            whileHover={{ scale: 1.14, y: -8, opacity: 1 }}
            transition={SPRINGS.hover}
            className="pointer-events-auto absolute top-[2%] left-1/2 h-[43%] w-[29%] origin-bottom -translate-x-1/2 rounded-[999px] border border-white/35 opacity-90 mix-blend-screen"
            style={{ backgroundColor: color }}
          />
        </span>
      ))}
    </div>
  )
}

function Averno() {
  return (
    <ScrollReveal as="article" className="flex flex-col">
      <Link
        to="/play"
        tabIndex={-1}
        aria-hidden="true"
        className={`${visualStyles} bg-black`}
      >
        <img
          src="/play/averno-crucible-core.webp"
          alt=""
          width={1600}
          height={900}
          loading="lazy"
          className="size-full object-cover transition-transform duration-500 hover:scale-[1.04]"
        />
      </Link>
      <Title as="h3" variant="card" className="mt-6">
        Averno
      </Title>
      <Meta className="mt-1">Browser game · 3D · 2026</Meta>
      <p className="text-fg-muted mt-3 text-base leading-7 text-pretty">
        A 3D shooter that runs in the browser on a computer or a phone. Three.js
        and React, light baked in a web worker, and one input model for
        keyboard, gamepad and touch.
      </p>
      {/* As in the work rows: the first action is the primary one. */}
      <div className="mt-6 flex flex-wrap gap-3">
        <ButtonLink to="/play">
          Play the game
          <ArrowRight aria-hidden="true" />
        </ButtonLink>
        <ButtonLink
          to="/notes/$slug"
          params={{
            slug: 'averno-engineering-a-3d-shooter-for-the-browser',
          }}
          variant="secondary"
        >
          How it’s built
          <ArrowRight aria-hidden="true" />
        </ButtonLink>
      </div>
    </ScrollReveal>
  )
}

function Chromagine() {
  const href = 'https://chromagine.aliabbas.net/'
  return (
    <ScrollReveal as="article" className="flex flex-col">
      <a
        href={href}
        target="_blank"
        rel="noreferrer"
        tabIndex={-1}
        aria-hidden="true"
        className={`${visualStyles} isolate bg-[#335cff]`}
      >
        <ChromagineMark />
      </a>
      <Title as="h3" variant="card" className="mt-6">
        Chromagine
      </Title>
      <Meta className="mt-1">Creative tool · Color · 2025</Meta>
      <p className="text-fg-muted mt-3 text-base leading-7 text-pretty">
        A joyful utility for creating harmonious palettes with perceptual color
        models instead of guesswork.
      </p>
      <div className="mt-6 flex flex-wrap gap-3">
        <ButtonAnchor href={href}>
          Visit site
          <ArrowUpRight aria-hidden="true" />
          <span className="sr-only">: Chromagine (opens in a new tab)</span>
        </ButtonAnchor>
      </div>
    </ScrollReveal>
  )
}

/** Smaller entries below the main work: projects made for fun, not for clients. */
export default function SideProjects() {
  return (
    <section
      aria-labelledby="side-projects"
      className="pb-section mx-auto max-w-[1600px] px-5 sm:px-8 lg:px-12"
    >
      <div>
        <ScrollReveal as="header" className="pb-section-content">
          <SectionHeading size="compact" id="side-projects">
            Side projects
          </SectionHeading>
        </ScrollReveal>
        <div className="grid gap-12 md:grid-cols-2 md:gap-x-10">
          <Averno />
          <Chromagine />
        </div>
      </div>
    </section>
  )
}
