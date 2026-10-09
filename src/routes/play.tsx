import { createFileRoute } from '@tanstack/react-router'
import { ArrowUpRight } from 'lucide-react'
import Main from '~/components/Main'
import ScrollReveal from '~/components/ScrollReveal'
import '@fontsource/chakra-petch/latin-600.css'
import '@fontsource/chakra-petch/latin-700-italic.css'

const GAME_URL = 'https://averno.aliabbas.net'

const levels = [
  {
    name: 'The Intake',
    text: 'Rock shafts and ore halls. Learn to fly, then destroy the first reactor.',
    image: '/play/averno-intake-hall.webp',
  },
  {
    name: 'The Refinery',
    text: 'Pump stations and settling pools. Find two keys to reach the core.',
    image: '/play/averno-refinery.webp',
  },
  {
    name: 'The Crucible',
    text: 'A foundry over open lava. The Overseer shields the last reactor.',
    image: '/play/averno-crucible-core.webp',
  },
]

const features = [
  [
    'Six degrees of freedom',
    'Fly, strafe and roll through tunnels in any direction.',
  ],
  ['Three levels', 'Keys, locked doors, hidden survivors and a timed escape.'],
  [
    'Made from code',
    'Procedural textures, baked light and Blender-built robots.',
  ],
  ['Plays anywhere', 'Keyboard and mouse, gamepad, or touch on a phone.'],
]

export const Route = createFileRoute('/play')({
  head: () => ({
    meta: [
      { title: 'Averno — Ali Abbas' },
      {
        name: 'description',
        content:
          'Averno is a six-degrees-of-freedom shooter set in a dead mine. Destroy the reactors and escape before they blow.',
      },
      { property: 'og:title', content: 'Averno — Ali Abbas' },
      {
        property: 'og:description',
        content: 'A six-degrees-of-freedom shooter in a dead mine.',
      },
      { property: 'og:image', content: '/play/averno-intake-combat.webp' },
    ],
  }),
  component: PlayPage,
})

function PlayLink({ className = '' }: { className?: string }) {
  return (
    <a
      href={GAME_URL}
      className={`st-cut st-btn-primary st-display inline-flex h-14 items-center gap-3 px-7 text-lg font-semibold uppercase ${className}`}
    >
      Play Averno
      <ArrowUpRight size={20} />
    </a>
  )
}

function PlayPage() {
  return (
    <Main>
      <section className="py-section mx-auto max-w-[1600px] px-5 sm:px-8 lg:px-12">
        <ScrollReveal
          as="header"
          className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end"
        >
          <div>
            <p className="st-display text-foreground/55 text-sm font-semibold tracking-[0.3em] uppercase">
              A browser game
            </p>
            <h1 className="st-display mt-3 text-7xl leading-none font-bold italic sm:text-8xl lg:text-9xl">
              Averno
            </h1>
            <p className="text-foreground/65 mt-6 max-w-2xl text-base leading-7 lg:text-lg lg:leading-8">
              The descent is easy. Fly a mining ship down through a dead colony,
              destroy its three reactors, and climb back out before each one
              blows.
            </p>
          </div>
          <PlayLink className="justify-self-start" />
        </ScrollReveal>

        <ScrollReveal className="mt-12">
          <a
            href={GAME_URL}
            className="st-cut group relative block overflow-hidden bg-black"
          >
            <img
              src="/play/averno-intake-combat.webp"
              alt="The ship HUD in an ore hall of The Intake, with robots ahead"
              width={1600}
              height={900}
              className="aspect-video w-full object-cover transition-transform duration-700 group-hover:scale-[1.02]"
            />
          </a>
        </ScrollReveal>

        <ScrollReveal className="border-foreground/15 mt-16 grid gap-8 border-t pt-10 sm:grid-cols-2 lg:grid-cols-4">
          {features.map(([title, text]) => (
            <div key={title}>
              <h2 className="st-display text-lg font-semibold uppercase">
                {title}
              </h2>
              <p className="text-foreground/60 mt-2 leading-7">{text}</p>
            </div>
          ))}
        </ScrollReveal>

        <div className="mt-20 grid gap-10 md:grid-cols-3">
          {levels.map((level, index) => (
            <ScrollReveal key={level.name}>
              <img
                src={level.image}
                alt={`${level.name}, level ${index + 1} of Averno`}
                width={1600}
                height={900}
                loading="lazy"
                className="st-cut aspect-video w-full bg-black object-cover"
              />
              <p className="st-display text-foreground/45 mt-5 text-sm font-semibold tracking-widest uppercase">
                Level {index + 1}
              </p>
              <h3 className="st-display mt-1 text-2xl font-semibold uppercase">
                {level.name}
              </h3>
              <p className="text-foreground/60 mt-2 leading-7">{level.text}</p>
            </ScrollReveal>
          ))}
        </div>

        <ScrollReveal className="border-foreground/15 mt-20 flex flex-col gap-6 border-t pt-10 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-foreground/60 max-w-xl leading-7">
            Runs in a modern browser with WebGL 2. Best with a keyboard and
            mouse, and fully playable on a phone.
          </p>
          <PlayLink />
        </ScrollReveal>
      </section>
    </Main>
  )
}
